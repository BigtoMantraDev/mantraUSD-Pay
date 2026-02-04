import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsEthereumAddress,
  Matches,
} from 'class-validator';

class IntentDto {
  @IsEthereumAddress()
  destination: string;

  @IsString()
  @Matches(/^0x[0-9a-fA-F]*$/)
  value: string;

  @IsString()
  @Matches(/^0x[0-9a-fA-F]*$/)
  data: string;

  @IsString()
  @Matches(/^[0-9]+$/)
  nonce: string;

  @IsString()
  @Matches(/^[0-9]+$/)
  deadline: string;
}

export class RelayRequestDto {
  @IsEthereumAddress()
  userAddress: string;

  @IsString()
  @Matches(/^0x[0-9a-fA-F]{130}$/)
  signature: string;

  @IsNotEmpty()
  intent: IntentDto;

  @IsNumber()
  chainId: number;
}
