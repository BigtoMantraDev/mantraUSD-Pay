import { Controller, Post, Get, Body, Logger, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { RelayService } from './relay.service';
import { RelayRequestDto } from './dto/relay-request.dto';
import { RelayResponseDto, RelayStatusDto } from './dto/relay-response.dto';

@ApiTags('relay')
@Controller('relay')
@UseGuards(ThrottlerGuard)
export class RelayController {
  private readonly logger = new Logger(RelayController.name);

  constructor(private readonly relayService: RelayService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Relay transaction',
    description:
      'Submit a signed intent for relay. Verifies EIP-712 signature and broadcasts transaction.',
  })
  @ApiBody({ type: RelayRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Transaction successfully relayed',
    type: RelayResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid request, signature verification failed, or nonce mismatch',
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded (10 requests per minute)',
  })
  async relay(@Body() request: RelayRequestDto): Promise<RelayResponseDto> {
    this.logger.log(`POST /relay from ${request.userAddress}`);
    return this.relayService.relay(request);
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get relayer status',
    description: 'Check relayer health, balance, and chain information',
  })
  @ApiResponse({
    status: 200,
    description: 'Relayer status retrieved',
    type: RelayStatusDto,
  })
  async getStatus(): Promise<RelayStatusDto> {
    this.logger.log('GET /relay/status');
    return this.relayService.getStatus();
  }
}
