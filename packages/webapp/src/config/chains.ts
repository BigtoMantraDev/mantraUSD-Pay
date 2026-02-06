import { localConfig } from './networks/local';
import { mantraDukongConfig } from './networks/mantra-dukong';
import { mantraMainnetConfig } from './networks/mantra-mainnet';
import { type ChainConfig } from './types';

/**
 * Apply environment variable overrides to chain configs
 * Allows runtime configuration without rebuilding
 */
function applyEnvOverrides(config: ChainConfig): ChainConfig {
  const backendUrlOverride = import.meta.env.VITE_BACKEND_URL;
  if (backendUrlOverride) {
    return {
      ...config,
      backend: {
        ...config.backend,
        url: backendUrlOverride,
      },
    };
  }
  return config;
}

/**
 * Array of supported chains for Wagmi/AppKit configuration
 */
export const SUPPORTED_CHAINS = [
  mantraMainnetConfig.viemChain,
  mantraDukongConfig.viemChain,
  localConfig.viemChain,
] as const;

/**
 * Map of chain ID to full configuration
 * Use this for app logic lookups (contracts, explorer URLs, etc.)
 * Environment variables (VITE_BACKEND_URL) can override defaults
 */
export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  [mantraMainnetConfig.chainId]: applyEnvOverrides(mantraMainnetConfig),
  [mantraDukongConfig.chainId]: applyEnvOverrides(mantraDukongConfig),
  [localConfig.chainId]: applyEnvOverrides(localConfig),
};

/**
 * Default chain ID based on environment
 * - Development: Local Anvil
 * - Production: MANTRA Dukong (testnet for now, switch to mainnet when ready)
 */
export const DEFAULT_CHAIN_ID = import.meta.env.DEV
  ? localConfig.chainId
  : mantraDukongConfig.chainId;

/**
 * Get the default chain config
 */
export const DEFAULT_CHAIN_CONFIG = CHAIN_CONFIGS[DEFAULT_CHAIN_ID];

// Re-export individual configs for convenience
export { mantraMainnetConfig, mantraDukongConfig, localConfig };
export type { ChainConfig } from './types';
