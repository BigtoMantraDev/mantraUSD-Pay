import {
  Controller,
  Get,
  Param,
  Query,
  Logger,
  ParseIntPipe,
} from '@nestjs/common';
import { NonceService } from './nonce.service';

@Controller('nonce')
export class NonceController {
  private readonly logger = new Logger(NonceController.name);

  constructor(private readonly nonceService: NonceService) {}

  @Get(':address')
  async getNonce(
    @Param('address') address: string,
    @Query('chainId', new ParseIntPipe({ optional: true })) chainId?: number,
  ): Promise<{ nonce: string; address: string }> {
    this.logger.log(
      `GET /nonce/${address}${chainId ? `?chainId=${chainId}` : ''}`,
    );
    const nonce = await this.nonceService.getNonce(address, chainId);
    return { nonce, address };
  }
}
