import { ApiProperty } from '@nestjs/swagger';

export class FeeQuoteDto {
  @ApiProperty({ example: '0.05', description: 'Fee amount in token units' })
  fee: string;

  @ApiProperty({
    example: '0.05 mantraUSD',
    description: 'Formatted fee with symbol',
  })
  feeFormatted: string;

  @ApiProperty({ example: '1000000000', description: 'Gas price in wei' })
  gasPrice: string;

  @ApiProperty({ example: '1.0', description: 'Gas price in gwei' })
  gasPriceGwei: string;

  @ApiProperty({ example: 150000, description: 'Estimated gas units' })
  estimatedGas: number;

  @ApiProperty({ example: 20, description: 'Fee buffer percentage' })
  bufferPercent: number;

  @ApiProperty({
    example: 1706832000,
    description: 'Unix timestamp when quote expires',
  })
  expiresAt: number;

  @ApiProperty({
    example: true,
    description: 'Whether fee charging is enabled',
  })
  enabled: boolean;
}
