import type { Address } from 'viem';
import { erc20Abi, maxUint256 } from 'viem';
import { useReadContract } from 'wagmi';

export interface UseTokenAllowanceOptions {
  /** Token contract address */
  tokenAddress: Address | undefined;
  /** Owner address (who approved) */
  owner: Address | undefined;
  /** Spender address (who can spend) */
  spender: Address | undefined;
  /** Watch for allowance changes */
  watch?: boolean;
}

export interface UseTokenAllowanceReturn {
  /** Current allowance as bigint */
  allowance: bigint | undefined;
  /** Whether the allowance is loading */
  isLoading: boolean;
  /** Whether there was an error */
  isError: boolean;
  /** Error object if any */
  error: Error | null;
  /** Refetch the allowance */
  refetch: () => void;
  /** Check if the allowance is sufficient for an amount */
  hasSufficientAllowance: (amount: bigint) => boolean;
  /** Check if unlimited approval is granted */
  isUnlimited: boolean;
}

/**
 * Hook to check ERC20 token allowance for a spender.
 * Useful for checking if approval is needed before a transaction.
 *
 * @example
 * ```tsx
 * const { allowance, hasSufficientAllowance, refetch } = useTokenAllowance({
 *   tokenAddress: '0x...',
 *   owner: userAddress,
 *   spender: contractAddress,
 * });
 *
 * if (!hasSufficientAllowance(amount)) {
 *   // Need to approve first
 * }
 * ```
 */
export function useTokenAllowance({
  tokenAddress,
  owner,
  spender,
  watch = false,
}: UseTokenAllowanceOptions): UseTokenAllowanceReturn {
  const {
    data: allowance,
    isLoading,
    isError,
    error,
    refetch,
  } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!tokenAddress && !!owner && !!spender,
      refetchInterval: watch ? 10000 : false,
    },
  });

  const hasSufficientAllowance = (amount: bigint): boolean => {
    if (allowance === undefined) return false;
    return allowance >= amount;
  };

  // Check if unlimited (max uint256 or very large number)
  const isUnlimited = allowance !== undefined && allowance >= maxUint256 / 2n;

  return {
    allowance: allowance as bigint | undefined,
    isLoading,
    isError,
    error,
    refetch,
    hasSufficientAllowance,
    isUnlimited,
  };
}
