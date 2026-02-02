import type { Address } from 'viem';
import { erc20Abi } from 'viem';
import { useReadContract, useBalance } from 'wagmi';

export interface UseTokenBalanceOptions {
  /** Token contract address. If undefined, returns native token balance */
  tokenAddress?: Address;
  /** Owner address to check balance for */
  owner: Address | undefined;
  /** Whether to watch for balance changes */
  watch?: boolean;
}

export interface UseTokenBalanceReturn {
  /** Raw balance as bigint */
  balance: bigint | undefined;
  /** Token decimals */
  decimals: number;
  /** Token symbol */
  symbol: string | undefined;
  /** Whether the balance is loading */
  isLoading: boolean;
  /** Whether there was an error */
  isError: boolean;
  /** Error object if any */
  error: Error | null;
  /** Refetch the balance */
  refetch: () => void;
}

/**
 * Hook to fetch ERC20 token balance or native token balance.
 * Returns balance, decimals, symbol, and loading states.
 *
 * @example
 * ```tsx
 * // Native token balance
 * const { balance, symbol } = useTokenBalance({ owner: address });
 *
 * // ERC20 token balance
 * const { balance, decimals } = useTokenBalance({
 *   tokenAddress: '0x...',
 *   owner: address,
 * });
 * ```
 */
export function useTokenBalance({
  tokenAddress,
  owner,
  watch = false,
}: UseTokenBalanceOptions): UseTokenBalanceReturn {
  // Native token balance
  const {
    data: nativeBalance,
    isLoading: isNativeLoading,
    isError: isNativeError,
    error: nativeError,
    refetch: refetchNative,
  } = useBalance({
    address: owner,
    query: {
      enabled: !tokenAddress && !!owner,
      refetchInterval: watch ? 10000 : false,
    },
  });

  // ERC20 balance
  const {
    data: tokenBalance,
    isLoading: isTokenLoading,
    isError: isTokenError,
    error: tokenError,
    refetch: refetchToken,
  } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: owner ? [owner] : undefined,
    query: {
      enabled: !!tokenAddress && !!owner,
      refetchInterval: watch ? 10000 : false,
    },
  });

  // ERC20 decimals
  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: !!tokenAddress,
      staleTime: Infinity, // Decimals don't change
    },
  });

  // ERC20 symbol
  const { data: tokenSymbol } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'symbol',
    query: {
      enabled: !!tokenAddress,
      staleTime: Infinity, // Symbol doesn't change
    },
  });

  // Return native token data
  if (!tokenAddress) {
    return {
      balance: nativeBalance?.value,
      decimals: nativeBalance?.decimals ?? 18,
      symbol: nativeBalance?.symbol,
      isLoading: isNativeLoading,
      isError: isNativeError,
      error: nativeError,
      refetch: refetchNative,
    };
  }

  // Return ERC20 token data
  return {
    balance: tokenBalance as bigint | undefined,
    decimals: decimals ?? 18,
    symbol: tokenSymbol as string | undefined,
    isLoading: isTokenLoading,
    isError: isTokenError,
    error: tokenError,
    refetch: refetchToken,
  };
}
