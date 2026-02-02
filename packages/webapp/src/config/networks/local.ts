import { defineChain } from 'viem';

import { type ChainConfig } from '../types';

/**
 * Local Anvil Development Configuration
 * Uses deterministic addresses from `forge script` deployment
 */
export const localChain = defineChain({
  id: 1337,
  name: 'MANTRA Local',
  nativeCurrency: { name: 'OM', symbol: 'OM', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
  blockExplorers: {
    default: { name: 'Local Explorer', url: 'http://localhost:8080' },
  },
  testnet: true,
});

export const localConfig: ChainConfig = {
  viemChain: localChain,
  chainId: localChain.id,
  name: 'Localhost',
  isTestnet: true,
  urls: {
    subgraph: 'http://localhost:8000/subgraphs/name/omies',
    explorer: 'http://localhost:4000',
    rpc: 'http://127.0.0.1:8545',
  },
  contracts: {
    // Deterministic Anvil addresses from standard `forge script` output
    omToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    stakingPool: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    migrationHelper: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  },
  ui: {
    color: 'zinc-500',
    icon: '/images/networks/local.svg',
  },
};
