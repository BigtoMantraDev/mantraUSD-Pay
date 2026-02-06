import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsNumberString, IsOptional } from 'class-validator';

/**
 * Query parameters for requesting a fee quote
 * These details are used to simulate the actual transfer and estimate gas
 */
export class FeeQuoteRequestDto {
  @ApiProperty({
    example: '0x4B545d0758eda6601B051259bD977125fbdA7ba2',
    description: 'Token address to transfer (mantraUSD)',
    required: true,
  })
  @IsEthereumAddress()
  token: string;

  @ApiProperty({
    example: '1000000000000000000',
    description: 'Amount to transfer in wei',
    required: true,
  })
  @IsNumberString()
  amount: string;

  @ApiProperty({
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5',
    description: 'Recipient address',
    required: true,
  })
  @IsEthereumAddress()
  recipient: string;

  @ApiProperty({
    example: '0x1234567890123456789012345678901234567890',
    description: 'Sender address (optional - for gas estimation accuracy)',
    required: false,
  })
  @IsEthereumAddress()
  @IsOptional()
  sender?: string;
}
