import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GasOracleService } from '../blockchain/gas-oracle.service';
import { FeeQuoteDto } from './dto/fee-quote.dto';
import { formatUnits } from 'viem';

@Injectable()
export class FeeService {
  private readonly logger = new Logger(FeeService.name);

  constructor(
    private configService: ConfigService,
    private gasOracleService: GasOracleService,
  ) {}

  async getFeeQuote(): Promise<FeeQuoteDto> {
    const enabled = this.configService.get<boolean>('fee.enabled')!;
    const estimatedGas = this.configService.get<number>('fee.estimatedGas')!;
    const bufferPercent = this.configService.get<number>('fee.bufferPercent')!;
    const minFee = this.configService.get<number>('fee.min')!;
    const maxFee = this.configService.get<number>('fee.max')!;
    const quoteTtlSeconds = this.configService.get<number>(
      'fee.quoteTtlSeconds',
    )!;
    const tokenDecimals = this.configService.get<number>(
      'contracts.token.decimals',
    )!;
    const tokenSymbol = this.configService.get<string>(
      'contracts.token.symbol',
    )!;

    const gasPrice = await this.gasOracleService.getGasPrice();
    const gasPriceGwei = await this.gasOracleService.getGasPriceGwei();

    // Calculate gas cost in wei
    const gasCost = gasPrice * BigInt(estimatedGas);

    // Apply buffer
    const gasCostWithBuffer =
      (gasCost * BigInt(100 + bufferPercent)) / BigInt(100);

    // Convert to token decimals (assuming 1:1 price parity with native token)
    // This is a simplified calculation - in production you'd use an oracle
    const feeAmount = formatUnits(gasCostWithBuffer, tokenDecimals);

    // Apply min/max caps
    let finalFee = parseFloat(feeAmount);
    if (finalFee < minFee) finalFee = minFee;
    if (finalFee > maxFee) finalFee = maxFee;

    const feeString = finalFee.toFixed(tokenDecimals);
    const expiresAt = Math.floor(Date.now() / 1000) + quoteTtlSeconds;

    this.logger.debug(
      `Fee quote: ${feeString} ${tokenSymbol} (gas: ${estimatedGas}, price: ${gasPriceGwei} gwei)`,
    );

    return {
      fee: feeString,
      feeFormatted: `${feeString} ${tokenSymbol}`,
      gasPrice: gasPrice.toString(),
      gasPriceGwei,
      estimatedGas,
      bufferPercent,
      expiresAt,
      enabled,
    };
  }
}
