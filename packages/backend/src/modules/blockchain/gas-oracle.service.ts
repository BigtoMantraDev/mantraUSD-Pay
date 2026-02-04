import { Injectable, Logger } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { formatGwei, parseGwei } from 'viem';

@Injectable()
export class GasOracleService {
  private readonly logger = new Logger(GasOracleService.name);

  constructor(private blockchainService: BlockchainService) {}

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
}
