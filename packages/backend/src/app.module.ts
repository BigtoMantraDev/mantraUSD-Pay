import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validate } from './config/validation';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { FeeModule } from './modules/fee/fee.module';
import { NonceModule } from './modules/nonce/nonce.module';
import { RelayModule } from './modules/relay/relay.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    BlockchainModule,
    FeeModule,
    NonceModule,
    RelayModule,
    HealthModule,
  ],
})
export class AppModule {}
