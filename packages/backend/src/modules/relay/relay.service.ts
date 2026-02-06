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

  // Intent type hash
  private readonly INTENT_TYPEHASH = keccak256(
    Buffer.from(
      'Intent(address destination,uint256 value,bytes data,uint256 nonce,uint256 deadline)',
    ),
  );

  constructor(
    private configService: ConfigService,
    private blockchainService: BlockchainService,
    private relayerWalletService: RelayerWalletService,
    private gasOracleService: GasOracleService,
  ) {}

  async relay(request: RelayRequestDto): Promise<RelayResponseDto> {
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

    // 3. Compute EIP-712 digest
    const digest = this.computeDigest(request);

    // 4. Recover signer
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

    // 5. Verify signer matches userAddress
    if (recoveredAddress.toLowerCase() !== request.userAddress.toLowerCase()) {
      throw new BadRequestException(
        `Signature verification failed. Expected ${request.userAddress}, got ${recoveredAddress}`,
      );
    }

    // 6. Check gas price
    const maxGasPriceGwei = this.configService.get<number>('maxGasPriceGwei')!;
    const gasPriceOk =
      await this.gasOracleService.isGasPriceAcceptable(maxGasPriceGwei);
    if (!gasPriceOk) {
      throw new BadRequestException(
        'Gas price too high, relay temporarily unavailable',
      );
    }

    // 7. Simulate transaction (simplified - in production use eth_call)
    this.logger.log(`Simulating transaction for ${request.userAddress}`);

    // 8. Build and broadcast EIP-7702 transaction
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
}
