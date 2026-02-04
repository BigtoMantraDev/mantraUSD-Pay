import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('rateLimit.ttl')! * 1000, // Convert to ms
          limit: config.get<number>('rateLimit.limit')!,
        },
      ],
    }),
    BlockchainModule,
    FeeModule,
    NonceModule,
    RelayModule,
    HealthModule,
  ],
})
export class AppModule {}
