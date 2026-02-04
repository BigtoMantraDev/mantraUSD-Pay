import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsString,
  IsUrl,
  validateSync,
  MinLength,
  Min,
  Max,
} from 'class-validator';

class EnvironmentVariables {
  @IsNumber()
  @Min(1)
  PORT: number = 3000;

  @IsNumber()
  CHAIN_ID: number;

  @IsUrl({ require_tld: false })
  RPC_URL: string;

  @IsString()
  @MinLength(66)
  RELAYER_PRIVATE_KEY: string;

  @IsString()
  @MinLength(42)
  DELEGATED_ACCOUNT_ADDRESS: string;

  @IsString()
  @MinLength(42)
  TOKEN_ADDRESS: string;

  @IsNumber()
  @Min(1)
  @Max(18)
  TOKEN_DECIMALS: number = 6;

  @IsString()
  TOKEN_SYMBOL: string = 'mantraUSD';

  @IsBoolean()
  FEE_ENABLED: boolean = true;

  @IsNumber()
  @Min(1)
  FEE_ESTIMATED_GAS: number = 150000;

  @IsNumber()
  @Min(0)
  @Max(100)
  FEE_BUFFER_PERCENT: number = 20;

  @IsNumber()
  @Min(0)
  FEE_MIN: number = 0.01;

  @IsNumber()
  FEE_MAX: number = 1.0;

  @IsNumber()
  @Min(1)
  FEE_QUOTE_TTL_SECONDS: number = 60;

  @IsNumber()
  @Min(1)
  RATE_LIMIT_TTL: number = 60;

  @IsNumber()
  @Min(1)
  RATE_LIMIT_MAX: number = 10;

  @IsNumber()
  @Min(1)
  MAX_GAS_PRICE_GWEI: number = 100;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
