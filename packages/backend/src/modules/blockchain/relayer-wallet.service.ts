import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { privateKeyToAccount } from 'viem/accounts';
import type { PrivateKeyAccount } from 'viem';

@Injectable()
export class RelayerWalletService {
  private readonly logger = new Logger(RelayerWalletService.name);
  private readonly account: PrivateKeyAccount;

  constructor(private configService: ConfigService) {
    const privateKey =
      this.configService.get<`0x${string}`>('relayer.privateKey')!;
    this.account = privateKeyToAccount(privateKey);
    this.logger.log(`Relayer wallet initialized: ${this.account.address}`);
  }

  getAccount(): PrivateKeyAccount {
    return this.account;
  }

  getAddress(): `0x${string}` {
    return this.account.address;
  }
}
