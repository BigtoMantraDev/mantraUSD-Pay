import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createPublicClient,
  createWalletClient,
  http,
  PublicClient,
  WalletClient,
  defineChain,
} from 'viem';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private readonly publicClient: any;
  private readonly walletClient: any;
  private readonly chain: ReturnType<typeof defineChain>;

  constructor(private configService: ConfigService) {
    const chainId = this.configService.get<number>('chain.id')!;
    const rpcUrl = this.configService.get<string>('chain.rpcUrl')!;

    // Define MANTRA Chain
    this.chain = defineChain({
      id: chainId,
      name: chainId === 5888 ? 'MANTRA' : 'MANTRA Dukong Testnet',
      nativeCurrency: { name: 'OM', symbol: 'OM', decimals: 18 },
      rpcUrls: {
        default: { http: [rpcUrl] },
      },
      blockExplorers: {
        default: {
          name: 'MANTRA Explorer',
          url:
            chainId === 5888
              ? 'https://explorer.mantrachain.io'
              : 'https://explorer.dukong.mantrachain.io',
        },
      },
    });

    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(rpcUrl),
    });

    this.walletClient = createWalletClient({
      chain: this.chain,
      transport: http(rpcUrl),
    });

    this.logger.log(`Blockchain service initialized for chain ${chainId}`);
  }

  getPublicClient(): PublicClient {
    return this.publicClient;
  }

  getWalletClient(): WalletClient {
    return this.walletClient;
  }

  getChain() {
    return this.chain;
  }

  getChainId(): number {
    return this.chain.id;
  }
}
