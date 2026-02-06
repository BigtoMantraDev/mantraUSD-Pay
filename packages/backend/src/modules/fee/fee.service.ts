import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { keccak256, parseUnits, toHex } from 'viem';
import { GasOracleService } from '../blockchain/gas-oracle.service';
import { FeeQuoteDto } from './dto/fee-quote.dto';
import { FeeQuoteRequestDto } from './dto/fee-quote-request.dto';

@Injectable()
export class FeeService {
  private readonly logger = new Logger(FeeService.name);
  private quoteCache = new Map<
    string,
    { quote: FeeQuoteDto; expiresAt: number }
  >();

  constructor(
    private configService: ConfigService,
    private gasOracleService: GasOracleService,
  ) {}

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
    this.configService.get<string>('relayer.privateKey')!;

    // Estimate actual gas for this specific transfer
    const estimatedGas = await this.gasOracleService.estimateExecuteGas({
      tokenAddress: params.token,
      amount: params.amount,
      recipient: params.recipient,
      sender: params.sender,
    });

    // Get current gas price
    const gasPrice = await this.gasOracleService.getGasPrice();

    // Calculate gas cost in wei
    const gasCost = gasPrice * estimatedGas;

    // Apply buffer
    // Convert to token wei (assuming 1:1 price parity)
    // In production, you'd use a price oracle to convert native token cost to fee token
    let feeWei = (gasCost * BigInt(100 + bufferPercent)) / BigInt(100);

    // Apply min/max caps (convert to wei first)
    const minFeeWei = parseUnits(minFee.toString(), tokenDecimals);
    const maxFeeWei = parseUnits(maxFee.toString(), tokenDecimals);

    if (feeWei < minFeeWei) feeWei = minFeeWei;
    if (feeWei > maxFeeWei) feeWei = maxFeeWei;

    const deadline = Math.floor(Date.now() / 1000) + quoteTtlSeconds;

    // Sign the quote (hash of feeAmount + feeToken + deadline)
    const messageHash = keccak256(
      toHex(`${feeWei.toString()}-${feeTokenAddress}-${deadline}`),
    );

    // TODO: Implement proper EIP-712 signing with relayer private key
    // For now, use a simple signature (replace with actual signing logic)
    const signature = `0x${messageHash.slice(2)}${'00'.repeat(32)}`;

    this.logger.debug(
      `Fee quote: ${feeWei.toString()} wei (gas: ${estimatedGas}, price: ${gasPrice})`,
    );

    const quote: FeeQuoteDto = {
      feeAmount: feeWei.toString(),
      feeToken: feeTokenAddress,
      deadline,
      signature,
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
}
