import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { createAppKit } from '@reown/appkit/react';

import {
  SUPPORTED_CHAINS,
  DEFAULT_CHAIN_CONFIG,
  mantraDukongConfig,
  localConfig,
} from './chains';

// Project ID from Reown Cloud - Public ID for WalletConnect integration
const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
  'fed96f5564f3736045743df0951c06f9';

// Filter chains based on environment
const networks = import.meta.env.DEV
  ? SUPPORTED_CHAINS
  : SUPPORTED_CHAINS.filter((chain) => chain.id !== localConfig.chainId);

// Create Wagmi adapter
const wagmiAdapter = new WagmiAdapter({
  networks: networks as unknown as Parameters<
    typeof WagmiAdapter
  >[0]['networks'],
  projectId,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

// Create AppKit instance
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  networks: networks as any, // Type compatibility issue between viem chains and AppKit networks
  defaultNetwork: DEFAULT_CHAIN_CONFIG.viemChain as Parameters<
    typeof createAppKit
  >[0]['defaultNetwork'],
  metadata: {
    name: 'OMies dApp',
    description: 'OMies ecosystem dApp template',
    url: 'https://onchainomies.com',
    icons: ['https://avatars.githubusercontent.com/u/179229932'],
  },
  features: {
    analytics: false,
    email: false,
    socials: [],
    emailShowWallets: false,
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-z-index': 1000,
  },
});

// Re-export for backward compatibility
export const mantraDuKongEVMTestnet = mantraDukongConfig.viemChain;
export const mantraLocal = localConfig.viemChain;
