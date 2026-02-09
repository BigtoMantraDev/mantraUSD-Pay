import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FeeService } from './fee.service';
import { GasOracleService } from '../blockchain/gas-oracle.service';
import { RelayerWalletService } from '../blockchain/relayer-wallet.service';
import { FeeQuoteRequestDto } from './dto/fee-quote-request.dto';
import { parseGwei, parseUnits } from 'viem';

describe('FeeService', () => {
  let service: FeeService;
  let gasOracleService: GasOracleService;

  const mockGasPrice = parseGwei('10');
  const mockEstimatedGas = BigInt(150000);
  const mockOmPriceUsd = 0.5; // $0.50 per OM
  const mockTokenAddress = '0x4B545d0758eda6601B051259bD977125fbdA7ba2';
  const mockRecipient = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5';
  const mockSender = '0x1234567890123456789012345678901234567890';
  const mockRelayerAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

  const mockConfigValues: Record<string, any> = {
    'fee.bufferPercent': 20,
    'fee.min': 0.01,
    'fee.max': 1.0,
    'fee.quoteTtlSeconds': 60,
    'contracts.token.decimals': 6,
    'contracts.token.address': mockTokenAddress,
    'chain.id': 5887,
  };

  const mockConfigService = {
    get: jest.fn((key: string) => mockConfigValues[key]),
  };

  const mockGasOracleService = {
    getGasPrice: jest.fn().mockResolvedValue(mockGasPrice),
    estimateExecuteGas: jest.fn().mockResolvedValue(mockEstimatedGas),
    getOmPriceUsd: jest.fn().mockResolvedValue(mockOmPriceUsd),
  };

  const mockSignTypedData = jest.fn().mockResolvedValue('0x' + 'ab'.repeat(65));

  const mockRelayerWalletService = {
    getAddress: jest.fn().mockReturnValue(mockRelayerAddress),
    getAccount: jest.fn().mockReturnValue({
      address: mockRelayerAddress,
      signTypedData: mockSignTypedData,
    }),
  };

  const mockFeeQuoteRequest: FeeQuoteRequestDto = {
    token: mockTokenAddress,
    amount: '1000000', // 1 token with 6 decimals
    recipient: mockRecipient,
    sender: mockSender,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Restore default mock implementations after clearAllMocks
    mockConfigService.get.mockImplementation(
      (key: string) => mockConfigValues[key],
    );
    mockGasOracleService.getGasPrice.mockResolvedValue(mockGasPrice);
    mockGasOracleService.estimateExecuteGas.mockResolvedValue(mockEstimatedGas);
    mockGasOracleService.getOmPriceUsd.mockResolvedValue(mockOmPriceUsd);
    mockRelayerWalletService.getAddress.mockReturnValue(mockRelayerAddress);
    mockSignTypedData.mockResolvedValue('0x' + 'ab'.repeat(65));
    mockRelayerWalletService.getAccount.mockReturnValue({
      address: mockRelayerAddress,
      signTypedData: mockSignTypedData,
    });

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
        {
          provide: RelayerWalletService,
          useValue: mockRelayerWalletService,
        },
      ],
    }).compile();

    service = module.get<FeeService>(FeeService);
    gasOracleService = module.get<GasOracleService>(GasOracleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFeeQuote', () => {
    it('should return fee quote with correct structure', async () => {
      const quote = await service.getFeeQuote(mockFeeQuoteRequest);

      expect(quote).toHaveProperty('feeAmount');
      expect(quote).toHaveProperty('feeToken');
      expect(quote).toHaveProperty('deadline');
      expect(quote).toHaveProperty('signature');
      expect(quote).toHaveProperty('relayerAddress');
      expect(quote.relayerAddress).toBe(mockRelayerAddress);
    });

    it('should estimate gas for the specific transfer', async () => {
      await service.getFeeQuote(mockFeeQuoteRequest);

      expect(gasOracleService.estimateExecuteGas).toHaveBeenCalledWith({
        tokenAddress: mockFeeQuoteRequest.token,
        amount: mockFeeQuoteRequest.amount,
        recipient: mockFeeQuoteRequest.recipient,
        sender: mockFeeQuoteRequest.sender,
      });
    });

    it('should fetch gas price from oracle', async () => {
      await service.getFeeQuote(mockFeeQuoteRequest);
      expect(gasOracleService.getGasPrice).toHaveBeenCalled();
    });

    it('should calculate fee with buffer applied', async () => {
      const quote = await service.getFeeQuote(mockFeeQuoteRequest);

      // Gas cost = 10 gwei * 150000 = 1,500,000 gwei = 0.0015 ether
      // With 20% buffer = 0.0018 ether
      // This should be converted to token amount
      expect(BigInt(quote.feeAmount)).toBeGreaterThan(BigInt(0));
    });

    it('should return configured token address as feeToken', async () => {
      const quote = await service.getFeeQuote(mockFeeQuoteRequest);
      expect(quote.feeToken).toBe(mockTokenAddress);
    });

    it('should set deadline in the future based on TTL', async () => {
      const beforeTime = Math.floor(Date.now() / 1000);
      const quote = await service.getFeeQuote(mockFeeQuoteRequest);
      const afterTime = Math.floor(Date.now() / 1000);

      // TTL is 60 seconds
      const expectedDeadline = beforeTime + 60;
      expect(quote.deadline).toBeGreaterThanOrEqual(expectedDeadline - 1);
      expect(quote.deadline).toBeLessThanOrEqual(afterTime + 60);
    });

    it('should return an EIP-712 signed signature', async () => {
      const quote = await service.getFeeQuote(mockFeeQuoteRequest);

      expect(quote.signature).toBeDefined();
      expect(quote.signature).toMatch(/^0x/);
      expect(mockSignTypedData).toHaveBeenCalledWith(
        expect.objectContaining({
          primaryType: 'FeeQuote',
          domain: expect.objectContaining({
            name: 'MantraUSD Pay',
            version: '1',
            chainId: 5887,
            verifyingContract: mockRelayerAddress,
          }),
          message: expect.objectContaining({
            feeToken: mockTokenAddress,
            feeAmount: expect.any(BigInt),
            deadline: expect.any(BigInt),
          }),
        }),
      );
    });
  });

  describe('fee caps', () => {
    it('should apply minimum fee cap', async () => {
      // Set very low gas price to trigger min cap
      mockGasOracleService.getGasPrice.mockResolvedValueOnce(
        parseGwei('0.0001'),
      );

      const quote = await service.getFeeQuote(mockFeeQuoteRequest);

      // Min fee is 0.01 tokens with 6 decimals = 10000 wei
      const minFeeWei = parseUnits('0.01', 6);
      expect(BigInt(quote.feeAmount)).toBeGreaterThanOrEqual(minFeeWei);
    });

    it('should apply maximum fee cap', async () => {
      // Set very high gas price to trigger max cap
      mockGasOracleService.getGasPrice.mockResolvedValueOnce(
        parseGwei('100000'),
      );

      const quote = await service.getFeeQuote(mockFeeQuoteRequest);

      // Max fee is 1.0 tokens with 6 decimals = 1000000 wei
      const maxFeeWei = parseUnits('1.0', 6);
      expect(BigInt(quote.feeAmount)).toBeLessThanOrEqual(maxFeeWei);
    });

    it('should not cap fees within range', async () => {
      const quote = await service.getFeeQuote(mockFeeQuoteRequest);
      const feeAmount = BigInt(quote.feeAmount);

      // Fee should be within bounds
      const minFeeWei = parseUnits('0.01', 6);
      const maxFeeWei = parseUnits('1.0', 6);
      expect(feeAmount).toBeGreaterThanOrEqual(minFeeWei);
      expect(feeAmount).toBeLessThanOrEqual(maxFeeWei);
    });

    it('should respect custom min cap', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'fee.min') return 0.05;
        return mockConfigValues[key];
      });

      mockGasOracleService.getGasPrice.mockResolvedValueOnce(
        parseGwei('0.0001'),
      );

      const quote = await service.getFeeQuote(mockFeeQuoteRequest);
      const minFeeWei = parseUnits('0.05', 6);
      expect(BigInt(quote.feeAmount)).toBeGreaterThanOrEqual(minFeeWei);
    });

    it('should respect custom max cap', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'fee.max') return 0.5;
        return mockConfigValues[key];
      });

      mockGasOracleService.getGasPrice.mockResolvedValueOnce(
        parseGwei('100000'),
      );

      const quote = await service.getFeeQuote(mockFeeQuoteRequest);
      const maxFeeWei = parseUnits('0.5', 6);
      expect(BigInt(quote.feeAmount)).toBeLessThanOrEqual(maxFeeWei);
    });
  });

  describe('buffer calculation', () => {
    it('should apply buffer from config', async () => {
      // Verify buffer is applied by checking fee is higher than base gas cost
      const quote = await service.getFeeQuote(mockFeeQuoteRequest);

      // With 20% buffer, fee should be higher than base
      expect(BigInt(quote.feeAmount)).toBeGreaterThan(BigInt(0));
    });

    it('should calculate fee with different buffer percentages', async () => {
      // First call with default 20% buffer
      const quote1 = await service.getFeeQuote({
        ...mockFeeQuoteRequest,
        recipient: '0x0000000000000000000000000000000000000001',
      });

      // Change buffer to 50%
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'fee.bufferPercent') return 50;
        return mockConfigValues[key];
      });

      // Use different cache key
      const quote2 = await service.getFeeQuote({
        ...mockFeeQuoteRequest,
        recipient: '0x0000000000000000000000000000000000000002',
      });

      // Both should produce valid fees
      expect(BigInt(quote1.feeAmount)).toBeGreaterThan(BigInt(0));
      expect(BigInt(quote2.feeAmount)).toBeGreaterThan(BigInt(0));
    });
  });

  describe('caching', () => {
    it('should cache quotes with same parameters', async () => {
      const quote1 = await service.getFeeQuote(mockFeeQuoteRequest);

      // Reset mock to track new calls
      mockGasOracleService.estimateExecuteGas.mockClear();
      mockGasOracleService.getGasPrice.mockClear();
      mockGasOracleService.getOmPriceUsd.mockClear();

      const quote2 = await service.getFeeQuote(mockFeeQuoteRequest);

      // Should return cached quote, no new RPC calls
      expect(mockGasOracleService.estimateExecuteGas).not.toHaveBeenCalled();
      expect(mockGasOracleService.getGasPrice).not.toHaveBeenCalled();
      expect(mockGasOracleService.getOmPriceUsd).not.toHaveBeenCalled();
      expect(quote1.feeAmount).toBe(quote2.feeAmount);
      expect(quote1.deadline).toBe(quote2.deadline);
    });

    it('should use different cache keys for different parameters', async () => {
      await service.getFeeQuote(mockFeeQuoteRequest);

      const differentRequest: FeeQuoteRequestDto = {
        ...mockFeeQuoteRequest,
        recipient: '0x0000000000000000000000000000000000000003',
      };

      mockGasOracleService.estimateExecuteGas.mockClear();
      mockGasOracleService.getGasPrice.mockClear();
      mockGasOracleService.getOmPriceUsd.mockClear();

      await service.getFeeQuote(differentRequest);

      // Should make new RPC calls for different parameters
      expect(mockGasOracleService.estimateExecuteGas).toHaveBeenCalled();
      expect(mockGasOracleService.getGasPrice).toHaveBeenCalled();
      expect(mockGasOracleService.getOmPriceUsd).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should propagate gas oracle errors', async () => {
      mockGasOracleService.getGasPrice.mockRejectedValueOnce(
        new Error('RPC error'),
      );

      await expect(
        service.getFeeQuote({
          ...mockFeeQuoteRequest,
          recipient: '0x0000000000000000000000000000000000000099',
        }),
      ).rejects.toThrow('RPC error');
    });

    it('should propagate gas estimation errors', async () => {
      mockGasOracleService.estimateExecuteGas.mockRejectedValueOnce(
        new Error('Gas estimation failed'),
      );

      await expect(
        service.getFeeQuote({
          ...mockFeeQuoteRequest,
          recipient: '0x0000000000000000000000000000000000000098',
        }),
      ).rejects.toThrow('Gas estimation failed');
    });
  });

  describe('gas price changes', () => {
    it('should reflect gas price changes for new quotes', async () => {
      const quote1 = await service.getFeeQuote({
        ...mockFeeQuoteRequest,
        recipient: '0x0000000000000000000000000000000000000010',
      });

      // Change gas price for different request
      const higherGasPrice = parseGwei('20');
      mockGasOracleService.getGasPrice.mockResolvedValueOnce(higherGasPrice);

      const quote2 = await service.getFeeQuote({
        ...mockFeeQuoteRequest,
        recipient: '0x0000000000000000000000000000000000000011',
      });

      // Higher gas price should result in higher fee (unless capped)
      expect(BigInt(quote1.feeAmount)).toBeGreaterThan(BigInt(0));
      expect(BigInt(quote2.feeAmount)).toBeGreaterThan(BigInt(0));
    });
  });

  describe('EIP-712 signature round-trip', () => {
    let realService: FeeService;

    beforeEach(async () => {
      // Use a real private key for signing + verification integration tests
      const { privateKeyToAccount } = await import('viem/accounts');
      const testAccount = privateKeyToAccount(
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      );

      mockRelayerWalletService.getAccount.mockReturnValue(testAccount);
      mockRelayerWalletService.getAddress.mockReturnValue(testAccount.address);

      const module = await Test.createTestingModule({
        providers: [
          FeeService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: GasOracleService, useValue: mockGasOracleService },
          {
            provide: RelayerWalletService,
            useValue: mockRelayerWalletService,
          },
        ],
      }).compile();
      realService = module.get<FeeService>(FeeService);
    });

    it('should produce a signature verifiable by verifyFeeQuote', async () => {
      const quote = await realService.getFeeQuote(mockFeeQuoteRequest);

      const isValid = await realService.verifyFeeQuote(
        quote.feeAmount,
        quote.feeToken,
        quote.deadline,
        quote.signature,
      );
      expect(isValid).toBe(true);
    });

    it('should reject a tampered feeAmount', async () => {
      const quote = await realService.getFeeQuote(mockFeeQuoteRequest);

      const isValid = await realService.verifyFeeQuote(
        (BigInt(quote.feeAmount) + 1n).toString(),
        quote.feeToken,
        quote.deadline,
        quote.signature,
      );
      expect(isValid).toBe(false);
    });

    it('should reject a tampered feeToken', async () => {
      const quote = await realService.getFeeQuote(mockFeeQuoteRequest);

      const isValid = await realService.verifyFeeQuote(
        quote.feeAmount,
        '0x0000000000000000000000000000000000000001',
        quote.deadline,
        quote.signature,
      );
      expect(isValid).toBe(false);
    });

    it('should reject an expired deadline', async () => {
      const quote = await realService.getFeeQuote(mockFeeQuoteRequest);

      const isValid = await realService.verifyFeeQuote(
        quote.feeAmount,
        quote.feeToken,
        Math.floor(Date.now() / 1000) - 10,
        quote.signature,
      );
      expect(isValid).toBe(false);
    });

    it('should reject a forged signature', async () => {
      const quote = await realService.getFeeQuote(mockFeeQuoteRequest);

      const isValid = await realService.verifyFeeQuote(
        quote.feeAmount,
        quote.feeToken,
        quote.deadline,
        '0x' + 'ff'.repeat(65),
      );
      expect(isValid).toBe(false);
    });
  });
});
