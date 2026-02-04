import { Test, TestingModule } from '@nestjs/testing';
import { GasOracleService } from './gas-oracle.service';
import { BlockchainService } from './blockchain.service';
import { parseGwei } from 'viem';

describe('GasOracleService', () => {
  let service: GasOracleService;
  let blockchainService: BlockchainService;

  const mockGasPrice = parseGwei('10'); // 10 gwei
  const mockPublicClient = {
    getGasPrice: jest.fn().mockResolvedValue(mockGasPrice),
    chain: { id: 5887 },
  };

  const mockBlockchainService = {
    getPublicClient: jest.fn().mockReturnValue(mockPublicClient),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GasOracleService,
        {
          provide: BlockchainService,
          useValue: mockBlockchainService,
        },
      ],
    }).compile();

    service = module.get<GasOracleService>(GasOracleService);
    blockchainService = module.get<BlockchainService>(BlockchainService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGasPrice', () => {
    it('should fetch gas price from blockchain', async () => {
      const gasPrice = await service.getGasPrice();
      expect(gasPrice).toBe(mockGasPrice);
      expect(mockPublicClient.getGasPrice).toHaveBeenCalled();
    });

    it('should return bigint value', async () => {
      const gasPrice = await service.getGasPrice();
      expect(typeof gasPrice).toBe('bigint');
    });

    it('should handle high gas prices', async () => {
      const highGasPrice = parseGwei('100');
      mockPublicClient.getGasPrice.mockResolvedValueOnce(highGasPrice);

      const gasPrice = await service.getGasPrice();
      expect(gasPrice).toBe(highGasPrice);
    });

    it('should handle low gas prices', async () => {
      const lowGasPrice = parseGwei('0.1');
      mockPublicClient.getGasPrice.mockResolvedValueOnce(lowGasPrice);

      const gasPrice = await service.getGasPrice();
      expect(gasPrice).toBe(lowGasPrice);
    });
  });

  describe('getGasPriceGwei', () => {
    it('should return gas price in gwei as string', async () => {
      const gasPriceGwei = await service.getGasPriceGwei();
      expect(typeof gasPriceGwei).toBe('string');
      expect(gasPriceGwei).toBe('10');
    });

    it('should format decimal values correctly', async () => {
      mockPublicClient.getGasPrice.mockResolvedValueOnce(parseGwei('10.5'));
      const gasPriceGwei = await service.getGasPriceGwei();
      expect(gasPriceGwei).toBe('10.5');
    });

    it('should format very low values correctly', async () => {
      mockPublicClient.getGasPrice.mockResolvedValueOnce(parseGwei('0.01'));
      const gasPriceGwei = await service.getGasPriceGwei();
      expect(gasPriceGwei).toBe('0.01');
    });
  });

  describe('isGasPriceAcceptable', () => {
    it('should return true when gas price is below max', async () => {
      mockPublicClient.getGasPrice.mockResolvedValueOnce(parseGwei('10'));
      const acceptable = await service.isGasPriceAcceptable(20);
      expect(acceptable).toBe(true);
    });

    it('should return true when gas price equals max', async () => {
      mockPublicClient.getGasPrice.mockResolvedValueOnce(parseGwei('10'));
      const acceptable = await service.isGasPriceAcceptable(10);
      expect(acceptable).toBe(true);
    });

    it('should return false when gas price exceeds max', async () => {
      mockPublicClient.getGasPrice.mockResolvedValueOnce(parseGwei('30'));
      const acceptable = await service.isGasPriceAcceptable(20);
      expect(acceptable).toBe(false);
    });

    it('should handle fractional max values', async () => {
      mockPublicClient.getGasPrice.mockResolvedValueOnce(parseGwei('10.5'));
      const acceptable = await service.isGasPriceAcceptable(10.6);
      expect(acceptable).toBe(true);
    });

    it('should handle very high gas prices correctly', async () => {
      mockPublicClient.getGasPrice.mockResolvedValueOnce(parseGwei('500'));
      const acceptable = await service.isGasPriceAcceptable(100);
      expect(acceptable).toBe(false);
    });

    it('should handle edge case: zero max gas price', async () => {
      mockPublicClient.getGasPrice.mockResolvedValueOnce(parseGwei('10'));
      const acceptable = await service.isGasPriceAcceptable(0);
      expect(acceptable).toBe(false);
    });

    it('should handle edge case: zero gas price', async () => {
      mockPublicClient.getGasPrice.mockResolvedValueOnce(BigInt(0));
      const acceptable = await service.isGasPriceAcceptable(10);
      expect(acceptable).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should propagate RPC errors', async () => {
      mockPublicClient.getGasPrice.mockRejectedValueOnce(
        new Error('RPC connection failed'),
      );

      await expect(service.getGasPrice()).rejects.toThrow(
        'RPC connection failed',
      );
    });

    it('should propagate errors in getGasPriceGwei', async () => {
      mockPublicClient.getGasPrice.mockRejectedValueOnce(
        new Error('Network error'),
      );

      await expect(service.getGasPriceGwei()).rejects.toThrow('Network error');
    });

    it('should propagate errors in isGasPriceAcceptable', async () => {
      mockPublicClient.getGasPrice.mockRejectedValueOnce(
        new Error('Timeout'),
      );

      await expect(service.isGasPriceAcceptable(20)).rejects.toThrow(
        'Timeout',
      );
    });
  });
});
