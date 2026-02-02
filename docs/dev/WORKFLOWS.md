# Common Workflows

This document provides step-by-step guides for common development tasks in the OMies dApp Template.

---

## Table of Contents

1. [How to Add a New Network](#how-to-add-a-new-network)
2. [How to Add a New Feature](#how-to-add-a-new-feature)
3. [How to Add a New Contract](#how-to-add-a-new-contract)
4. [How to Add a New Component to Kitchen Sink](#how-to-add-a-new-component-to-kitchen-sink)
5. [How to Update Design Tokens](#how-to-update-design-tokens)
6. [How to Deploy](#how-to-deploy)

---

## How to Add a New Network

**Goal:** Support a new blockchain (e.g., Base, Polygon, etc.)

### Step 1: Create Network Config File

Create a new file in `packages/webapp/src/config/networks/`:

```bash
touch packages/webapp/src/config/networks/base-mainnet.ts
```

### Step 2: Define the Network

```typescript
// packages/webapp/src/config/networks/base-mainnet.ts

import { defineChain } from 'viem';
import { type ChainConfig } from '../types';

// 1. Define the Viem Chain
// (Or import from 'viem/chains' if available)
export const baseMainnetChain = defineChain({
  id: 8453,
  name: 'Base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { 
    default: { http: ['https://mainnet.base.org'] } 
  },
  blockExplorers: { 
    default: { name: 'BaseScan', url: 'https://basescan.org' } 
  },
});

// 2. Define the App Config
export const baseMainnetConfig: ChainConfig = {
  viemChain: baseMainnetChain,
  chainId: baseMainnetChain.id,
  name: 'Base Mainnet',
  isTestnet: false,
  
  urls: {
    subgraph: 'https://api.thegraph.com/subgraphs/name/your-subgraph',
    explorer: 'https://basescan.org',
    rpc: 'https://mainnet.base.org',
  },
  
  contracts: {
    omToken: '0x...', // Deploy your contracts first!
    stakingPool: '0x...',
    migrationHelper: '0x...',
  },
  
  ui: { 
    color: 'brand-blue', 
    icon: '/images/networks/base.svg' 
  }
};
```

### Step 3: Add Network Icon

1. Find or create an SVG icon for the network.
2. Place it in `packages/webapp/public/images/networks/base.svg`.
3. Ensure it's square and looks good at 24x24px.

### Step 4: Export in Aggregator

Update `packages/webapp/src/config/chains.ts`:

```typescript
import { baseMainnetConfig } from './networks/base-mainnet';

export const SUPPORTED_CHAINS = [
  mantraMainnetConfig.viemChain,
  mantraDukongConfig.viemChain,
  localConfig.viemChain,
  baseMainnetConfig.viemChain,  // Add here
] as const;

export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  [mantraMainnetConfig.chainId]: mantraMainnetConfig,
  [mantraDukongConfig.chainId]: mantraDukongConfig,
  [localConfig.chainId]: localConfig,
  [baseMainnetConfig.chainId]: baseMainnetConfig,  // Add here
};
```

### Step 5: Update Environment Variables (Optional)

If you need chain-specific env vars:

```env
# .env
VITE_BASE_RPC_URL=https://mainnet.base.org
VITE_BASE_SUBGRAPH_URL=https://...
```

### Step 6: Test

1. Start the dev server: `yarn workspace @dapp-evm/webapp dev`
2. Connect your wallet
3. Switch to the new network via the NetworkSelector
4. Verify the config is correct in `/devtools`

### Checklist

- [ ] Created `networks/[network-name].ts`
- [ ] Added network icon to `public/images/networks/`
- [ ] Exported in `chains.ts` (both array and map)
- [ ] Updated environment variables (if needed)
- [ ] Tested network switching
- [ ] Verified contract addresses are correct

---

## How to Add a New Feature

**Goal:** Add a new feature like "Faucet" or "Governance"

### Step 1: Create Route File

```bash
touch packages/webapp/src/routes/faucet.tsx
```

### Step 2: Define the Route

```typescript
// packages/webapp/src/routes/faucet.tsx

import { createFileRoute } from '@tanstack/react-router';
import { FaucetFeature } from '@/components/features/faucet/FaucetFeature';

export const Route = createFileRoute('/faucet')({
  component: FaucetPage,
});

function FaucetPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 
            className="text-5xl md:text-7xl font-black tracking-tight text-white uppercase"
            style={{ textShadow: '3px 3px 0 #000' }}
          >
            Faucet
          </h1>
          <p className="text-lg text-white">
            Get testnet OM tokens for development
          </p>
        </div>
        
        {/* Feature Component */}
        <FaucetFeature />
      </div>
    </div>
  );
}
```

### Step 3: Create Feature Directory

```bash
mkdir -p packages/webapp/src/components/features/faucet
touch packages/webapp/src/components/features/faucet/FaucetFeature.tsx
```

### Step 4: Build the Feature Component

```typescript
// packages/webapp/src/components/features/faucet/FaucetFeature.tsx

import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TransactionDialog } from '@/components/common/TransactionDialog';
import { useAppConfig } from '@/lib/hooks/useAppConfig';
import { WalletConnectPill } from '@/components/common/WalletConnectPill';

export function FaucetFeature() {
  const { isConnected, address } = useAccount();
  const config = useAppConfig();
  const { writeContract } = useWriteContract();
  const [dialogStatus, setDialogStatus] = useState<'idle' | 'review' | 'signing' | 'processing' | 'success' | 'error'>('idle');
  
  // Guard: Wallet not connected
  if (!isConnected) {
    return (
      <Card className="p-8 text-center">
        <p className="mb-4 text-muted-foreground">
          Please connect your wallet to use the faucet
        </p>
        <WalletConnectPill />
      </Card>
    );
  }
  
  // Guard: Not on testnet
  if (!config.isTestnet) {
    return (
      <Card className="p-8 text-center">
        <p className="text-destructive">
          Faucet is only available on testnets
        </p>
      </Card>
    );
  }
  
  const handleClaim = async () => {
    setDialogStatus('signing');
    try {
      await writeContract({
        address: config.contracts.faucet,
        abi: faucetAbi,
        functionName: 'claim',
      });
      setDialogStatus('processing');
      // Wait for confirmation logic here
      setDialogStatus('success');
    } catch (error) {
      setDialogStatus('error');
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Claim Testnet Tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You can claim 100 OM tokens once per day for testing purposes.
          </p>
          <Button onClick={() => setDialogStatus('review')}>
            Claim 100 OM
          </Button>
        </CardContent>
      </Card>
      
      <TransactionDialog
        open={dialogStatus !== 'idle'}
        status={dialogStatus}
        title="Claim Testnet Tokens"
        data={[
          { label: 'Amount', value: '100 OM' },
          { label: 'Recipient', value: address || '' },
        ]}
        onConfirm={handleClaim}
        onClose={() => setDialogStatus('idle')}
      />
    </>
  );
}
```

### Step 5: Add Navigation Link

Update `packages/webapp/src/components/common/Navbar.tsx`:

```tsx
<Link to="/faucet" className="text-white hover:text-white/80">
  Faucet
</Link>
```

### Step 6: Test

1. Start dev server
2. Navigate to `/faucet`
3. Test wallet connection guard
4. Test testnet guard
5. Test claim flow

### Checklist

- [ ] Created route file in `src/routes/`
- [ ] Created feature component in `src/components/features/`
- [ ] Added wallet connection guard
- [ ] Added network guard (if applicable)
- [ ] Integrated TransactionDialog
- [ ] Added navigation link in Navbar
- [ ] Tested all user flows
- [ ] Added to Kitchen Sink (if reusable components created)

---

## How to Add a New Contract

**Goal:** Add a new smart contract to the config system

### Step 1: Add to Types

Update `packages/webapp/src/config/types.ts`:

```typescript
export type ChainConfig = {
  // ... existing fields
  contracts: {
    omToken: Address;
    stakingPool: Address;
    migrationHelper: Address;
    governance: Address;  // New contract
  };
};
```

### Step 2: Update All Network Configs

For each network file in `src/config/networks/`, add the new contract:

```typescript
// networks/mantra-mainnet.ts
export const mantraMainnetConfig: ChainConfig = {
  // ... existing config
  contracts: {
    omToken: '0x...',
    stakingPool: '0x...',
    migrationHelper: '0x...',
    governance: '0x...',  // Add here
  },
};
```

**Repeat for ALL network files:** `mantra-dukong.ts`, `local.ts`, etc.

### Step 3: Generate or Add ABI

**Option A: Generate from Foundry**

```bash
cd packages/contracts
forge build
# Copy ABI from out/Governance.sol/Governance.json
```

**Option B: Manual**

Create `packages/webapp/src/contracts/governance.ts`:

```typescript
export const governanceAbi = [
  {
    type: 'function',
    name: 'propose',
    inputs: [
      { name: 'description', type: 'string' },
      // ... more inputs
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // ... more functions
] as const;
```

### Step 4: Create Hook (Optional)

Create `packages/webapp/src/lib/hooks/useGovernance.ts`:

```typescript
import { useReadContract, useWriteContract } from 'wagmi';
import { useAppConfig } from './useAppConfig';
import { governanceAbi } from '@/contracts/governance';

export function useGovernance() {
  const config = useAppConfig();
  
  const { data: proposalCount } = useReadContract({
    address: config.contracts.governance,
    abi: governanceAbi,
    functionName: 'proposalCount',
  });
  
  const { writeContract } = useWriteContract();
  
  const propose = (description: string) => {
    return writeContract({
      address: config.contracts.governance,
      abi: governanceAbi,
      functionName: 'propose',
      args: [description],
    });
  };
  
  return { proposalCount, propose };
}
```

### Step 5: Use in Component

```typescript
import { useGovernance } from '@/lib/hooks/useGovernance';

function GovernanceFeature() {
  const { proposalCount, propose } = useGovernance();
  
  return (
    <div>
      <p>Total Proposals: {proposalCount?.toString()}</p>
      <Button onClick={() => propose('New proposal')}>
        Create Proposal
      </Button>
    </div>
  );
}
```

### Checklist

- [ ] Added contract to `ChainConfig` type
- [ ] Updated ALL network config files with addresses
- [ ] Added ABI file
- [ ] Created custom hook (optional)
- [ ] Tested reads and writes
- [ ] Verified addresses on block explorer

---

## How to Add a New Component to Kitchen Sink

**Goal:** Add a new shared component to the component showcase

### Step 1: Create the Component

Assuming you've created a new component in `src/components/common/`:

```typescript
// src/components/common/TokenIcon.tsx
export function TokenIcon({ symbol, size = 24 }: { symbol: string; size?: number }) {
  return (
    <img 
      src={`/images/tokens/${symbol.toLowerCase()}.svg`}
      alt={symbol}
      width={size}
      height={size}
      className="rounded-full"
    />
  );
}
```

### Step 2: Add to Kitchen Sink Route

Update `packages/webapp/src/routes/kitchen-sink.tsx`:

```tsx
import { TokenIcon } from '@/components/common/TokenIcon';

function KitchenSinkPage() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      {/* Existing sections... */}
      
      {/* New Section */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Token Icons</h2>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <TokenIcon symbol="OM" size={32} />
            <TokenIcon symbol="ETH" size={32} />
            <TokenIcon symbol="USDC" size={32} />
          </div>
          
          {/* Code Example */}
          <pre className="mt-4 bg-zinc-100 p-4 rounded text-sm">
{`<TokenIcon symbol="OM" size={32} />`}
          </pre>
        </Card>
      </section>
    </div>
  );
}
```

### Step 3: Document Props

Add a props table to the Kitchen Sink:

```tsx
<div className="mt-4">
  <h3 className="font-semibold mb-2">Props</h3>
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b">
        <th className="text-left p-2">Prop</th>
        <th className="text-left p-2">Type</th>
        <th className="text-left p-2">Default</th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b">
        <td className="p-2"><code>symbol</code></td>
        <td className="p-2">string</td>
        <td className="p-2">-</td>
      </tr>
      <tr className="border-b">
        <td className="p-2"><code>size</code></td>
        <td className="p-2">number</td>
        <td className="p-2">24</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Checklist

- [ ] Component is in `src/components/common/` or `src/components/ui/`
- [ ] Added to Kitchen Sink with visual examples
- [ ] Added code example showing usage
- [ ] Documented props (if applicable)
- [ ] Tested all variants/states

---

## How to Update Design Tokens

**Goal:** Change colors, fonts, or animations globally

### Step 1: Update Preset

Edit `packages/webapp/omies-preset.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#7CAEBC',     // Change this
          newColor: '#FF5733', // Add new color
        },
      },
    },
  },
};
```

### Step 2: Update CSS Variables

Edit `packages/webapp/src/index.css`:

```css
:root {
  --background: 193 30% 61%;     /* Change HSL values */
  --new-variable: 0 100% 50%;    /* Add new variable */
}
```

### Step 3: Update Documentation

**For Agents:** Update `docs/agents/DESIGN_TOKENS.md`:

```markdown
| **New Color** | `#FF5733` | `bg-brand-newColor` | Special feature highlight |
```

**For Developers:** Update `docs/dev/GETTING_STARTED.md` if needed.

### Step 4: Test Everywhere

1. Check CartoonBackground colors
2. Check all button variants
3. Check card backgrounds
4. Check text colors
5. Navigate to `/devtools` to see color swatches

### Step 5: Update CartoonBackground (if needed)

If you changed sky or hill colors, update `src/components/scene/CartoonBackground.tsx`:

```tsx
<div className="bg-[#4FA3DC]" />  {/* Update hex code */}
```

### Checklist

- [ ] Updated `omies-preset.js`
- [ ] Updated `index.css`
- [ ] Updated `DESIGN_TOKENS.md`
- [ ] Updated CartoonBackground (if applicable)
- [ ] Tested visual consistency
- [ ] Checked color contrast ratios

---

## How to Deploy

**Goal:** Deploy the webapp to production

### Option 1: Cloudflare Pages

#### Step 1: Build

```bash
yarn workspace @dapp-evm/webapp build
```

This creates `packages/webapp/dist/`.

#### Step 2: Deploy with Wrangler

```bash
cd packages/webapp
yarn wrangler pages deploy dist
```

#### Step 3: Configure Environment

In Cloudflare dashboard:

1. Go to Pages project settings
2. Add environment variables:
   - `VITE_WALLETCONNECT_PROJECT_ID`
   - Any other `VITE_*` vars

#### Step 4: Test

Visit the Cloudflare Pages URL and test:

- Wallet connection
- Network switching
- Contract interactions

### Option 2: Vercel

#### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

#### Step 2: Deploy

```bash
cd packages/webapp
vercel
```

Follow the prompts to link your project.

#### Step 3: Configure Environment

In Vercel dashboard:

1. Go to project settings → Environment Variables
2. Add all `VITE_*` variables

### Option 3: Netlify

#### Step 1: Build

```bash
yarn workspace @dapp-evm/webapp build
```

#### Step 2: Deploy with Netlify CLI

```bash
npm i -g netlify-cli
cd packages/webapp
netlify deploy --prod --dir=dist
```

### Option 4: Docker

#### Step 1: Create Dockerfile

```dockerfile
# packages/webapp/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Step 2: Build and Run

```bash
docker build -t omies-dapp ./packages/webapp
docker run -p 8080:80 omies-dapp
```

### General Deployment Checklist

- [ ] Built production bundle
- [ ] Set all environment variables
- [ ] Tested wallet connection
- [ ] Tested contract interactions
- [ ] Verified correct network configs
- [ ] Checked for console errors
- [ ] Tested on mobile
- [ ] Set up custom domain (if applicable)
- [ ] Enabled HTTPS
- [ ] Set up monitoring/analytics

---

## Troubleshooting

### Common Issues

**Issue:** "Module not found" error

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules yarn.lock
yarn install
```

**Issue:** Wallet connection not working

**Solution:**
- Check `VITE_WALLETCONNECT_PROJECT_ID` is set
- Verify ProjectID is valid at cloud.walletconnect.com
- Check browser console for CORS errors

**Issue:** Wrong contract addresses

**Solution:**
- Verify addresses in `src/config/networks/[network].ts`
- Check you're on the correct network
- Use `/devtools` to inspect current config

**Issue:** Styles not applying

**Solution:**
```bash
# Restart dev server
yarn workspace @dapp-evm/webapp dev
```

**Issue:** TypeScript errors

**Solution:**
```bash
# Regenerate types
yarn workspace @dapp-evm/webapp codegen
```

---

**That's it!** These workflows cover the most common development tasks. For more advanced topics, refer to the Architecture Guide or the Agent documentation.
