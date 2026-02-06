import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockchainService } from '../blockchain/blockchain.service';
import { RelayerWalletService } from '../blockchain/relayer-wallet.service';
import { GasOracleService } from '../blockchain/gas-oracle.service';
import { FeeService } from '../fee/fee.service';
import { RelayRequestDto } from './dto/relay-request.dto';
import { RelayResponseDto, RelayStatusDto } from './dto/relay-response.dto';
import {
  concat,
  encodeAbiParameters,
  encodeFunctionData,
  formatEther,
  keccak256,
  parseAbiParameters,
  recoverAddress,
  type SignedAuthorization,
  toBytes,
} from 'viem';

@Injectable()
export class RelayService {
  private readonly logger = new Logger(RelayService.name);

  // EIP-712 domain type hash
  private readonly DOMAIN_TYPEHASH = keccak256(
    Buffer.from(
      'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)',
    ),
  );

  // Intent type hash (for single execute)
  private readonly INTENT_TYPEHASH = keccak256(
    Buffer.from(
      'Intent(address destination,uint256 value,bytes data,uint256 nonce,uint256 deadline)',
    ),
  );

  // BatchedIntent type hash (for executeBatch with fees)
  private readonly BATCHED_INTENT_TYPEHASH = keccak256(
    Buffer.from(
      'BatchedIntent(Call[] calls,uint256 nonce,uint256 deadline)Call(address destination,uint256 value,bytes data)',
    ),
  );

  // Call type hash (used in BatchedIntent)
  private readonly CALL_TYPEHASH = keccak256(
    Buffer.from('Call(address destination,uint256 value,bytes data)'),
  );

  constructor(
    private configService: ConfigService,
    private blockchainService: BlockchainService,
    private relayerWalletService: RelayerWalletService,
    private gasOracleService: GasOracleService,
    private feeService: FeeService,
  ) {}

  async relay(request: RelayRequestDto): Promise<RelayResponseDto> {
    // Log incoming request for debugging
    this.logger.debug(`Relay request received for user: ${request.userAddress}`);
    this.logger.debug(`Authorization present: ${!!request.authorization}`);
    if (request.authorization) {
      this.logger.debug(
        `Authorization details: chainId=${request.authorization.chainId}, ` +
          `contractAddress=${request.authorization.contractAddress}, ` +
          `nonce=${request.authorization.nonce}`,
      );
    }
    this.logger.debug(`Fee present: ${!!request.fee}`);

    // 1. Validate chain ID
    const supportedChainId = this.blockchainService.getChainId();
    if (request.chainId !== supportedChainId) {
      throw new BadRequestException(
        `Chain ID mismatch. Backend supports chain ${supportedChainId}, received ${request.chainId}`,
      );
    }

    // 2. Verify deadline
    let deadline: bigint;
    try {
      deadline = BigInt(request.intent.deadline);
    } catch (error) {
      throw new BadRequestException(`Invalid deadline format: ${error}`);
    }

    const now = BigInt(Math.floor(Date.now() / 1000));
    if (deadline <= now) {
      throw new BadRequestException('Intent deadline has expired');
    }

    // 3. Check gas price
    const maxGasPriceGwei = this.configService.get<number>('maxGasPriceGwei')!;
    const gasPriceOk =
      await this.gasOracleService.isGasPriceAcceptable(maxGasPriceGwei);
    if (!gasPriceOk) {
      throw new BadRequestException(
        'Gas price too high, relay temporarily unavailable',
      );
    }

    // 4. Route to appropriate handler based on whether fee is included
    if (request.fee) {
      return this.relayWithFee(request);
    } else {
      return this.relayLegacy(request);
    }
  }

  /**
   * Legacy relay without fee collection (backward compatible)
   * Uses single execute() function
   */
  private async relayLegacy(
    request: RelayRequestDto,
  ): Promise<RelayResponseDto> {
    // Compute EIP-712 digest
    const digest = this.computeDigest(request);

    // Recover signer
    let recoveredAddress: string;
    try {
      recoveredAddress = await recoverAddress({
        hash: digest,
        signature: request.signature as `0x${string}`,
      });
    } catch (error) {
      throw new BadRequestException(
        `Invalid signature format: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }

    // Verify signer matches userAddress
    if (recoveredAddress.toLowerCase() !== request.userAddress.toLowerCase()) {
      throw new BadRequestException(
        `Signature verification failed. Expected ${request.userAddress}, got ${recoveredAddress}`,
      );
    }

    this.logger.log(
      `Relaying legacy transaction for ${request.userAddress} (no fee)`,
    );

    try {
      const txHash = await this.broadcastTransaction(request);

      this.logger.log(`Transaction relayed: ${txHash}`);

      return {
        txHash,
        status: 'submitted',
        message: 'Transaction successfully submitted to the network',
      };
    } catch (error) {
      this.logger.error(
        `Failed to broadcast transaction: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to broadcast transaction');
    }
  }

  /**
   * Relay with fee collection using executeBatch
   * Executes both user transfer and fee transfer atomically
   */
  private async relayWithFee(
    request: RelayRequestDto,
  ): Promise<RelayResponseDto> {
    const fee = request.fee!;

    // Verify fee quote signature
    const feeDeadline = parseInt(request.intent.deadline, 10);
    const isValidFee = this.feeService.verifyFeeQuote(
      fee.feeAmount,
      fee.feeToken,
      feeDeadline,
      fee.feeSignature,
    );

    if (!isValidFee) {
      throw new BadRequestException('Invalid or expired fee quote');
    }

    // Build the two calls: user transfer + fee transfer
    const relayerAddress = this.relayerWalletService.getAddress();
    const calls = [
      {
        destination: request.intent.destination as `0x${string}`,
        value: BigInt(request.intent.value),
        data: request.intent.data as `0x${string}`,
      },
      {
        destination: fee.feeToken as `0x${string}`,
        value: 0n,
        data: encodeFunctionData({
          abi: [
            {
              name: 'transfer',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'to', type: 'address' },
                { name: 'amount', type: 'uint256' },
              ],
              outputs: [{ name: '', type: 'bool' }],
            },
          ],
          functionName: 'transfer',
          args: [relayerAddress, BigInt(fee.feeAmount)],
        }),
      },
    ];

    // Compute batch digest
    const digest = this.computeBatchDigest(
      calls,
      BigInt(request.intent.nonce),
      BigInt(request.intent.deadline),
      request.chainId,
    );

    // Recover signer from batch signature
    let recoveredAddress: string;
    try {
      recoveredAddress = await recoverAddress({
        hash: digest,
        signature: request.signature as `0x${string}`,
      });
    } catch (error) {
      throw new BadRequestException(
        `Invalid signature format: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }

    // Verify signer matches userAddress
    if (recoveredAddress.toLowerCase() !== request.userAddress.toLowerCase()) {
      throw new BadRequestException(
        `Batch signature verification failed. Expected ${request.userAddress}, got ${recoveredAddress}`,
      );
    }

    this.logger.log(
      `Relaying batch transaction for ${request.userAddress} with fee ${fee.feeAmount}`,
    );

    try {
      const txHash = await this.broadcastBatchTransaction(request, calls);

      this.logger.log(`Batch transaction relayed: ${txHash}`);

      return {
        txHash,
        status: 'submitted',
        message: 'Transaction with fee successfully submitted to the network',
      };
    } catch (error) {
      this.logger.error(
        `Failed to broadcast batch transaction: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to broadcast batch transaction',
      );
    }
  }

  async getStatus(): Promise<RelayStatusDto> {
    const relayerAddress = this.relayerWalletService.getAddress();
    const chainId = this.blockchainService.getChainId();
    const publicClient = this.blockchainService.getPublicClient();

    const balance = await publicClient.getBalance({ address: relayerAddress });
    const balanceEther = formatEther(balance);

    // Consider healthy if balance > 0.1 native tokens
    const healthy = balance > BigInt(10) ** BigInt(17); // 0.1 in wei

    this.logger.debug(
      `Relayer status: ${balanceEther} balance, healthy=${healthy}`,
    );

    return {
      relayerAddress,
      balance: balanceEther,
      chainId,
      healthy,
    };
  }

  private computeDigest(request: RelayRequestDto): `0x${string}` {
    // Use the DelegatedAccount implementation contract as verifyingContract
    // This matches the frontend and contract domain separator
    const verifyingContract = this.configService.get<`0x${string}`>(
      'contracts.delegatedAccount',
    )!;

    // Compute domain separator using implementation contract as verifyingContract
    const domainSeparator = keccak256(
      encodeAbiParameters(
        parseAbiParameters('bytes32, bytes32, bytes32, uint256, address'),
        [
          this.DOMAIN_TYPEHASH,
          keccak256(toBytes('DelegatedAccount')),
          keccak256(toBytes('1')),
          BigInt(request.chainId),
          verifyingContract,
        ],
      ),
    );

    // Compute intent hash (matches contract's INTENT_TYPEHASH - without account)
    const intentHash = keccak256(
      encodeAbiParameters(
        parseAbiParameters(
          'bytes32, address, uint256, bytes32, uint256, uint256',
        ),
        [
          this.INTENT_TYPEHASH,
          request.intent.destination as `0x${string}`,
          BigInt(request.intent.value),
          keccak256(request.intent.data as `0x${string}`),
          BigInt(request.intent.nonce),
          BigInt(request.intent.deadline),
        ],
      ),
    );

    // Compute final EIP-712 digest using raw concatenation (NOT ABI encoding!)
    // The format is: keccak256("\x19\x01" || domainSeparator || structHash)
    return keccak256(concat(['0x1901', domainSeparator, intentHash]));
  }

  private async broadcastTransaction(
    request: RelayRequestDto,
  ): Promise<string> {
    const publicClient = this.blockchainService.getPublicClient();
    const walletClient = this.blockchainService.getWalletClient();
    const relayerAccount = this.relayerWalletService.getAccount();

    // EIP-7702 execute ABI - simplified since address(this) is the user's EOA with delegation
    const executeAbi = [
      {
        inputs: [
          { name: 'destination', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'data', type: 'bytes' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'signature', type: 'bytes' },
        ],
        name: 'execute',
        outputs: [{ name: '', type: 'bytes' }],
        stateMutability: 'payable',
        type: 'function',
      },
    ] as const;

    // Prepare function call data
    const functionData = encodeFunctionData({
      abi: executeAbi,
      functionName: 'execute',
      args: [
        request.intent.destination as `0x${string}`,
        BigInt(request.intent.value),
        request.intent.data as `0x${string}`,
        BigInt(request.intent.nonce),
        BigInt(request.intent.deadline),
        request.signature as `0x${string}`,
      ],
    });

    // Build authorization list if provided (for EIP-7702 Type 4 transaction)
    const authorizationList: SignedAuthorization[] = [];
    if (request.authorization) {
      authorizationList.push({
        chainId: request.authorization.chainId,
        address: request.authorization.contractAddress as `0x${string}`,
        nonce: parseInt(request.authorization.nonce, 10),
        r: request.authorization.r as `0x${string}`,
        s: request.authorization.s as `0x${string}`,
        yParity: request.authorization.yParity as 0 | 1,
      });
      this.logger.log(
        `Including EIP-7702 authorization for contract ${request.authorization.contractAddress}`,
      );
    } else {
      this.logger.warn(
        'No EIP-7702 authorization provided - EOA will NOT be delegated! ' +
          'This will fail if the EOA has not previously been delegated.',
      );
    }

    // With EIP-7702, the user's EOA temporarily has the DelegatedAccount code
    // So we call the user's address directly (it behaves as the contract)
    const targetAddress = request.userAddress as `0x${string}`;

    // Estimate gas for the EIP-7702 transaction
    // Many RPC nodes don't yet support authorizationList in eth_estimateGas,
    // so we use a fallback gas estimate from config if estimation fails
    let gasEstimate: bigint;
    try {
      gasEstimate = await publicClient.estimateGas({
        account: relayerAccount,
        to: targetAddress,
        data: functionData,
        authorizationList:
          authorizationList.length > 0 ? authorizationList : undefined,
      });
      this.logger.debug(`Gas estimated via RPC: ${gasEstimate}`);
    } catch (estimateError) {
      // Fall back to configured gas estimate when EIP-7702 estimation fails
      const fallbackGas = BigInt(
        this.configService.get<number>('fee.estimatedGas') || 300000,
      );
      this.logger.warn(
        `Gas estimation failed (likely EIP-7702 not supported in eth_estimateGas), using fallback: ${fallbackGas}`,
      );
      this.logger.debug(`Estimation error: ${estimateError.message}`);
      gasEstimate = fallbackGas;
    }

    // Send EIP-7702 Type 4 transaction
    // The authorization list temporarily designates the DelegatedAccount contract onto the user's EOA
    const hash = await walletClient.sendTransaction({
      account: relayerAccount,
      to: targetAddress,
      data: functionData,
      gas: gasEstimate,
      chain: publicClient.chain,
      authorizationList:
        authorizationList.length > 0 ? authorizationList : undefined,
    });

    return hash;
  }

  /**
   * Compute EIP-712 digest for batched intent
   */
  private computeBatchDigest(
    calls: Array<{
      destination: `0x${string}`;
      value: bigint;
      data: `0x${string}`;
    }>,
    nonce: bigint,
    deadline: bigint,
    chainId: number,
  ): `0x${string}` {
    const verifyingContract = this.configService.get<`0x${string}`>(
      'contracts.delegatedAccount',
    )!;

    // Compute domain separator
    const domainSeparator = keccak256(
      encodeAbiParameters(
        parseAbiParameters('bytes32, bytes32, bytes32, uint256, address'),
        [
          this.DOMAIN_TYPEHASH,
          keccak256(toBytes('DelegatedAccount')),
          keccak256(toBytes('1')),
          BigInt(chainId),
          verifyingContract,
        ],
      ),
    );

    // Compute hash for each call
    const callHashes: `0x${string}`[] = [];
    for (const call of calls) {
      const callHash = keccak256(
        encodeAbiParameters(
          parseAbiParameters('bytes32, address, uint256, bytes32'),
          [
            this.CALL_TYPEHASH,
            call.destination,
            call.value,
            keccak256(call.data),
          ],
        ),
      );
      callHashes.push(callHash);
    }

    // Compute array hash (keccak256 of concatenated call hashes)
    const callsArrayHash = keccak256(
      concat(callHashes) as `0x${string}`,
    );

    // Compute BatchedIntent struct hash
    const structHash = keccak256(
      encodeAbiParameters(
        parseAbiParameters('bytes32, bytes32, uint256, uint256'),
        [this.BATCHED_INTENT_TYPEHASH, callsArrayHash, nonce, deadline],
      ),
    );

    // Compute final EIP-712 digest
    return keccak256(concat(['0x1901', domainSeparator, structHash]));
  }

  /**
   * Broadcast batch transaction using executeBatch
   */
  private async broadcastBatchTransaction(
    request: RelayRequestDto,
    calls: Array<{
      destination: `0x${string}`;
      value: bigint;
      data: `0x${string}`;
    }>,
  ): Promise<string> {
    const publicClient = this.blockchainService.getPublicClient();
    const walletClient = this.blockchainService.getWalletClient();
    const relayerAccount = this.relayerWalletService.getAccount();

    // EIP-7702 executeBatch ABI
    const executeBatchAbi = [
      {
        inputs: [
          {
            name: 'calls',
            type: 'tuple[]',
            components: [
              { name: 'destination', type: 'address' },
              { name: 'value', type: 'uint256' },
              { name: 'data', type: 'bytes' },
            ],
          },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'signature', type: 'bytes' },
        ],
        name: 'executeBatch',
        outputs: [{ name: '', type: 'bytes[]' }],
        stateMutability: 'payable',
        type: 'function',
      },
    ] as const;

    // Prepare function call data
    const functionData = encodeFunctionData({
      abi: executeBatchAbi,
      functionName: 'executeBatch',
      args: [
        calls.map((c) => ({
          destination: c.destination,
          value: c.value,
          data: c.data,
        })),
        BigInt(request.intent.nonce),
        BigInt(request.intent.deadline),
        request.signature as `0x${string}`,
      ],
    });

    // Build authorization list if provided
    const authorizationList: SignedAuthorization[] = [];
    if (request.authorization) {
      authorizationList.push({
        chainId: request.authorization.chainId,
        address: request.authorization.contractAddress as `0x${string}`,
        nonce: parseInt(request.authorization.nonce, 10),
        r: request.authorization.r as `0x${string}`,
        s: request.authorization.s as `0x${string}`,
        yParity: request.authorization.yParity as 0 | 1,
      });
      this.logger.log(
        `Including EIP-7702 authorization for contract ${request.authorization.contractAddress}`,
      );
    } else {
      this.logger.warn(
        'No EIP-7702 authorization provided - EOA will NOT be delegated! ' +
          'This will fail if the EOA has not previously been delegated.',
      );
    }

    const targetAddress = request.userAddress as `0x${string}`;

    // Estimate gas
    let gasEstimate: bigint;
    try {
      gasEstimate = await publicClient.estimateGas({
        account: relayerAccount,
        to: targetAddress,
        data: functionData,
        authorizationList:
          authorizationList.length > 0 ? authorizationList : undefined,
      });
      this.logger.debug(`Batch gas estimated via RPC: ${gasEstimate}`);
    } catch (estimateError) {
      // Fall back to configured gas estimate plus extra for batch
      const fallbackGas = BigInt(
        this.configService.get<number>('fee.estimatedGas') || 300000,
      );
      // Add 50% buffer for batch execution overhead
      const batchGas = (fallbackGas * 150n) / 100n;
      this.logger.warn(
        `Batch gas estimation failed, using fallback: ${batchGas}`,
      );
      this.logger.debug(`Estimation error: ${estimateError.message}`);
      gasEstimate = batchGas;
    }

    // Send EIP-7702 Type 4 transaction
    const hash = await walletClient.sendTransaction({
      account: relayerAccount,
      to: targetAddress,
      data: functionData,
      gas: gasEstimate,
      chain: publicClient.chain,
      authorizationList:
        authorizationList.length > 0 ? authorizationList : undefined,
    });

    return hash;
  }
}
