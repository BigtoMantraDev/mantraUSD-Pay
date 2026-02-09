import { useQuery } from '@tanstack/react-query';
import { type Address } from 'viem';

import { useAppConfig } from './useAppConfig';

/**
 * Fee quote response from backend
 */
export interface FeeQuote {
  /** Fee amount in token wei */
  feeAmount: string;
  /** Token address for fee payment */
  feeToken: Address;
  /** Expiration timestamp (seconds) */
  deadline: number;
  /** Backend signature for fee approval */
  signature: `0x${string}`;
}

/**
 * Hook to fetch fee quote from backend relayer
 * Sends transfer details to backend for accurate gas estimation
 * Caches quotes for 10 seconds before refetching
 *
 * @param tokenAddress - Token to transfer
 * @param amount - Amount to transfer in wei
 * @param recipient - Recipient address
 * @param sender - Sender address (optional)
 * @param enabled - Whether to fetch (default: true)
 */
export function useFeeQuote(
  tokenAddress: Address | undefined,
  amount: string | undefined,
  recipient: Address | undefined,
  sender?: Address,
  enabled = true,
) {
  const config = useAppConfig();

  return useQuery({
    queryKey: [
      'feeQuote',
      config.chainId,
      config.backend.url,
      tokenAddress,
      amount,
      recipient,
      sender,
    ],
    queryFn: async (): Promise<FeeQuote> => {
      if (!tokenAddress || !amount || !recipient) {
        throw new Error('Token address, amount, and recipient are required');
      }

      const params = new URLSearchParams({
        token: tokenAddress,
        amount,
        recipient,
      });

      if (sender) {
        params.append('sender', sender);
      }

      const response = await fetch(
        `${config.backend.url}/fees/quote?${params.toString()}`,
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: 'Failed to fetch fee quote',
        }));
        throw new Error(error.message || 'Failed to fetch fee quote');
      }

      return response.json();
    },
    enabled: enabled && !!tokenAddress && !!amount && !!recipient,
    staleTime: 10_000, // 10 seconds
  });
}
