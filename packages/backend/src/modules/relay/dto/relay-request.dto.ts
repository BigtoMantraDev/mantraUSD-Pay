import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsEthereumAddress,
  IsOptional,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * EIP-7702 Authorization tuple
 * Signed by the user's EOA to delegate to the DelegatedAccount contract
 */
class AuthorizationDto {
  @ApiProperty({ example: 1, description: 'Chain ID for the authorization' })
  @IsNumber()
  chainId: number;

  @ApiProperty({
    example: '0x1234...',
    description: 'Contract address to delegate to',
  })
  @IsEthereumAddress()
  contractAddress: string;

  @ApiProperty({ example: '0', description: 'Authorization nonce' })
  @IsString()
  @Matches(/^[0-9]+$/)
  nonce: string;

  @ApiProperty({ example: '0x1234...', description: 'Signature r component' })
  @IsString()
  @Matches(/^0x[0-9a-fA-F]{64}$/)
  r: string;

  @ApiProperty({ example: '0x1234...', description: 'Signature s component' })
  @IsString()
  @Matches(/^0x[0-9a-fA-F]{64}$/)
  s: string;

  @ApiProperty({ example: 0, description: 'Signature yParity (0 or 1)' })
  @IsNumber()
  yParity: number;
}

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

  @ApiPropertyOptional({
    type: AuthorizationDto,
    description:
      'EIP-7702 authorization for delegating EOA to DelegatedAccount contract. Required for first-time users or when authorization has expired.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AuthorizationDto)
  authorization?: AuthorizationDto;

  @ApiProperty({ type: IntentDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => IntentDto)
  intent: IntentDto;

  @IsNumber()
  chainId: number;
}
