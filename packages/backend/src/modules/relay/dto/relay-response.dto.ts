import { ApiProperty } from '@nestjs/swagger';

export class RelayResponseDto {
  @ApiProperty({ example: '0x1234...', description: 'Transaction hash' })
  txHash: string;

  @ApiProperty({
    example: 'submitted',
    enum: ['submitted', 'pending', 'confirmed', 'failed'],
    description: 'Transaction status',
  })
  status: 'submitted' | 'pending' | 'confirmed' | 'failed';

  @ApiProperty({
    example: 'Transaction successfully submitted',
    required: false,
  })
  message?: string;
}

export class RelayStatusDto {
  @ApiProperty({ example: '0x78d891B412eaAA4df95364105D48Ef9cA52911B3' })
  relayerAddress: string;

  @ApiProperty({
    example: '1.234',
    description: 'Relayer balance in native tokens',
  })
  balance: string;

  @ApiProperty({ example: 5888, description: 'Chain ID' })
  chainId: number;

  @ApiProperty({ example: true, description: 'Health status' })
  healthy: boolean;
}
