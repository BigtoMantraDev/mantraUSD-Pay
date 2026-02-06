import { defineChain } from 'viem';

import { type ChainConfig } from '../types';

/**
 * MANTRA Mainnet Configuration
 * Production network for the MANTRA blockchain
 */
export const mantraMainnetChain = defineChain({
  id: 5888,
  name: 'MANTRA',
  nativeCurrency: { name: 'OM', symbol: 'OM', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evm.mantrachain.io'] },
  },
  blockExplorers: {
    default: {
      name: 'MANTRA Explorer',
      url: 'https://blockscout.mantrascan.io',
    },
  },
});

export const mantraMainnetConfig: ChainConfig = {
  viemChain: mantraMainnetChain,
  chainId: mantraMainnetChain.id,
  name: 'MANTRA Mainnet',
  isTestnet: false,
  urls: {
    subgraph:
      'https://api.goldsky.com/api/public/project_mantra/subgraphs/omies/prod/gn',
    explorer: 'https://blockscout.mantrascan.io',
    rpc: 'https://evm.mantrachain.io',
  },
  contracts: {
    // Placeholder addresses - replace with actual deployed contracts
    omToken: '0x0000000000000000000000000000000000000000',
    stakingPool: '0x0000000000000000000000000000000000000000',
    migrationHelper: '0x0000000000000000000000000000000000000000',
    delegatedAccount: '0x0000000000000000000000000000000000000000',
    mantraUSD: '0xd2b95283011E47257917770D28Bb3EE44c849f6F',
  },
  backend: {
    url: 'https://relayer.mantrachain.io',
  },
  ui: {
    color: 'brand-blue',
    icon: '/images/networks/mantra.svg',
  },
};
