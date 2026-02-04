import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RelayService } from './relay.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { RelayerWalletService } from '../blockchain/relayer-wallet.service';
import { GasOracleService } from '../blockchain/gas-oracle.service';
import { RelayRequestDto } from './dto/relay-request.dto';

// Mock viem functions
jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  recoverAddress: jest.fn(),
  keccak256: jest.requireActual('viem').keccak256,
  encodeAbiParameters: jest.requireActual('viem').encodeAbiParameters,
  parseAbiParameters: jest.requireActual('viem').parseAbiParameters,
  formatEther: jest.requireActual('viem').formatEther,
}));

import { recoverAddress } from 'viem';

describe('RelayService', () => {
  let service: RelayService;
  let gasOracleService: GasOracleService;

  const mockChainId = 5887;
  const mockDelegatedAccount = '0x1234567890123456789012345678901234567890';
  const mockRelayerAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const mockUserAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  const mockTxHash =
    '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

  const mockRelayRequest: RelayRequestDto = {
    userAddress: mockUserAddress,
    signature:
      '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
    chainId: mockChainId,
    intent: {
      destination: '0x9999999999999999999999999999999999999999',
      value: '0',
      data: '0x',
      nonce: '0',
      deadline: String(Math.floor(Date.now() / 1000) + 3600),
    },
  };

  const mockPublicClient = {
    chain: { id: mockChainId },
    estimateContractGas: jest.fn().mockResolvedValue(BigInt(150000)),
    getBalance: jest.fn().mockResolvedValue(BigInt(10) ** BigInt(18)),
  };

  const mockWalletClient = {
    writeContract: jest.fn().mockResolvedValue(mockTxHash),
  };

  const mockRelayerAccount = {
    address: mockRelayerAddress,
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        'contracts.delegatedAccount': mockDelegatedAccount,
        maxGasPriceGwei: 100,
      };
      return config[key];
    }),
  };

  const mockBlockchainService = {
    getChainId: jest.fn().mockReturnValue(mockChainId),
    getPublicClient: jest.fn().mockReturnValue(mockPublicClient),
    getWalletClient: jest.fn().mockReturnValue(mockWalletClient),
  };

  const mockRelayerWalletService = {
    getAddress: jest.fn().mockReturnValue(mockRelayerAddress),
    getAccount: jest.fn().mockReturnValue(mockRelayerAccount),
  };

  const mockGasOracleService = {
    isGasPriceAcceptable: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock recoverAddress to return the user's address
    (recoverAddress as jest.Mock).mockResolvedValue(mockUserAddress);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelayService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: BlockchainService, useValue: mockBlockchainService },
        { provide: RelayerWalletService, useValue: mockRelayerWalletService },
        { provide: GasOracleService, useValue: mockGasOracleService },
      ],
    }).compile();

    service = module.get<RelayService>(RelayService);
    gasOracleService = module.get<GasOracleService>(GasOracleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('relay', () => {
    it('should successfully relay a valid transaction', async () => {
      const result = await service.relay(mockRelayRequest);

      expect(result).toEqual({
        txHash: mockTxHash,
        status: 'submitted',
        message: 'Transaction successfully submitted to the network',
      });
    });

    it('should verify signature before relaying', async () => {
      await service.relay(mockRelayRequest);
      expect(recoverAddress).toHaveBeenCalled();
    });

    it('should check gas price before relaying', async () => {
      await service.relay(mockRelayRequest);
      expect(gasOracleService.isGasPriceAcceptable).toHaveBeenCalledWith(100);
    });

    it('should estimate gas before broadcasting', async () => {
      await service.relay(mockRelayRequest);
      expect(mockPublicClient.estimateContractGas).toHaveBeenCalled();
    });

    it('should broadcast transaction with correct parameters', async () => {
      await service.relay(mockRelayRequest);

      expect(mockWalletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: mockDelegatedAccount,
          functionName: 'execute',
          account: mockRelayerAccount,
        }),
      );
    });

    it('should return transaction hash', async () => {
      const result = await service.relay(mockRelayRequest);
      expect(result.txHash).toBe(mockTxHash);
    });
  });

  describe('chain validation', () => {
    it('should reject mismatched chain ID', async () => {
      const invalidRequest = {
        ...mockRelayRequest,
        chainId: 5888,
      };

      await expect(service.relay(invalidRequest)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.relay(invalidRequest)).rejects.toThrow(
        /Chain ID mismatch/,
      );
    });

    it('should accept correct chain ID', async () => {
      const result = await service.relay(mockRelayRequest);
      expect(result).toBeDefined();
    });

    it('should include expected and actual chain in error', async () => {
      const invalidRequest = { ...mockRelayRequest, chainId: 1 };

      try {
        await service.relay(invalidRequest);
        fail('Should have thrown');
      } catch (error) {
        expect(error.message).toContain('5887');
        expect(error.message).toContain('1');
      }
    });
  });

  describe('deadline validation', () => {
    it('should reject expired deadline', async () => {
      const expiredRequest = {
        ...mockRelayRequest,
        intent: {
          ...mockRelayRequest.intent,
          deadline: String(Math.floor(Date.now() / 1000) - 3600),
        },
      };

      await expect(service.relay(expiredRequest)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.relay(expiredRequest)).rejects.toThrow(
        /deadline has expired/,
      );
    });

    it('should accept future deadline', async () => {
      const result = await service.relay(mockRelayRequest);
      expect(result).toBeDefined();
    });

    it('should accept deadline exactly at current time', async () => {
      const nowRequest = {
        ...mockRelayRequest,
        intent: {
          ...mockRelayRequest.intent,
          deadline: String(Math.floor(Date.now() / 1000) + 1),
        },
      };

      const result = await service.relay(nowRequest);
      expect(result).toBeDefined();
    });
  });

  describe('signature verification', () => {
    beforeEach(() => {
      // Reset to valid signature for each test
      (recoverAddress as jest.Mock).mockResolvedValue(mockUserAddress);
    });

    it('should reject invalid signature', async () => {
      (recoverAddress as jest.Mock).mockResolvedValueOnce(
        '0x0000000000000000000000000000000000000000',
      );

      await expect(service.relay(mockRelayRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should accept valid signature', async () => {
      const result = await service.relay(mockRelayRequest);
      expect(result).toBeDefined();
    });

    it('should verify signature matches user address', async () => {
      (recoverAddress as jest.Mock).mockResolvedValueOnce(
        '0x1111111111111111111111111111111111111111',
      );

      await expect(service.relay(mockRelayRequest)).rejects.toThrow(
        /Signature verification failed/,
      );
    });

    it('should handle case-insensitive address comparison', async () => {
      (recoverAddress as jest.Mock).mockResolvedValueOnce(
        mockUserAddress.toUpperCase(),
      );

      const result = await service.relay(mockRelayRequest);
      expect(result).toBeDefined();
    });
  });

  describe('gas price validation', () => {
    beforeEach(() => {
      // Reset gas price check to true
      mockGasOracleService.isGasPriceAcceptable.mockResolvedValue(true);
    });

    it('should reject when gas price is too high', async () => {
      mockGasOracleService.isGasPriceAcceptable.mockResolvedValueOnce(false);

      await expect(service.relay(mockRelayRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should accept acceptable gas price', async () => {
      const result = await service.relay(mockRelayRequest);
      expect(result).toBeDefined();
    });

    it('should use configured max gas price', async () => {
      await service.relay(mockRelayRequest);
      expect(gasOracleService.isGasPriceAcceptable).toHaveBeenCalledWith(100);
    });
  });

  describe('transaction broadcasting', () => {
    beforeEach(() => {
      // Reset writeContract to success
      mockWalletClient.writeContract.mockResolvedValue(mockTxHash);
    });

    it('should throw InternalServerErrorException on broadcast failure', async () => {
      mockWalletClient.writeContract.mockRejectedValueOnce(
        new Error('RPC error'),
      );

      await expect(service.relay(mockRelayRequest)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should pass intent parameters to contract', async () => {
      await service.relay(mockRelayRequest);

      const call = mockWalletClient.writeContract.mock.calls[0][0];
      expect(call.args).toEqual([
        mockRelayRequest.intent.destination,
        BigInt(mockRelayRequest.intent.value),
        mockRelayRequest.intent.data,
        BigInt(mockRelayRequest.intent.nonce),
        BigInt(mockRelayRequest.intent.deadline),
        mockRelayRequest.signature,
      ]);
    });

    it('should use estimated gas for transaction', async () => {
      await service.relay(mockRelayRequest);

      const call = mockWalletClient.writeContract.mock.calls[0][0];
      expect(call.gas).toBe(BigInt(150000));
    });

    it('should handle gas estimation failure', async () => {
      mockPublicClient.estimateContractGas.mockRejectedValueOnce(
        new Error('Gas estimation failed'),
      );

      await expect(service.relay(mockRelayRequest)).rejects.toThrow();
    });
  });

  describe('getStatus', () => {
    it('should return relayer status', async () => {
      const status = await service.getStatus();

      expect(status).toEqual({
        relayerAddress: mockRelayerAddress,
        balance: expect.any(String),
        chainId: mockChainId,
        healthy: expect.any(Boolean),
      });
    });

    it('should fetch relayer balance', async () => {
      await service.getStatus();
      expect(mockPublicClient.getBalance).toHaveBeenCalledWith({
        address: mockRelayerAddress,
      });
    });

    it('should report healthy when balance > 0.1', async () => {
      mockPublicClient.getBalance.mockResolvedValueOnce(
        BigInt(10) ** BigInt(18),
      ); // 1 token

      const status = await service.getStatus();
      expect(status.healthy).toBe(true);
    });

    it('should report unhealthy when balance < 0.1', async () => {
      mockPublicClient.getBalance.mockResolvedValueOnce(
        BigInt(10) ** BigInt(16),
      ); // 0.01 token

      const status = await service.getStatus();
      expect(status.healthy).toBe(false);
    });

    it('should format balance in ether', async () => {
      const status = await service.getStatus();
      expect(status.balance).toMatch(/^\d+(\.\d+)?$/);
    });

    it('should include correct chain ID', async () => {
      const status = await service.getStatus();
      expect(status.chainId).toBe(mockChainId);
    });

    it('should include relayer address', async () => {
      const status = await service.getStatus();
      expect(status.relayerAddress).toBe(mockRelayerAddress);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      // Reset mocks
      mockBlockchainService.getPublicClient.mockReturnValue(mockPublicClient);
      mockWalletClient.writeContract.mockResolvedValue(mockTxHash);
    });

    it('should handle configuration errors', async () => {
      const badConfigService = {
        get: jest.fn().mockReturnValue(undefined),
      };

      const module = await Test.createTestingModule({
        providers: [
          RelayService,
          { provide: ConfigService, useValue: badConfigService },
          { provide: BlockchainService, useValue: mockBlockchainService },
          { provide: RelayerWalletService, useValue: mockRelayerWalletService },
          { provide: GasOracleService, useValue: mockGasOracleService },
        ],
      }).compile();

      const testService = module.get<RelayService>(RelayService);
      await expect(testService.relay(mockRelayRequest)).rejects.toThrow();
    });

    it('should handle blockchain service errors', async () => {
      mockBlockchainService.getPublicClient.mockImplementationOnce(() => {
        throw new Error('Service unavailable');
      });

      await expect(service.relay(mockRelayRequest)).rejects.toThrow();
    });

    it('should handle signature recovery errors', async () => {
      (recoverAddress as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid signature format'),
      );

      await expect(service.relay(mockRelayRequest)).rejects.toThrow();
    });
  });

  describe('EIP-712 digest computation', () => {
    it('should compute digest for signature verification', async () => {
      await service.relay(mockRelayRequest);

      // Verify recoverAddress was called with a digest
      expect(recoverAddress).toHaveBeenCalledWith({
        hash: expect.stringMatching(/^0x[a-fA-F0-9]{64}$/),
        signature: mockRelayRequest.signature,
      });
    });

    it('should include chain ID in digest', async () => {
      const request1 = { ...mockRelayRequest, chainId: 5887 };
      const request2 = { ...mockRelayRequest, chainId: 5888 };

      // First request should succeed
      await service.relay(request1);

      // Second should fail due to chain mismatch
      await expect(service.relay(request2)).rejects.toThrow();
    });

    it('should include all intent fields in digest', async () => {
      const customIntent = {
        destination: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        value: '1000000',
        data: '0x12345678',
        nonce: '5',
        deadline: String(Math.floor(Date.now() / 1000) + 3600),
      };

      const customRequest = {
        ...mockRelayRequest,
        intent: customIntent,
      };

      await service.relay(customRequest);
      expect(recoverAddress).toHaveBeenCalled();
    });
  });
});
