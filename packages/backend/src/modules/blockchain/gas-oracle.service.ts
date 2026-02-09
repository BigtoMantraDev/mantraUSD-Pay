import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { encodeFunctionData, formatGwei, parseGwei, type Address } from 'viem';

@Injectable()
export class GasOracleService {
  private readonly logger = new Logger(GasOracleService.name);

  private priceCache: { price: number; expiresAt: number } | null = null;

  constructor(
    private blockchainService: BlockchainService,
    private configService: ConfigService,
  ) {}

  async getGasPrice(): Promise<bigint> {
    const publicClient = this.blockchainService.getPublicClient();
    const gasPrice = await publicClient.getGasPrice();

    this.logger.debug(`Current gas price: ${formatGwei(gasPrice)} gwei`);
    return gasPrice;
  }

  async getGasPriceGwei(): Promise<string> {
    const gasPrice = await this.getGasPrice();
    return formatGwei(gasPrice);
  }

  async isGasPriceAcceptable(maxGwei: number): Promise<boolean> {
    const currentGasPrice = await this.getGasPrice();
    const maxGasPrice = parseGwei(maxGwei.toString());

    const acceptable = currentGasPrice <= maxGasPrice;

    if (!acceptable) {
      this.logger.warn(
        `Gas price ${formatGwei(currentGasPrice)} gwei exceeds maximum ${maxGwei} gwei`,
      );
    }

    return acceptable;
  }

  /**
   * Estimate gas for DelegatedAccount.execute() transaction
   *
   * Attempts real on-chain estimation for the ERC20 transfer, then adds
   * a configurable overhead for DelegatedAccount execution (signature
   * verification, nonce management, event emission).
   *
   * Falls back to static config value if estimation fails.
   */
  async estimateExecuteGas(params: {
    tokenAddress: string;
    amount: string;
    recipient: string;
    sender?: string;
  }): Promise<bigint> {
    const staticGas = BigInt(
      this.configService.get<number>('fee.estimatedGas')!,
    );
    const overhead = BigInt(
      this.configService.get<number>('fee.delegatedAccountOverhead')!,
    );

    if (!params.sender) {
      this.logger.debug(
        `No sender provided, using static gas estimate: ${staticGas}`,
      );
      return staticGas;
    }

    try {
      const publicClient = this.blockchainService.getPublicClient();

      const transferData = encodeFunctionData({
        abi: [
          {
            name: 'transfer',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
            outputs: [{ name: '', type: 'bool' }],
          },
        ],
        functionName: 'transfer',
        args: [params.recipient as Address, BigInt(params.amount)],
      });

      const erc20Gas = await publicClient.estimateGas({
        account: params.sender as Address,
        to: params.tokenAddress as Address,
        data: transferData,
      });

      const totalGas = erc20Gas + overhead;

      this.logger.debug(
        `Real gas estimate: ${erc20Gas} (ERC20) + ${overhead} (overhead) = ${totalGas}`,
      );

      return totalGas;
    } catch (error) {
      this.logger.warn(
        `Gas estimation failed, using static fallback: ${staticGas} — ${error instanceof Error ? error.message : error}`,
      );
      return staticGas;
    }
  }

  /**
   * Fetch OM/USD price from CoinGecko with caching
   */
  async getOmPriceUsd(): Promise<number> {
    const now = Date.now();
    if (this.priceCache && this.priceCache.expiresAt > now) {
      return this.priceCache.price;
    }

    const coingeckoId = this.configService.get<string>('price.coingeckoId')!;
    const cacheTtl =
      this.configService.get<number>('price.cacheTtlSeconds')! * 1000;
    const fallbackPrice = this.configService.get<number>(
      'price.fallbackOmUsd',
    )!;

    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`CoinGecko HTTP ${res.status}`);
      }

      const data = await res.json();
      const price = data[coingeckoId]?.usd;

      if (typeof price !== 'number' || price <= 0) {
        throw new Error(`Invalid price data: ${JSON.stringify(data)}`);
      }

      this.priceCache = { price, expiresAt: now + cacheTtl };
      this.logger.debug(`OM price from CoinGecko: $${price}`);
      return price;
    } catch (error) {
      this.logger.warn(
        `CoinGecko price fetch failed, using fallback $${fallbackPrice} — ${error instanceof Error ? error.message : error}`,
      );

      // Cache the fallback for a shorter period (10s) to retry sooner
      this.priceCache = { price: fallbackPrice, expiresAt: now + 10_000 };
      return fallbackPrice;
    }
  }
}
