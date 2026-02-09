import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseUnits, verifyTypedData } from 'viem';
import { GasOracleService } from '../blockchain/gas-oracle.service';
import { RelayerWalletService } from '../blockchain/relayer-wallet.service';
import { FeeQuoteDto } from './dto/fee-quote.dto';
import { FeeQuoteRequestDto } from './dto/fee-quote-request.dto';

@Injectable()
export class FeeService {
  private readonly logger = new Logger(FeeService.name);
  private quoteCache = new Map<
    string,
    { quote: FeeQuoteDto; expiresAt: number }
  >();

  private readonly FEE_QUOTE_TYPES = {
    FeeQuote: [
      { name: 'feeToken', type: 'address' },
      { name: 'feeAmount', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  } as const;

  constructor(
    private configService: ConfigService,
    private gasOracleService: GasOracleService,
    private relayerWalletService: RelayerWalletService,
  ) {}

  private getFeeQuoteDomain() {
    return {
      name: 'MantraUSD Pay' as const,
      version: '1' as const,
      chainId: this.configService.get<number>('chain.id')!,
      verifyingContract: this.relayerWalletService.getAddress(),
    };
  }

  async getFeeQuote(params: FeeQuoteRequestDto): Promise<FeeQuoteDto> {
    // Check cache first (3-second TTL)
    const cacheKey = `${params.token}-${params.amount}-${params.recipient}`;
    const cached = this.quoteCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      this.logger.debug(`Returning cached quote for ${cacheKey}`);
      return cached.quote;
    }

    // Get configuration
    const bufferPercent = this.configService.get<number>('fee.bufferPercent')!;
    const minFee = this.configService.get<number>('fee.min')!;
    const maxFee = this.configService.get<number>('fee.max')!;
    const quoteTtlSeconds = this.configService.get<number>(
      'fee.quoteTtlSeconds',
    )!;
    const tokenDecimals = this.configService.get<number>(
      'contracts.token.decimals',
    )!;
    const feeTokenAddress = this.configService.get<string>(
      'contracts.token.address',
    )!;

    // Estimate actual gas for this specific transfer
    const estimatedGas = await this.gasOracleService.estimateExecuteGas({
      tokenAddress: params.token,
      amount: params.amount,
      recipient: params.recipient,
      sender: params.sender,
    });

    // Get current gas price
    const gasPrice = await this.gasOracleService.getGasPrice();

    // Calculate gas cost in native wei (18 decimals)
    const gasCost = gasPrice * estimatedGas;

    // Fetch OM/USD price to convert gas cost to mantraUSD
    const omPriceUsd = await this.gasOracleService.getOmPriceUsd();

    // Convert: gasCost (wei) * omPrice (USD/OM) / 10^18 (wei→OM) * 10^tokenDecimals (→token wei)
    // Use integer math with precision multiplier to avoid floating point
    const pricePrecision = 1_000_000n; // 6 decimal places for price
    const omPriceBigInt = BigInt(
      Math.round(omPriceUsd * Number(pricePrecision)),
    );
    const tokenScale = BigInt(10) ** BigInt(tokenDecimals);
    const nativeScale = BigInt(10) ** 18n;

    let feeWei =
      (gasCost * omPriceBigInt * tokenScale * BigInt(100 + bufferPercent)) /
      (nativeScale * pricePrecision * 100n);

    // Apply min/max caps (convert to wei first)
    const minFeeWei = parseUnits(minFee.toString(), tokenDecimals);
    const maxFeeWei = parseUnits(maxFee.toString(), tokenDecimals);

    if (feeWei < minFeeWei) feeWei = minFeeWei;
    if (feeWei > maxFeeWei) feeWei = maxFeeWei;

    const deadline = Math.floor(Date.now() / 1000) + quoteTtlSeconds;

    // Sign the quote using EIP-712 typed data with the relayer's private key
    const account = this.relayerWalletService.getAccount();
    const signature = await account.signTypedData({
      domain: this.getFeeQuoteDomain(),
      types: this.FEE_QUOTE_TYPES,
      primaryType: 'FeeQuote',
      message: {
        feeToken: feeTokenAddress as `0x${string}`,
        feeAmount: feeWei,
        deadline: BigInt(deadline),
      },
    });

    this.logger.debug(
      `Fee quote: ${feeWei.toString()} token wei (gas: ${estimatedGas}, gasPrice: ${gasPrice}, OM/USD: $${omPriceUsd})`,
    );

    // Get relayer address for fee collection
    const relayerAddress = this.relayerWalletService.getAddress();

    const quote: FeeQuoteDto = {
      feeAmount: feeWei.toString(),
      feeToken: feeTokenAddress,
      deadline,
      signature,
      relayerAddress,
    };

    // Cache for 3 seconds
    this.quoteCache.set(cacheKey, {
      quote,
      expiresAt: now + 3000, // 3 seconds
    });

    // Clean up expired cache entries
    this.cleanCache();

    return quote;
  }

  private cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.quoteCache.entries()) {
      if (value.expiresAt <= now) {
        this.quoteCache.delete(key);
      }
    }
  }

  /**
   * Verify a fee quote EIP-712 signature
   * @param feeAmount The fee amount in wei
   * @param feeToken The fee token address
   * @param deadline The deadline timestamp
   * @param signature The EIP-712 signature to verify
   * @returns true if the signature is valid and deadline hasn't expired
   */
  async verifyFeeQuote(
    feeAmount: string,
    feeToken: string,
    deadline: number,
    signature: string,
  ): Promise<boolean> {
    // Check deadline hasn't expired
    const now = Math.floor(Date.now() / 1000);
    if (deadline <= now) {
      this.logger.warn(`Fee quote expired: deadline ${deadline} < now ${now}`);
      return false;
    }

    try {
      const valid = await verifyTypedData({
        address: this.relayerWalletService.getAddress(),
        domain: this.getFeeQuoteDomain(),
        types: this.FEE_QUOTE_TYPES,
        primaryType: 'FeeQuote',
        message: {
          feeToken: feeToken as `0x${string}`,
          feeAmount: BigInt(feeAmount),
          deadline: BigInt(deadline),
        },
        signature: signature as `0x${string}`,
      });

      if (!valid) {
        this.logger.warn('Fee quote signature verification failed');
      }
      return valid;
    } catch (error) {
      this.logger.warn(
        `Fee quote signature verification error: ${error instanceof Error ? error.message : error}`,
      );
      return false;
    }
  }
}
