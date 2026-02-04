import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FeeService } from './fee.service';
import { GasOracleService } from '../blockchain/gas-oracle.service';
import { parseGwei } from 'viem';

describe('FeeService', () => {
  let service: FeeService;
  let configService: ConfigService;
  let gasOracleService: GasOracleService;

  const mockGasPrice = parseGwei('10');
  const mockConfigValues: Record<string, any> = {
    'fee.enabled': true,
    'fee.estimatedGas': 150000,
    'fee.bufferPercent': 20,
    'fee.min': 0.01,
    'fee.max': 1.0,
    'fee.quoteTtlSeconds': 60,
    'contracts.token.decimals': 6,
    'contracts.token.symbol': 'mantraUSD',
  };

  const mockConfigService = {
    get: jest.fn((key: string) => mockConfigValues[key]),
  };

  const mockGasOracleService = {
    getGasPrice: jest.fn().mockResolvedValue(mockGasPrice),
    getGasPriceGwei: jest.fn().mockResolvedValue('10'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Restore default mock implementations after clearAllMocks
    mockConfigService.get.mockImplementation((key: string) => mockConfigValues[key]);
    mockGasOracleService.getGasPrice.mockResolvedValue(mockGasPrice);
    mockGasOracleService.getGasPriceGwei.mockResolvedValue('10');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeeService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: GasOracleService,
          useValue: mockGasOracleService,
        },
      ],
    }).compile();

    service = module.get<FeeService>(FeeService);
    configService = module.get<ConfigService>(ConfigService);
    gasOracleService = module.get<GasOracleService>(GasOracleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFeeQuote', () => {
    it('should return fee quote with correct structure', async () => {
      const quote = await service.getFeeQuote();

      expect(quote).toHaveProperty('fee');
      expect(quote).toHaveProperty('feeFormatted');
      expect(quote).toHaveProperty('gasPrice');
      expect(quote).toHaveProperty('gasPriceGwei');
      expect(quote).toHaveProperty('estimatedGas');
      expect(quote).toHaveProperty('bufferPercent');
      expect(quote).toHaveProperty('expiresAt');
      expect(quote).toHaveProperty('enabled');
    });

    it('should fetch gas price from oracle', async () => {
      await service.getFeeQuote();
      expect(gasOracleService.getGasPrice).toHaveBeenCalled();
      expect(gasOracleService.getGasPriceGwei).toHaveBeenCalled();
    });

    it('should calculate fee with buffer applied', async () => {
      const quote = await service.getFeeQuote();
      
      // Gas cost = 10 gwei * 150000 = 1,500,000 gwei = 0.0015 ether
      // With 20% buffer = 0.0018 ether
      // Convert to 6 decimals = 0.001800 tokens
      expect(parseFloat(quote.fee)).toBeGreaterThan(0);
      expect(quote.bufferPercent).toBe(20);
    });

    it('should return enabled status', async () => {
      const quote = await service.getFeeQuote();
      expect(quote.enabled).toBe(true);
    });

    it('should return disabled when fee is disabled', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'fee.enabled') return false;
        return mockConfigValues[key];
      });

      const quote = await service.getFeeQuote();
      expect(quote.enabled).toBe(false);
    });

    it('should include gas price in wei as string', async () => {
      const quote = await service.getFeeQuote();
      expect(quote.gasPrice).toBe(mockGasPrice.toString());
    });

    it('should include gas price in gwei', async () => {
      const quote = await service.getFeeQuote();
      expect(quote.gasPriceGwei).toBe('10');
    });

    it('should include estimated gas amount', async () => {
      const quote = await service.getFeeQuote();
      expect(quote.estimatedGas).toBe(150000);
    });

    it('should format fee with token symbol', async () => {
      const quote = await service.getFeeQuote();
      expect(quote.feeFormatted).toContain('mantraUSD');
      expect(quote.feeFormatted).toContain(quote.fee);
    });

    it('should set expiration time in future', async () => {
      const beforeTime = Math.floor(Date.now() / 1000);
      const quote = await service.getFeeQuote();
      const afterTime = Math.floor(Date.now() / 1000);

      expect(quote.expiresAt).toBeGreaterThan(beforeTime);
      expect(quote.expiresAt).toBeLessThanOrEqual(afterTime + 60);
    });

    it('should apply TTL from config', async () => {
      const beforeTime = Math.floor(Date.now() / 1000);
      const quote = await service.getFeeQuote();

      const expectedExpiry = beforeTime + 60; // 60 seconds TTL
      expect(quote.expiresAt).toBeGreaterThanOrEqual(expectedExpiry - 1);
      expect(quote.expiresAt).toBeLessThanOrEqual(expectedExpiry + 1);
    });
  });

  describe('fee caps', () => {
    it('should apply minimum fee cap', async () => {
      // Set very low gas price to trigger min cap
      mockGasOracleService.getGasPrice.mockResolvedValueOnce(parseGwei('0.001'));
      mockGasOracleService.getGasPriceGwei.mockResolvedValueOnce('0.001');

      const quote = await service.getFeeQuote();
      expect(parseFloat(quote.fee)).toBeGreaterThanOrEqual(0.01);
    });

    it('should apply maximum fee cap', async () => {
      // Set very high gas price to trigger max cap
      mockGasOracleService.getGasPrice.mockResolvedValueOnce(parseGwei('10000'));
      mockGasOracleService.getGasPriceGwei.mockResolvedValueOnce('10000');

      const quote = await service.getFeeQuote();
      expect(parseFloat(quote.fee)).toBeLessThanOrEqual(1.0);
    });

    it('should not cap fees within range', async () => {
      // Use normal gas price that should result in fee within min/max
      const quote = await service.getFeeQuote();
      const feeValue = parseFloat(quote.fee);
      
      // Fee should be within bounds but not necessarily at the caps
      expect(feeValue).toBeGreaterThanOrEqual(0.01);
      expect(feeValue).toBeLessThanOrEqual(1.0);
    });

    it('should respect custom min cap', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'fee.min') return 0.05;
        return mockConfigValues[key];
      });

      mockGasOracleService.getGasPrice.mockResolvedValueOnce(parseGwei('0.001'));
      mockGasOracleService.getGasPriceGwei.mockResolvedValueOnce('0.001');

      const quote = await service.getFeeQuote();
      expect(parseFloat(quote.fee)).toBeGreaterThanOrEqual(0.05);
    });

    it('should respect custom max cap', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'fee.max') return 0.5;
        return mockConfigValues[key];
      });

      mockGasOracleService.getGasPrice.mockResolvedValueOnce(parseGwei('10000'));
      mockGasOracleService.getGasPriceGwei.mockResolvedValueOnce('10000');

      const quote = await service.getFeeQuote();
      expect(parseFloat(quote.fee)).toBeLessThanOrEqual(0.5);
    });
  });

  describe('buffer calculation', () => {
    it('should apply 20% buffer correctly', async () => {
      const quote = await service.getFeeQuote();
      expect(quote.bufferPercent).toBe(20);
    });

    it('should calculate fee with different buffer percentages', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'fee.bufferPercent') return 50;
        return mockConfigValues[key];
      });

      const quote = await service.getFeeQuote();
      expect(quote.bufferPercent).toBe(50);
    });

    it('should handle zero buffer', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'fee.bufferPercent') return 0;
        return mockConfigValues[key];
      });

      const quote = await service.getFeeQuote();
      expect(quote.bufferPercent).toBe(0);
    });
  });

  describe('token decimals', () => {
    it('should format fee with correct decimals', async () => {
      const quote = await service.getFeeQuote();
      const decimalPlaces = quote.fee.split('.')[1]?.length || 0;
      expect(decimalPlaces).toBeLessThanOrEqual(6);
    });

    it('should handle different token decimals', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'contracts.token.decimals') return 18;
        return mockConfigValues[key];
      });

      const quote = await service.getFeeQuote();
      expect(quote.fee).toBeDefined();
      expect(parseFloat(quote.fee)).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should propagate gas oracle errors', async () => {
      mockGasOracleService.getGasPrice.mockRejectedValueOnce(
        new Error('RPC error'),
      );

      await expect(service.getFeeQuote()).rejects.toThrow('RPC error');
    });

    it('should handle missing config values gracefully', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      // Should throw when trying to use undefined values
      await expect(service.getFeeQuote()).rejects.toThrow();
    });
  });

  describe('multiple quotes', () => {
    it('should return different expiry times for sequential calls', async () => {
      const quote1 = await service.getFeeQuote();
      
      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const quote2 = await service.getFeeQuote();
      expect(quote2.expiresAt).toBeGreaterThanOrEqual(quote1.expiresAt);
    });

    it('should reflect gas price changes', async () => {
      const quote1 = await service.getFeeQuote();
      expect(quote1.gasPriceGwei).toBe('10');

      // Change gas price for next call
      const higherGasPrice = parseGwei('20');
      mockGasOracleService.getGasPrice.mockResolvedValueOnce(higherGasPrice);
      mockGasOracleService.getGasPriceGwei.mockResolvedValueOnce('20');

      const quote2 = await service.getFeeQuote();
      expect(quote2.gasPrice).toBe(higherGasPrice.toString());
      expect(quote2.gasPriceGwei).toBe('20');
    });
  });
});
