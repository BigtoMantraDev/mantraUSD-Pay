import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';

describe('BlockchainService', () => {
  let service: BlockchainService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        'chain.id': 5887,
        'chain.rpcUrl': 'https://rpc.dukong.mantrachain.io',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<BlockchainService>(BlockchainService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initialization', () => {
    it('should initialize with testnet chain configuration', () => {
      expect(configService.get).toHaveBeenCalledWith('chain.id');
      expect(configService.get).toHaveBeenCalledWith('chain.rpcUrl');
    });

    it('should create public client', () => {
      const publicClient = service.getPublicClient();
      expect(publicClient).toBeDefined();
      expect(publicClient.chain).toBeDefined();
    });

    it('should create wallet client', () => {
      const walletClient = service.getWalletClient();
      expect(walletClient).toBeDefined();
      expect(walletClient.chain).toBeDefined();
    });
  });

  describe('getChain', () => {
    it('should return chain definition', () => {
      const chain = service.getChain();
      expect(chain).toBeDefined();
      expect(chain.id).toBe(5887);
      expect(chain.name).toBe('MANTRA Dukong Testnet');
      expect(chain.nativeCurrency.symbol).toBe('OM');
      expect(chain.nativeCurrency.decimals).toBe(18);
    });

    it('should have correct RPC URLs', () => {
      const chain = service.getChain();
      expect(chain.rpcUrls.default.http[0]).toBe(
        'https://rpc.dukong.mantrachain.io',
      );
    });

    it('should have correct block explorer', () => {
      const chain = service.getChain();
      expect(chain.blockExplorers?.default.url).toBe(
        'https://explorer.dukong.mantrachain.io',
      );
    });
  });

  describe('getChainId', () => {
    it('should return correct chain ID', () => {
      expect(service.getChainId()).toBe(5887);
    });
  });

  describe('mainnet configuration', () => {
    let mainnetService: BlockchainService;

    beforeEach(async () => {
      const mainnetConfig = {
        get: jest.fn((key: string) => {
          const config: Record<string, any> = {
            'chain.id': 5888,
            'chain.rpcUrl': 'https://rpc.mantrachain.io',
          };
          return config[key];
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          BlockchainService,
          {
            provide: ConfigService,
            useValue: mainnetConfig,
          },
        ],
      }).compile();

      mainnetService = module.get<BlockchainService>(BlockchainService);
    });

    it('should initialize with mainnet chain configuration', () => {
      const chain = mainnetService.getChain();
      expect(chain.id).toBe(5888);
      expect(chain.name).toBe('MANTRA');
    });

    it('should have mainnet explorer URL', () => {
      const chain = mainnetService.getChain();
      expect(chain.blockExplorers?.default.url).toBe(
        'https://explorer.mantrachain.io',
      );
    });
  });

  describe('client instances', () => {
    it('should return same public client instance on multiple calls', () => {
      const client1 = service.getPublicClient();
      const client2 = service.getPublicClient();
      expect(client1).toBe(client2);
    });

    it('should return same wallet client instance on multiple calls', () => {
      const client1 = service.getWalletClient();
      const client2 = service.getWalletClient();
      expect(client1).toBe(client2);
    });
  });
});
