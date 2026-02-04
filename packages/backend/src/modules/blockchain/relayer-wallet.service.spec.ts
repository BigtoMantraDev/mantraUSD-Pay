import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RelayerWalletService } from './relayer-wallet.service';
import { privateKeyToAccount } from 'viem/accounts';

// Mock viem/accounts
jest.mock('viem/accounts', () => ({
  privateKeyToAccount: jest.fn(),
}));

describe('RelayerWalletService', () => {
  let service: RelayerWalletService;
  let configService: ConfigService;

  const mockPrivateKey =
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const mockAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const mockAccount = {
    address: mockAddress as `0x${string}`,
    signMessage: jest.fn(),
    signTransaction: jest.fn(),
    signTypedData: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'relayer.privateKey') {
        return mockPrivateKey;
      }
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    (privateKeyToAccount as jest.Mock).mockReturnValue(mockAccount);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelayerWalletService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RelayerWalletService>(RelayerWalletService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initialization', () => {
    it('should load private key from config', () => {
      expect(configService.get).toHaveBeenCalledWith('relayer.privateKey');
    });

    it('should create account from private key', () => {
      expect(privateKeyToAccount).toHaveBeenCalledWith(mockPrivateKey);
    });
  });

  describe('getAccount', () => {
    it('should return the account instance', () => {
      const account = service.getAccount();
      expect(account).toBe(mockAccount);
    });

    it('should return account with signing capabilities', () => {
      const account = service.getAccount();
      expect(account.signMessage).toBeDefined();
      expect(account.signTransaction).toBeDefined();
      expect(account.signTypedData).toBeDefined();
    });
  });

  describe('getAddress', () => {
    it('should return the wallet address', () => {
      const address = service.getAddress();
      expect(address).toBe(mockAddress);
    });

    it('should return address in correct format', () => {
      const address = service.getAddress();
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  describe('multiple instances', () => {
    it('should return same account instance on multiple calls', () => {
      const account1 = service.getAccount();
      const account2 = service.getAccount();
      expect(account1).toBe(account2);
    });

    it('should return same address on multiple calls', () => {
      const address1 = service.getAddress();
      const address2 = service.getAddress();
      expect(address1).toBe(address2);
    });
  });
});
