import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FeeService } from './fee.service';
import { FeeQuoteDto } from './dto/fee-quote.dto';
import { FeeQuoteRequestDto } from './dto/fee-quote-request.dto';

@ApiTags('fees')
@Controller('fees')
export class FeeController {
  private readonly logger = new Logger(FeeController.name);

  constructor(private readonly feeService: FeeService) {}

  @Get('quote')
  @ApiOperation({
    summary: 'Get fee quote for transfer',
    description:
      'Calculate relay fee by simulating the actual transfer on-chain. Returns a signed quote.',
  })
  @ApiResponse({
    status: 200,
    description: 'Fee quote successfully calculated and signed',
    type: FeeQuoteDto,
  })
  async getQuote(@Query() params: FeeQuoteRequestDto): Promise<FeeQuoteDto> {
    this.logger.log(
      `GET /fees/quote - token: ${params.token}, amount: ${params.amount}, recipient: ${params.recipient}`,
    );
    return this.feeService.getFeeQuote(params);
  }
}
