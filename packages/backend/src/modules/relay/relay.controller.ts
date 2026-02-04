import { Controller, Post, Get, Body, Logger, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { RelayService } from './relay.service';
import { RelayRequestDto } from './dto/relay-request.dto';
import { RelayResponseDto, RelayStatusDto } from './dto/relay-response.dto';

@Controller('relay')
@UseGuards(ThrottlerGuard)
export class RelayController {
  private readonly logger = new Logger(RelayController.name);

  constructor(private readonly relayService: RelayService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async relay(@Body() request: RelayRequestDto): Promise<RelayResponseDto> {
    this.logger.log(`POST /relay from ${request.userAddress}`);
    return this.relayService.relay(request);
  }

  @Get('status')
  async getStatus(): Promise<RelayStatusDto> {
    this.logger.log('GET /relay/status');
    return this.relayService.getStatus();
  }
}
