import {
  Controller,
  Get,
  Param,
  Query,
  Logger,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NonceService } from './nonce.service';

@ApiTags('nonce')
@Controller('nonce')
export class NonceController {
  private readonly logger = new Logger(NonceController.name);

  constructor(private readonly nonceService: NonceService) {}

  @Get(':address')
  @ApiOperation({
    summary: 'Get account nonce',
    description:
      'Query the current nonce for an account from the DelegatedAccount contract',
  })
  @ApiParam({
    name: 'address',
    description: 'Ethereum address to query',
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  })
  @ApiQuery({
    name: 'chainId',
    required: false,
    description: 'Chain ID for validation',
    example: 5888,
  })
  @ApiResponse({
    status: 200,
    description: 'Nonce successfully retrieved',
    schema: {
      type: 'object',
      properties: {
        nonce: { type: 'string', example: '0' },
        address: {
          type: 'string',
          example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid address format or chain ID mismatch',
  })
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
