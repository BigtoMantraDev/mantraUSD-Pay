import { mantraDuKongEVMTestnet } from '@reown/appkit/networks';

import { type ChainConfig } from '../types';

/**
 * MANTRA Dukong Testnet Configuration
 * Testnet for development and staging
 */
export const mantraDukongConfig: ChainConfig = {
  viemChain: mantraDuKongEVMTestnet as unknown as ChainConfig['viemChain'],
  chainId: mantraDuKongEVMTestnet.id,
  name: 'MANTRA Dukong',
  isTestnet: true,
  urls: {
    subgraph:
      'https://api.goldsky.com/api/public/project_mantra/subgraphs/omies/testnet/gn',
    explorer: 'https://explorer.dukong.io',
    rpc: 'https://evm.dukong.mantrachain.io',
  },
  contracts: {
    // Placeholder addresses - replace with actual testnet contracts
    omToken: '0x0000000000000000000000000000000000000000',
    stakingPool: '0x0000000000000000000000000000000000000000',
    migrationHelper: '0x0000000000000000000000000000000000000000',
    delegatedAccount: '0x4e7F587DbDb8424e20E9F7F84d3173fA32F22B4F',
    mantraUSD: '0x4B545d0758eda6601B051259bD977125fbdA7ba2',
  },
  backend: {
    url: 'http://localhost:3000/api',
  },
  ui: {
    color: 'yellow-500',
    icon: '/images/networks/mantra-testnet.svg',
  },
};
