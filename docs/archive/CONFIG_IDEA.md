Using a **Modular Strategy** (File-per-Network) is the enterprise standard for this. It keeps your configuration clean, testable, and easy to extend.

Here is the refined architecture to instruct the Agent with.

### The Refined Structure

Instead of one big file, we create a `networks/` directory.

```text
src/config/
├── types.ts                # The shared interface (ChainConfig)
├── networks/               # Individual configuration modules
│   ├── mantra-mainnet.ts
│   ├── mantra-dukong.ts
│   └── local.ts
└── chains.ts               # The Aggregator (Exports the Map)

```

---

### 1. The Shared Interface (`src/config/types.ts`)

This remains the "Contract" that every network file must satisfy.

```typescript
import { type Address, type Chain } from 'viem';

export type ChainConfig = {
  // We include the Viem Chain definition here for easy access
  viemChain: Chain;
  chainId: number;
  name: string;
  isTestnet: boolean;
  urls: {
    subgraph: string;
    explorer: string;
    rpc: string;
  };
  contracts: {
    omToken: Address;
    stakingPool: Address;
    migrationHelper: Address;
  };
  ui: {
    color: string;
    icon: string;
  };
};

```

### 2. The Modular Config Files (`src/config/networks/*.ts`)

Now, each file is self-contained. This makes it incredibly easy for a developer to "Add Base Chain" without touching the MANTRA config.

**File:** `src/config/networks/mantra-mainnet.ts`

```typescript
import { defineChain } from 'viem';
import { type ChainConfig } from '../types';

// 1. Define the Viem Chain (or import from viem/chains if available)
export const mantraMainnetChain = defineChain({
  id: 11,
  name: 'MANTRA Chain',
  nativeCurrency: { name: 'OM', symbol: 'OM', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.mantrachain.io'] } },
  blockExplorers: { default: { name: 'MantraScan', url: 'https://mantrascan.io' } },
});

// 2. Define the App Config
export const mantraMainnetConfig: ChainConfig = {
  viemChain: mantraMainnetChain,
  chainId: mantraMainnetChain.id,
  name: 'MANTRA Mainnet',
  isTestnet: false,
  urls: {
    subgraph: 'https://api.goldsky.com/api/public/project_cl...',
    explorer: 'https://mantrascan.io',
    rpc: 'https://rpc.mantrachain.io',
  },
  contracts: {
    omToken: '0x3995...', 
    stakingPool: '0x1234...',
    migrationHelper: '0xabcd...',
  },
  ui: { 
    color: 'brand-blue', 
    icon: '/images/networks/mantra.svg' 
  }
};

```

**File:** `src/config/networks/local.ts`

```typescript
import { defineChain } from 'viem';
import { type ChainConfig } from '../types';

export const localChain = defineChain({
  id: 31337,
  name: 'Local Anvil',
  nativeCurrency: { name: 'OM', symbol: 'OM', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
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
    // These match your standard 'forge script' output
    omToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    stakingPool: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    migrationHelper: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  },
  ui: { 
    color: 'gray-500', 
    icon: '/images/networks/local.svg' 
  }
};

```

### 3. The Aggregator (`src/config/chains.ts`)

This file now becomes very simple. It just imports the modules and combines them. This is the only file your `useAppConfig` hook needs to know about.

```typescript
import { type ChainConfig } from './types';
import { mantraMainnetConfig } from './networks/mantra-mainnet';
import { mantraDukongConfig } from './networks/mantra-dukong';
import { localConfig } from './networks/local';

// 1. Export the List (for Wagmi config)
export const SUPPORTED_CHAINS = [
  mantraMainnetConfig.viemChain,
  mantraDukongConfig.viemChain,
  localConfig.viemChain,
] as const;

// 2. Export the Map (for App Logic lookups)
export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  [mantraMainnetConfig.chainId]: mantraMainnetConfig,
  [mantraDukongConfig.chainId]: mantraDukongConfig,
  [localConfig.chainId]: localConfig,
};

// 3. Define Default
export const DEFAULT_CHAIN_ID = import.meta.env.DEV 
  ? localConfig.chainId 
  : mantraMainnetConfig.chainId;

```

### Updates to `docs/COMPONENT_SPECS.md`

You should update the spec to reflect this cleaner structure so the Agent builds it correctly.

**Update Section 7:**

```markdown
## 7. Configuration Architecture
* **Directory:** `src/config/`
* **Structure:** Modular "File-per-Network" pattern.
    * `types.ts`: Defines `ChainConfig` interface.
    * `networks/*.ts`: Individual exports (e.g., `mantra-mainnet.ts`, `local.ts`).
    * `chains.ts`: Aggregator exporting `CHAIN_CONFIGS` map and `SUPPORTED_CHAINS` array.
* **Requirement:** `local.ts` must contain the deterministic Anvil addresses for local development.

```