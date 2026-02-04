export class FeeQuoteDto {
  fee: string;
  feeFormatted: string;
  gasPrice: string;
  gasPriceGwei: string;
  estimatedGas: number;
  bufferPercent: number;
  expiresAt: number;
  enabled: boolean;
}
