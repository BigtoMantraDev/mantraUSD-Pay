import { Module } from '@nestjs/common';
import { RelayController } from './relay.controller';
import { RelayService } from './relay.service';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  controllers: [RelayController],
  providers: [RelayService],
})
export class RelayModule {}
