# Architecture Guide

This document explains the key architectural decisions and patterns used in the OMies dApp Template.

---

## Table of Contents

1. [Monorepo Layout](#monorepo-layout)
2. [Configuration System](#configuration-system)
3. [State Management](#state-management)
4. [Routing Architecture](#routing-architecture)
5. [Component Architecture](#component-architecture)
6. [Web3 Integration](#web3-integration)
7. [Styling Architecture](#styling-architecture)

---

## Monorepo Layout

### Overview

We use a **Yarn Workspaces** monorepo to separate concerns between smart contracts and the web application.

```
omies-dapp-spa-template/
├── packages/
│   ├── contracts/          # Foundry project (Solidity)
│   │   ├── src/            # Smart contracts
│   │   ├── test/           # Contract tests
│   │   ├── script/         # Deployment scripts
│   │   └── foundry.toml
│   │
│   └── webapp/             # Vite + React SPA
│       ├── src/            # Application source
│       ├── public/         # Static assets
│       ├── vite.config.ts
│       └── package.json
│
├── docs/                   # Documentation
├── package.json            # Root workspace config
└── yarn.lock               # Lockfile
```

### Benefits

- **Separation of Concerns:** Smart contracts and frontend are independently versioned and deployed.
- **Shared Dependencies:** Common dev tools (ESLint, TypeScript) can be shared at the root.
- **Independent Scaling:** Each package can have its own CI/CD pipeline.

### Workspace Commands

All commands use Yarn workspaces to target specific packages:

```bash
# Run command in webapp
yarn workspace @dapp-evm/webapp [command]

# Run command in contracts
yarn workspace @dapp-evm/contracts [command]

# Run command in all workspaces
yarn workspaces foreach [command]
```

---

## Configuration System

### The "File-per-Network" Strategy

Instead of a monolithic config file, we use a **modular architecture** where each network has its own file.

```
src/config/
├── types.ts                 # ChainConfig TypeScript interface
├── networks/                # Individual network configs
│   ├── mantra-mainnet.ts    # Production Mantra Chain
│   ├── mantra-dukong.ts     # Mantra testnet
│   └── local.ts             # Local Anvil (for development)
├── chains.ts                # Aggregator (exports the map and array)
└── wagmi.ts                 # Wagmi/AppKit configuration
```

### 1. Types Definition (`types.ts`)

The `ChainConfig` interface is the contract that every network file must satisfy:

```typescript
import { type Address, type Chain } from 'viem';

export type ChainConfig = {
  // Viem chain definition
  viemChain: Chain;
  
  // Basic chain info
  chainId: number;
  name: string;
  isTestnet: boolean;
  
  // External URLs
  urls: {
    subgraph: string;    // GraphQL subgraph endpoint
    explorer: string;    // Block explorer (e.g., Etherscan)
    rpc: string;         // RPC endpoint
  };
  
  // Smart contract addresses
  contracts: {
    omToken: Address;
    stakingPool: Address;
    migrationHelper: Address;
    // Add more as needed
  };
  
  // UI metadata
  ui: {
    color: string;       // Tailwind color class (e.g., 'brand-blue')
    icon: string;        // Path to network icon SVG
  };
};
```

### 2. Network Modules (`networks/*.ts`)

Each network exports a **Viem chain** and a **config object**.

**Example:** `networks/mantra-mainnet.ts`

```typescript
import { defineChain } from 'viem';
import { type ChainConfig } from '../types';

// 1. Define the Viem Chain
export const mantraMainnetChain = defineChain({
  id: 11,
  name: 'MANTRA Chain',
  nativeCurrency: { name: 'OM', symbol: 'OM', decimals: 18 },
  rpcUrls: { 
    default: { http: ['https://rpc.mantrachain.io'] } 
  },
  blockExplorers: { 
    default: { name: 'MantraScan', url: 'https://mantrascan.io' } 
  },
});

// 2. Define the App Config
export const mantraMainnetConfig: ChainConfig = {
  viemChain: mantraMainnetChain,
  chainId: mantraMainnetChain.id,
  name: 'MANTRA Mainnet',
  isTestnet: false,
  
  urls: {
    subgraph: 'https://api.goldsky.com/api/public/project_...',
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

### 3. Aggregator (`chains.ts`)

This file imports all network modules and exports them as a map and array.

```typescript
import { type ChainConfig } from './types';
import { mantraMainnetConfig } from './networks/mantra-mainnet';
import { mantraDukongConfig } from './networks/mantra-dukong';
import { localConfig } from './networks/local';

// Export array for Wagmi config
export const SUPPORTED_CHAINS = [
  mantraMainnetConfig.viemChain,
  mantraDukongConfig.viemChain,
  localConfig.viemChain,
] as const;

// Export map for app logic lookups
export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  [mantraMainnetConfig.chainId]: mantraMainnetConfig,
  [mantraDukongConfig.chainId]: mantraDukongConfig,
  [localConfig.chainId]: localConfig,
};

// Default chain ID based on environment
export const DEFAULT_CHAIN_ID = import.meta.env.DEV 
  ? localConfig.chainId 
  : mantraMainnetConfig.chainId;
```

### 4. Consuming the Config

**In Components:**

```typescript
import { useAppConfig } from '@/lib/hooks/useAppConfig';

function MyComponent() {
  const config = useAppConfig();
  
  // Access contract addresses
  const tokenAddress = config.contracts.omToken;
  
  // Build explorer URLs
  const explorerUrl = `${config.urls.explorer}/tx/${txHash}`;
  
  // Check environment
  if (config.isTestnet) {
    console.warn('Running on testnet');
  }
}
```

**In Wagmi Config:**

```typescript
import { createConfig, http } from 'wagmi';
import { SUPPORTED_CHAINS } from './chains';

export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  transports: SUPPORTED_CHAINS.reduce((acc, chain) => {
    acc[chain.id] = http();
    return acc;
  }, {}),
});
```

### Benefits

- **Modularity:** Each network is self-contained. Adding a new network doesn't touch existing ones.
- **Type Safety:** TypeScript ensures every network has all required fields.
- **Testability:** Each network config can be unit tested independently.
- **Clarity:** Easy to see what networks are supported at a glance.

---

## State Management

We use a **hybrid approach** combining React Query (TanStack Query) for server state and React Context for client state.

### TanStack Query (Server State)

**Use for:**
- Blockchain reads (balances, allowances, staking info)
- Subgraph queries
- Any data fetched from external sources

**Example:**

```typescript
import { useQuery } from '@tanstack/react-query';
import { useReadContract } from 'wagmi';

function useTokenBalance(address: Address) {
  const config = useAppConfig();
  
  return useReadContract({
    address: config.contracts.omToken,
    abi: omTokenAbi,
    functionName: 'balanceOf',
    args: [address],
    query: {
      // Refetch every 30 seconds
      refetchInterval: 30_000,
      // Cache for 1 minute
      staleTime: 60_000,
    },
  });
}
```

### React Context (Client State)

**Use for:**
- UI state (modals open/closed, active tabs)
- User preferences (theme, language)
- Transaction flow state

**Example:**

```typescript
import { createContext, useContext, useState } from 'react';

type TransactionState = {
  isOpen: boolean;
  status: 'idle' | 'review' | 'signing' | 'processing' | 'success' | 'error';
};

const TransactionContext = createContext<TransactionState | null>(null);

export function useTransaction() {
  const context = useContext(TransactionContext);
  if (!context) throw new Error('useTransaction must be used within Provider');
  return context;
}
```

### Wagmi (Web3 State)

Wagmi provides hooks for Web3-specific state:

- `useAccount()` - Wallet connection status
- `useBalance()` - Native token balance
- `useChainId()` - Current chain
- `useReadContract()` - Contract reads
- `useWriteContract()` - Contract writes

### When to Use What

| State Type             | Solution         | Example                              |
| ---------------------- | ---------------- | ------------------------------------ |
| Wallet connection      | Wagmi            | `useAccount()`                       |
| Contract data          | Wagmi + TanStack | `useReadContract()` with query opts  |
| Subgraph data          | TanStack Query   | `useQuery()` with custom fetcher     |
| UI state (local)       | useState         | Modal open/closed                    |
| UI state (global)      | React Context    | Theme, language                      |
| Form state             | React Hook Form  | Form inputs, validation              |

---

## Routing Architecture

We use **TanStack Router** for type-safe, file-based routing.

### File-Based Routes

Routes are defined in `src/routes/` with the file structure matching the URL structure.

```
src/routes/
├── __root.tsx           # Root layout (Navbar + Background)
├── index.tsx            # Homepage (/)
├── stake.tsx            # Staking page (/stake)
├── migrate.tsx          # Migration page (/migrate)
└── devtools.tsx         # Dev tools (/devtools)
```

### Root Layout (`__root.tsx`)

The root layout wraps all pages and provides the CartoonBackground and Navbar.

```typescript
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Navbar } from '@/components/common/Navbar';
import { CartoonBackground } from '@/components/scene/CartoonBackground';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <CartoonBackground />
      <Navbar />
      <main className="relative z-10 min-h-screen pt-24">
        <Outlet />
      </main>
    </>
  );
}
```

### Route Definition

Each route file exports a `Route` object:

```typescript
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/stake')({
  component: StakePage,
});

function StakePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1>Stake OM</h1>
    </div>
  );
}
```

### Route Loaders (SSR/Data Fetching)

Use route loaders for data required before rendering:

```typescript
export const Route = createFileRoute('/stake')({
  loader: async () => {
    const stakingData = await fetchStakingData();
    return { stakingData };
  },
  component: StakePage,
});

function StakePage() {
  const { stakingData } = Route.useLoaderData();
  return <div>APY: {stakingData.apy}%</div>;
}
```

### Error and Pending Boundaries

Every route should have error and pending states:

```typescript
export const Route = createFileRoute('/stake')({
  loader: async () => { /* ... */ },
  component: StakePage,
  errorComponent: ({ error }) => (
    <div className="text-red-600 p-4">Error: {error.message}</div>
  ),
  pendingComponent: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="animate-spin size-12" />
    </div>
  ),
});
```

---

## Component Architecture

### Component Hierarchy

```
src/components/
├── ui/                    # ShadCN primitives (Button, Card, Dialog, etc.)
├── common/                # Shared custom components
│   ├── Navbar.tsx
│   ├── WalletConnectPill.tsx
│   ├── TransactionDialog.tsx
│   ├── NetworkBanner.tsx
│   ├── AddressDisplay.tsx
│   ├── BalanceDisplay.tsx
│   └── CopyButton.tsx
├── scene/                 # Visual components
│   └── CartoonBackground.tsx
└── features/              # Feature-specific components
    ├── staking/
    ├── migration/
    └── faucet/
```

### Component Composition

We follow the **Compound Component Pattern** for complex components.

**Example: Card**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Custom Hooks

Reusable logic is extracted into custom hooks:

```typescript
// useAppConfig - Get current chain config
export function useAppConfig(): ChainConfig;

// useTransactionFlow - Manage transaction state machine
export function useTransactionFlow(): {
  status: TransactionStatus;
  execute: (tx: Transaction) => Promise<void>;
  reset: () => void;
};

// useContractRead - Typed contract reads
export function useContractRead<T>(
  contract: 'omToken' | 'stakingPool',
  functionName: string,
  args?: any[]
): { data: T; isLoading: boolean; error: Error | null };
```

---

## Web3 Integration

### Wagmi + Viem Stack

- **Wagmi:** React hooks for Ethereum
- **Viem:** TypeScript library for Ethereum (replaces ethers.js)
- **AppKit (Reown):** Wallet connection UI (formerly WalletConnect)

### Configuration

**1. Wagmi Config (`src/config/wagmi.ts`)**

```typescript
import { createConfig, http } from 'wagmi';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { SUPPORTED_CHAINS } from './chains';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

const wagmiAdapter = new WagmiAdapter({
  networks: SUPPORTED_CHAINS,
  projectId,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: SUPPORTED_CHAINS,
  projectId,
  metadata: {
    name: 'OMies dApp',
    description: 'Stake and migrate OM tokens',
    url: 'https://omies.io',
    icons: ['https://omies.io/icon.png'],
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
```

**2. Provider Setup (`src/main.tsx`)**

```typescript
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from './config/wagmi';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </WagmiProvider>
);
```

### Contract Interactions

**Reading:**

```typescript
import { useReadContract } from 'wagmi';
import { useAppConfig } from '@/lib/hooks/useAppConfig';

const config = useAppConfig();

const { data: balance } = useReadContract({
  address: config.contracts.omToken,
  abi: omTokenAbi,
  functionName: 'balanceOf',
  args: [userAddress],
});
```

**Writing:**

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

const { writeContract, data: hash } = useWriteContract();

const { isLoading, isSuccess } = useWaitForTransactionReceipt({
  hash,
});

const handleStake = () => {
  writeContract({
    address: config.contracts.stakingPool,
    abi: stakingAbi,
    functionName: 'stake',
    args: [parseUnits(amount, 18)],
  });
};
```

---

## Styling Architecture

### Tailwind CSS v4

We use **Tailwind CSS v4** with a custom preset for the OMies brand.

### Configuration Files

**1. Preset (`omies-preset.js`)**

Contains shared design tokens:

```javascript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          teal: '#7CAEBC',
          sky: '#4FA3DC',
          blue: '#3B506C',
          yellow: '#F5B842',
          pink: '#F23F98',
          green: '#48BB78',
          'green-light': '#68D391',
        },
      },
      animation: {
        'sun-spin': 'sun-spin 60s linear infinite',
        'cloud-pulse': 'cloud-pulse 8s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

**2. Global Styles (`src/index.css`)**

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;900&display=swap');

@import 'tailwindcss';
@plugin "tailwindcss-animate";
@config "../omies-preset.js";

@layer base {
  :root {
    --background: 193 30% 61%;        /* Teal */
    --foreground: 0 0% 100%;          /* White */
    --card: 0 0% 100%;                /* White */
    --card-foreground: 216 30% 33%;   /* Dark Blue */
    --primary: 216 30% 33%;           /* Dark Blue */
    --primary-foreground: 0 0% 100%;
    --secondary: 42 87% 61%;          /* Gold */
    --secondary-foreground: 216 30% 33%;
    --radius: 1rem;
  }
}
```

### ShadCN/UI Integration

ShadCN components are copied into `src/components/ui/` and customized to match the OMies design system.

**Adding New Components:**

```bash
npx shadcn@latest add button card dialog
```

Components are automatically styled with Tailwind and our CSS variables.

---

## Summary

| Aspect               | Solution                        | Key Benefit                          |
| -------------------- | ------------------------------- | ------------------------------------ |
| **Monorepo**         | Yarn Workspaces                 | Separation of contracts and frontend |
| **Configuration**    | File-per-Network pattern        | Easy to add/modify networks          |
| **State Management** | TanStack Query + Wagmi          | Clean server/client state separation|
| **Routing**          | TanStack Router                 | Type-safe, file-based routes         |
| **Components**       | ShadCN + Custom                 | Accessible, branded, reusable        |
| **Web3**             | Wagmi + Viem + AppKit           | Modern, type-safe Web3 interactions  |
| **Styling**          | Tailwind v4 + Custom Preset     | Consistent design tokens             |

This architecture is designed to be **scalable**, **maintainable**, and **developer-friendly**.

---

**Next:** See [WORKFLOWS.md](./WORKFLOWS.md) for step-by-step guides on common development tasks.
