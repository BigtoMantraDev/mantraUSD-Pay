import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NonceService } from './nonce.service';
import { BlockchainService } from '../blockchain/blockchain.service';

describe('NonceService', () => {
  let service: NonceService;
  let configService: ConfigService;
  let blockchainService: BlockchainService;

  const mockDelegatedAccountAddress =
    '0x1234567890123456789012345678901234567890';
  const mockUserAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const mockNonce = BigInt(42);

  const mockPublicClient = {
    readContract: jest.fn().mockResolvedValue(mockNonce),
  };

  const mockBlockchainService = {
    getPublicClient: jest.fn().mockReturnValue(mockPublicClient),
    getChainId: jest.fn().mockReturnValue(5887),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'contracts.delegatedAccount') {
        return mockDelegatedAccountAddress;
      }
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NonceService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: BlockchainService,
          useValue: mockBlockchainService,
        },
      ],
    }).compile();

    service = module.get<NonceService>(NonceService);
    configService = module.get<ConfigService>(ConfigService);
    blockchainService = module.get<BlockchainService>(BlockchainService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNonce', () => {
    it('should fetch nonce from delegated account contract', async () => {
      const nonce = await service.getNonce(mockUserAddress);

      expect(mockPublicClient.readContract).toHaveBeenCalledWith({
        address: mockDelegatedAccountAddress,
        abi: expect.any(Array),
        functionName: 'getNonce',
        args: [mockUserAddress],
      });
      expect(nonce).toBe('42');
    });

    it('should return nonce as string', async () => {
      const nonce = await service.getNonce(mockUserAddress);
      expect(typeof nonce).toBe('string');
    });

    it('should handle zero nonce', async () => {
      mockPublicClient.readContract.mockResolvedValueOnce(BigInt(0));

      const nonce = await service.getNonce(mockUserAddress);
      expect(nonce).toBe('0');
    });

    it('should handle large nonce values', async () => {
      const largeNonce = BigInt('999999999999999999');
      mockPublicClient.readContract.mockResolvedValueOnce(largeNonce);

      const nonce = await service.getNonce(mockUserAddress);
      expect(nonce).toBe('999999999999999999');
    });

    it('should fetch nonce for different addresses', async () => {
      const address1 = '0x1111111111111111111111111111111111111111';
      const address2 = '0x2222222222222222222222222222222222222222';

      mockPublicClient.readContract.mockResolvedValueOnce(BigInt(5));
      await service.getNonce(address1);

      mockPublicClient.readContract.mockResolvedValueOnce(BigInt(10));
      await service.getNonce(address2);

      expect(mockPublicClient.readContract).toHaveBeenCalledWith(
        expect.objectContaining({ args: [address1] }),
      );
      expect(mockPublicClient.readContract).toHaveBeenCalledWith(
        expect.objectContaining({ args: [address2] }),
      );
    });
  });

  describe('address validation', () => {
    it('should reject invalid address format', async () => {
      const invalidAddress = 'not-an-address';

      await expect(service.getNonce(invalidAddress)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getNonce(invalidAddress)).rejects.toThrow(
        'Invalid address format',
      );
    });

    it('should reject address without 0x prefix', async () => {
      const addressWithoutPrefix = 'f39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

      await expect(service.getNonce(addressWithoutPrefix)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject address with wrong length', async () => {
      const shortAddress = '0x1234';

      await expect(service.getNonce(shortAddress)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject empty address', async () => {
      await expect(service.getNonce('')).rejects.toThrow(BadRequestException);
    });

    it('should reject null/undefined address', async () => {
      await expect(service.getNonce(null as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getNonce(undefined as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should accept valid checksummed address', async () => {
      const checksummed = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      const nonce = await service.getNonce(checksummed);
      expect(nonce).toBeDefined();
    });

    it('should accept valid lowercase address', async () => {
      const lowercase = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
      const nonce = await service.getNonce(lowercase);
      expect(nonce).toBeDefined();
    });
  });

  describe('chain validation', () => {
    it('should accept matching chain ID', async () => {
      const nonce = await service.getNonce(mockUserAddress, 5887);
      expect(nonce).toBe('42');
    });

    it('should use default chain ID when not provided', async () => {
      const nonce = await service.getNonce(mockUserAddress);
      expect(nonce).toBe('42');
      expect(blockchainService.getChainId).toHaveBeenCalled();
    });

    it('should reject mismatched chain ID', async () => {
      await expect(service.getNonce(mockUserAddress, 5888)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getNonce(mockUserAddress, 5888)).rejects.toThrow(
        /Chain ID mismatch/,
      );
    });

    it('should reject unsupported chain ID', async () => {
      await expect(service.getNonce(mockUserAddress, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should include expected and actual chain in error', async () => {
      try {
        await service.getNonce(mockUserAddress, 1);
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error.message).toContain('5887');
        expect(error.message).toContain('1');
      }
    });
  });

  describe('contract interaction', () => {
    it('should call correct contract address', async () => {
      await service.getNonce(mockUserAddress);

      expect(mockPublicClient.readContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: mockDelegatedAccountAddress,
        }),
      );
    });

    it('should use correct ABI', async () => {
      await service.getNonce(mockUserAddress);

      const call = mockPublicClient.readContract.mock.calls[0][0];
      expect(call.abi).toBeDefined();
      expect(call.abi).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'getNonce',
            type: 'function',
          }),
        ]),
      );
    });

    it('should call getNonce function', async () => {
      await service.getNonce(mockUserAddress);

      expect(mockPublicClient.readContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'getNonce',
        }),
      );
    });
  });

  describe('error handling', () => {
    it('should propagate RPC errors', async () => {
      mockPublicClient.readContract.mockRejectedValueOnce(
        new Error('RPC connection failed'),
      );

      await expect(service.getNonce(mockUserAddress)).rejects.toThrow(
        'RPC connection failed',
      );
    });

    it('should propagate contract execution errors', async () => {
      mockPublicClient.readContract.mockRejectedValueOnce(
        new Error('Contract execution reverted'),
      );

      await expect(service.getNonce(mockUserAddress)).rejects.toThrow(
        'Contract execution reverted',
      );
    });

    it('should handle network timeout', async () => {
      mockPublicClient.readContract.mockRejectedValueOnce(
        new Error('Network request timeout'),
      );

      await expect(service.getNonce(mockUserAddress)).rejects.toThrow(
        'Network request timeout',
      );
    });

    it('should handle missing contract', async () => {
      mockPublicClient.readContract.mockRejectedValueOnce(
        new Error('Contract not deployed'),
      );

      await expect(service.getNonce(mockUserAddress)).rejects.toThrow(
        'Contract not deployed',
      );
    });
  });

  describe('configuration', () => {
    it('should load delegated account address from config', async () => {
      await service.getNonce(mockUserAddress);

      expect(configService.get).toHaveBeenCalledWith(
        'contracts.delegatedAccount',
      );
    });

    it('should handle different delegated account addresses', async () => {
      const differentAddress =
        '0x9999999999999999999999999999999999999999' as `0x${string}`;
      const localMockConfigService = {
        get: jest.fn().mockReturnValue(differentAddress),
      };

      const module = await Test.createTestingModule({
        providers: [
          NonceService,
          { provide: ConfigService, useValue: localMockConfigService },
          { provide: BlockchainService, useValue: mockBlockchainService },
        ],
      }).compile();

      const newService = module.get<NonceService>(NonceService);
      await newService.getNonce(mockUserAddress);

      expect(mockPublicClient.readContract).toHaveBeenCalledWith(
        expect.objectContaining({ address: differentAddress }),
      );
    });
  });

  describe('multiple calls', () => {
    it('should handle sequential nonce queries', async () => {
      const nonce1 = await service.getNonce(mockUserAddress);
      const nonce2 = await service.getNonce(mockUserAddress);

      expect(nonce1).toBe('42');
      expect(nonce2).toBe('42');
      expect(mockPublicClient.readContract).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent nonce queries', async () => {
      const promises = [
        service.getNonce(mockUserAddress),
        service.getNonce(mockUserAddress),
        service.getNonce(mockUserAddress),
      ];

      const results = await Promise.all(promises);
      expect(results).toEqual(['42', '42', '42']);
      expect(mockPublicClient.readContract).toHaveBeenCalledTimes(3);
    });
  });
});
