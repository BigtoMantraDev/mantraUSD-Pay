import { type Address, type Chain } from 'viem';

/**
 * Configuration for a supported blockchain network.
 * Each network module must export a config satisfying this interface.
 */
export type ChainConfig = {
  /** The Viem Chain definition for use with Wagmi */
  viemChain: Chain;
  /** The numeric chain ID */
  chainId: number;
  /** Human-readable network name */
  name: string;
  /** Whether this is a testnet/devnet */
  isTestnet: boolean;
  /** Network URLs */
  urls: {
    /** GraphQL subgraph endpoint */
    subgraph: string;
    /** Block explorer base URL */
    explorer: string;
    /** RPC endpoint */
    rpc: string;
  };
  /** Contract addresses for this network */
  contracts: {
    omToken: Address;
    stakingPool: Address;
    migrationHelper: Address;
    delegatedAccount: Address;
    mantraUSD: Address;
  };
  /** Backend API configuration */
  backend: {
    /** Backend relayer URL */
    url: string;
  };
  /** UI display properties */
  ui: {
    /** Tailwind color class (e.g., 'brand-blue') */
    color: string;
    /** Path to network icon */
    icon: string;
  };
};
