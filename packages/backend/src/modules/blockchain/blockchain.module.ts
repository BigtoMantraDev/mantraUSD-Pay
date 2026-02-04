import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { RelayerWalletService } from './relayer-wallet.service';
import { GasOracleService } from './gas-oracle.service';

@Module({
  providers: [BlockchainService, RelayerWalletService, GasOracleService],
  exports: [BlockchainService, RelayerWalletService, GasOracleService],
})
export class BlockchainModule {}
