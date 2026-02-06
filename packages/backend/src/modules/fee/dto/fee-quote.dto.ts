import { ApiProperty } from '@nestjs/swagger';

/**
 * Fee quote response matching frontend FeeQuote interface
 * This quote is signed by the backend and can be verified by the relayer
 */
export class FeeQuoteDto {
  @ApiProperty({
    example: '50000000000000000',
    description: 'Fee amount in token wei (not decimal)',
  })
  feeAmount: string;

  @ApiProperty({
    example: '0x4B545d0758eda6601B051259bD977125fbdA7ba2',
    description: 'Token address for fee payment (mantraUSD)',
  })
  feeToken: string;

  @ApiProperty({
    example: 1706832000,
    description: 'Unix timestamp when quote expires (in seconds)',
  })
  deadline: number;

  @ApiProperty({
    example: '0x1234...abcd',
    description: 'Backend signature authorizing this fee quote',
  })
  signature: string;

  @ApiProperty({
    example: '0x78d891B412eaAAf000D28Bb3EE44c849f6F12345',
    description: 'Relayer address for fee collection',
  })
  relayerAddress: string;
}
