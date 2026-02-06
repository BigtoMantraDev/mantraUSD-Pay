import { useQuery } from '@tanstack/react-query';
import { type Address } from 'viem';

import { useAppConfig } from './useAppConfig';

/**
 * Hook to fetch nonce for EIP-712 signing from the backend
 *
 * With EIP-7702, nonces are stored in the user's EOA storage, not the
 * DelegatedAccount implementation contract. The backend correctly queries
 * from the user's EOA (if it has EIP-7702 code) or returns 0 for first-time users.
 *
 * @param owner - Address of the token owner
 */
export function useNonce(owner: Address | undefined) {
  const config = useAppConfig();

  return useQuery({
    queryKey: ['nonce', config.chainId, owner],
    queryFn: async (): Promise<bigint> => {
      if (!owner) throw new Error('No owner address');

      const response = await fetch(
        `${config.backend.url}/nonce/${owner}?chainId=${config.chainId}`,
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: 'Failed to fetch nonce',
        }));
        throw new Error(error.message || 'Failed to fetch nonce');
      }

      const data = await response.json();
      const nonce = BigInt(data.nonce);

      console.log('[useNonce] Fetched nonce:', nonce.toString(), 'for owner:', owner);
      return nonce;
    },
    enabled: !!owner,
    staleTime: 10_000, // Cache for 10 seconds
  });
}
