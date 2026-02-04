import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FeeService } from './fee.service';
import { FeeQuoteDto } from './dto/fee-quote.dto';

@ApiTags('fees')
@Controller('fees')
export class FeeController {
  private readonly logger = new Logger(FeeController.name);

  constructor(private readonly feeService: FeeService) {}

  @Get('quote')
  @ApiOperation({
    summary: 'Get fee quote',
    description:
      'Calculate and return the current relay fee based on gas prices',
  })
  @ApiResponse({
    status: 200,
    description: 'Fee quote successfully calculated',
    type: FeeQuoteDto,
  })
  async getQuote(): Promise<FeeQuoteDto> {
    this.logger.log('GET /fees/quote');
    return this.feeService.getFeeQuote();
  }
}
