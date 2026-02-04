import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockchainService } from '../blockchain/blockchain.service';
import { RelayerWalletService } from '../blockchain/relayer-wallet.service';
import { GasOracleService } from '../blockchain/gas-oracle.service';
import { RelayRequestDto } from './dto/relay-request.dto';
import { RelayResponseDto, RelayStatusDto } from './dto/relay-response.dto';
import {
  keccak256,
  recoverAddress,
  encodeAbiParameters,
  parseAbiParameters,
  formatEther,
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
    const deadline = BigInt(request.intent.deadline);
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (deadline <= now) {
      throw new BadRequestException('Intent deadline has expired');
    }

    // 3. Compute EIP-712 digest
    const digest = this.computeDigest(request);

    // 4. Recover signer
    const recoveredAddress = await recoverAddress({
      hash: digest,
      signature: request.signature as `0x${string}`,
    });

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
    const delegatedAccountAddress = this.configService.get<`0x${string}`>(
      'contracts.delegatedAccount',
    )!;

    // Compute domain separator
    const domainSeparator = keccak256(
      encodeAbiParameters(
        parseAbiParameters('bytes32, bytes32, bytes32, uint256, address'),
        [
          this.DOMAIN_TYPEHASH,
          keccak256(Buffer.from('DelegatedAccount')),
          keccak256(Buffer.from('1')),
          BigInt(request.chainId),
          delegatedAccountAddress,
        ],
      ),
    );

    // Compute intent hash
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

    // Compute final digest
    const digest = keccak256(
      encodeAbiParameters(
        parseAbiParameters('bytes1, bytes1, bytes32, bytes32'),
        [
          '0x19' as `0x${string}`,
          '0x01' as `0x${string}`,
          domainSeparator,
          intentHash,
        ],
      ),
    );

    return digest;
  }

  private async broadcastTransaction(
    request: RelayRequestDto,
  ): Promise<string> {
    const publicClient = this.blockchainService.getPublicClient();
    const walletClient = this.blockchainService.getWalletClient();
    const relayerAccount = this.relayerWalletService.getAccount();
    const delegatedAccountAddress = this.configService.get<`0x${string}`>(
      'contracts.delegatedAccount',
    )!;

    // Build transaction to call DelegatedAccount.execute()
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

    // Estimate gas
    const gasEstimate = await publicClient.estimateContractGas({
      address: delegatedAccountAddress,
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
      account: relayerAccount,
    });

    // Send transaction
    const hash = await walletClient.writeContract({
      address: delegatedAccountAddress,
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
      account: relayerAccount,
      gas: gasEstimate,
      chain: publicClient.chain,
    });

    return hash;
  }
}
