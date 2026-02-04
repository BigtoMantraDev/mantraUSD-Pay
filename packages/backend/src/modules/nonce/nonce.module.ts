import { Module } from '@nestjs/common';
import { NonceController } from './nonce.controller';
import { NonceService } from './nonce.service';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  controllers: [NonceController],
  providers: [NonceService],
})
export class NonceModule {}
