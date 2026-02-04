import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockchainService } from '../blockchain/blockchain.service';
import { isAddress } from 'viem';

@Injectable()
export class NonceService {
  private readonly logger = new Logger(NonceService.name);
  private readonly delegatedAccountAbi = [
    {
      inputs: [{ name: 'account', type: 'address' }],
      name: 'getNonce',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
  ] as const;

  constructor(
    private configService: ConfigService,
    private blockchainService: BlockchainService,
  ) {}

  async getNonce(address: string, chainId?: number): Promise<string> {
    if (!isAddress(address)) {
      throw new BadRequestException('Invalid address format');
    }

    const requestedChainId = chainId || this.blockchainService.getChainId();
    const actualChainId = this.blockchainService.getChainId();

    if (requestedChainId !== actualChainId) {
      throw new BadRequestException(
        `Chain ID mismatch. Backend supports chain ${actualChainId}, requested ${requestedChainId}`,
      );
    }

    const delegatedAccountAddress = this.configService.get<`0x${string}`>(
      'contracts.delegatedAccount',
    )!;

    const publicClient = this.blockchainService.getPublicClient();

    const nonce = await publicClient.readContract({
      address: delegatedAccountAddress,
      abi: this.delegatedAccountAbi,
      functionName: 'getNonce',
      args: [address as `0x${string}`],
    });

    this.logger.debug(`Nonce for ${address}: ${nonce.toString()}`);

    return nonce.toString();
  }
}
