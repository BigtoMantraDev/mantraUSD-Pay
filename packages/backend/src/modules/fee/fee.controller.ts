import { Controller, Get, Logger } from '@nestjs/common';
import { FeeService } from './fee.service';
import { FeeQuoteDto } from './dto/fee-quote.dto';

@Controller('fees')
export class FeeController {
  private readonly logger = new Logger(FeeController.name);

  constructor(private readonly feeService: FeeService) {}

  @Get('quote')
  async getQuote(): Promise<FeeQuoteDto> {
    this.logger.log('GET /fees/quote');
    return this.feeService.getFeeQuote();
  }
}
