import { useChainId } from 'wagmi';

import {
  CHAIN_CONFIGS,
  DEFAULT_CHAIN_ID,
  type ChainConfig,
} from '@/config/chains';

/**
 * Hook to get the current chain's configuration.
 * Falls back to the default chain if the wallet is on an unsupported network.
 *
 * @returns ChainConfig with helper methods for explorer URLs
 */
export function useAppConfig() {
  const chainId = useChainId();

  // Get config for current chain, fallback to default if unsupported
  const config: ChainConfig =
    CHAIN_CONFIGS[chainId] ?? CHAIN_CONFIGS[DEFAULT_CHAIN_ID];

  // Check if current chain is supported
  const isSupported = chainId in CHAIN_CONFIGS;

  return {
    ...config,
    isSupported,

    /**
     * Get the explorer URL for a transaction hash
     */
    getExplorerTxUrl: (hash: string): string => {
      return `${config.urls.explorer}/tx/${hash}`;
    },

    /**
     * Get the explorer URL for an address
     */
    getExplorerAddressUrl: (address: string): string => {
      return `${config.urls.explorer}/address/${address}`;
    },

    /**
     * Get the explorer URL for a block
     */
    getExplorerBlockUrl: (blockNumber: number | string): string => {
      return `${config.urls.explorer}/block/${blockNumber}`;
    },
  };
}

export type AppConfig = ReturnType<typeof useAppConfig>;
