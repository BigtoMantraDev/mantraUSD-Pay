import { Module } from '@nestjs/common';
import { RelayController } from './relay.controller';
import { RelayService } from './relay.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { FeeModule } from '../fee/fee.module';

@Module({
  imports: [BlockchainModule, FeeModule],
  controllers: [RelayController],
  providers: [RelayService],
})
export class RelayModule {}
