import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsEthereumAddress,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class IntentDto {
  @ApiProperty({ example: '0xd2b95283011E47257917770D28Bb3EE44c849f6F' })
  @IsEthereumAddress()
  destination: string;

  @ApiProperty({ example: '0x0', description: 'Native value in wei' })
  @IsString()
  @Matches(/^0x[0-9a-fA-F]*$/)
  value: string;

  @ApiProperty({
    example: '0xa9059cbb...',
    description: 'Encoded function call',
  })
  @IsString()
  @Matches(/^0x[0-9a-fA-F]*$/)
  data: string;

  @ApiProperty({ example: '0', description: 'User nonce' })
  @IsString()
  @Matches(/^[0-9]+$/)
  nonce: string;

  @ApiProperty({
    example: '1706832000',
    description: 'Unix timestamp deadline',
  })
  @IsString()
  @Matches(/^[0-9]+$/)
  deadline: string;
}

export class RelayRequestDto {
  @ApiProperty({ example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' })
  @IsEthereumAddress()
  userAddress: string;

  @ApiProperty({
    example: '0x1234...',
    description: 'EIP-712 signature (130 chars)',
  })
  @IsString()
  @Matches(/^0x[0-9a-fA-F]{130}$/)
  signature: string;

  @ApiProperty({ type: IntentDto })
  @IsNotEmpty()
  intent: IntentDto;

  @IsNumber()
  chainId: number;
}
