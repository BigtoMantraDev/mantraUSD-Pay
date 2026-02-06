import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { formatGwei, parseGwei } from 'viem';

@Injectable()
export class GasOracleService {
  private readonly logger = new Logger(GasOracleService.name);

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
   * Uses a static gas estimate because:
   * 1. Cannot simulate execute() with dummy signature (ECDSA recovery fails)
   * 2. ERC20 transfers via DelegatedAccount have predictable gas costs
   * 3. Live gas price (fetched separately) is the real variable component
   *
   * Gas breakdown:
   * - Standard ERC20.transfer(): ~65k gas
   * - DelegatedAccount overhead (signature verification, nonce, event): ~55k gas
   * - Safety buffer: ~30k gas
   * - Total: ~150k gas (configurable via FEE_ESTIMATED_GAS)
   */
  async estimateExecuteGas(params: {
    tokenAddress: string;
    amount: string;
    recipient: string;
    sender?: string;
  }): Promise<bigint> {
    const staticGas = this.configService.get<number>('fee.estimatedGas')!;

    this.logger.debug(
      `Using static gas estimate: ${staticGas} units ` +
        `(token: ${params.tokenAddress}, amount: ${params.amount})`,
    );

    return BigInt(staticGas);
  }
}
