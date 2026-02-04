export class RelayResponseDto {
  txHash: string;
  status: 'submitted' | 'pending' | 'confirmed' | 'failed';
  message?: string;
}

export class RelayStatusDto {
  relayerAddress: string;
  balance: string;
  chainId: number;
  healthy: boolean;
}
