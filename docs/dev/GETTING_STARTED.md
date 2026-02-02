# Getting Started with OMies dApp Template

Welcome to the OMies dApp Template! This guide will help you get up and running quickly.

---

## Quick Start

### Prerequisites

- **Node.js:** v18+ (recommended: v20)
- **Yarn:** v3+ (Berry/Modern)
- **Git:** Latest version

### Installation

```bash
# Clone the repository
git clone https://github.com/mantramatt/omies-dapp-spa-template.git
cd omies-dapp-spa-template

# Install dependencies (from repository root)
yarn install

# Start the development server
yarn workspace @dapp-evm/webapp dev
```

The app will be available at `http://localhost:5173`.

---

## Project Structure

This is a **Yarn Monorepo** with two main packages:

```
omies-dapp-spa-template/
├── packages/
│   ├── contracts/          # Foundry smart contracts
│   └── webapp/             # Vite + React SPA (your main workspace)
├── docs/
│   ├── agents/             # Documentation for LLM agents
│   └── dev/                # Documentation for human developers
└── package.json            # Root package.json with workspace config
```

**Focus:** Most of your work will be in `packages/webapp/`.

---

## Key Commands

All commands should be run from the **repository root** using Yarn workspaces.

### Development

```bash
# Start the webapp dev server
yarn workspace @dapp-evm/webapp dev

# Build for production
yarn workspace @dapp-evm/webapp build

# Preview production build
yarn workspace @dapp-evm/webapp preview
```

### Dependencies

```bash
# Add a new dependency to webapp
yarn workspace @dapp-evm/webapp add [package-name]

# Add a dev dependency
yarn workspace @dapp-evm/webapp add -D [package-name]

# Remove a dependency
yarn workspace @dapp-evm/webapp remove [package-name]
```

### Linting & Formatting

```bash
# Run ESLint
yarn workspace @dapp-evm/webapp lint

# Format with Prettier
yarn workspace @dapp-evm/webapp format
```

### Testing

```bash
# Run tests (if configured)
yarn workspace @dapp-evm/webapp test
```

---

## Key Architectural Concepts

### 1. The "Stage" Layout

Every page in the OMies dApp is designed like a theater stage:

- **The Scene (Background):** A fixed, cartoon-style background with a teal sky, rotating sun, and rolling green hills. This is the `CartoonBackground` component.
- **The Stage (Content):** Your page content sits on top of the background at `z-index: 10`.

**Visual Hierarchy:**
```
z-index: -1  → CartoonBackground (fixed)
z-index: 10  → Page content (relative)
z-index: 50  → Navbar, dialogs, popovers
```

This creates a playful, branded experience where all content "floats" above the cartoon scene.

### 2. The "Glassmorphism" UI

The Navbar and WalletConnectPill use a "frosted glass" effect:

```css
bg-white/10       /* 10% white background */
backdrop-blur-md  /* Blur the background behind */
border border-white/20  /* Subtle white border */
```

This creates a modern, semi-transparent look that blends with the cartoon background.

### 3. Modular Network Configuration

Instead of one big config file, we use a **"File-per-Network"** strategy:

```
src/config/
├── types.ts                 # ChainConfig interface
├── networks/
│   ├── mantra-mainnet.ts    # Mainnet config
│   ├── mantra-dukong.ts     # Testnet config
│   └── local.ts             # Local Anvil config
└── chains.ts                # Aggregator (exports CHAIN_CONFIGS map)
```

**Benefits:**
- Easy to add new networks without touching existing configs.
- Each network is self-contained and testable.
- Clear separation of concerns.

### 4. Component-First Design

We use **ShadCN/UI** as the foundation and build custom components on top:

- **Base Components:** `Button`, `Card`, `Dialog` (from ShadCN)
- **Custom Components:** `WalletConnectPill`, `TransactionDialog`, `NetworkBanner`
- **Utility Components:** `AddressDisplay`, `BalanceDisplay`, `CopyButton`

**Rule:** ALWAYS use the custom components. Don't reinvent the wheel.

---

## Environment Variables

Create a `.env` file in `packages/webapp/`:

```env
# Required
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Optional (for production)
VITE_SUBGRAPH_URL=https://api.goldsky.com/...
VITE_RPC_URL=https://rpc.mantrachain.io
```

Get a WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/).

---

## Tech Stack at a Glance

| Layer                | Technology         | Purpose                          |
| -------------------- | ------------------ | -------------------------------- |
| **Framework**        | React 19           | UI library                       |
| **Build Tool**       | Vite               | Fast dev server and bundler      |
| **Routing**          | TanStack Router    | Type-safe file-based routing     |
| **Styling**          | Tailwind CSS v4    | Utility-first CSS                |
| **UI Components**    | ShadCN/UI          | Accessible component primitives  |
| **Web3**             | Wagmi + Viem       | Ethereum interactions            |
| **Wallet Connection**| AppKit (Reown)     | Multi-wallet support             |
| **State Management** | TanStack Query     | Server state and caching         |
| **Form Validation**  | Zod                | Schema validation                |
| **Icons**            | Lucide React       | Clean, consistent icons          |

---

## Development Workflow

### 1. Create a New Feature

```bash
# Create a new route
touch packages/webapp/src/routes/my-feature.tsx

# Create feature components
mkdir packages/webapp/src/components/features/my-feature
touch packages/webapp/src/components/features/my-feature/MyFeature.tsx
```

### 2. Connect to Smart Contracts

```typescript
import { useReadContract, useWriteContract } from 'wagmi';
import { useAppConfig } from '@/lib/hooks/useAppConfig';

function MyFeature() {
  const config = useAppConfig();
  
  // Read from contract
  const { data: balance } = useReadContract({
    address: config.contracts.omToken,
    abi: omTokenAbi,
    functionName: 'balanceOf',
    args: [userAddress],
  });
  
  // Write to contract
  const { writeContract } = useWriteContract();
  
  const handleStake = () => {
    writeContract({
      address: config.contracts.stakingPool,
      abi: stakingAbi,
      functionName: 'stake',
      args: [amount],
    });
  };
}
```

### 3. Use the Transaction Dialog

```typescript
import { TransactionDialog } from '@/components/common/TransactionDialog';

function MyFeature() {
  const [dialogStatus, setDialogStatus] = useState('idle');
  
  const handleConfirm = async () => {
    setDialogStatus('signing');
    try {
      await writeContract({...});
      setDialogStatus('processing');
      // Wait for confirmation
      setDialogStatus('success');
    } catch (error) {
      setDialogStatus('error');
    }
  };
  
  return (
    <>
      <Button onClick={() => setDialogStatus('review')}>Stake</Button>
      
      <TransactionDialog
        open={dialogStatus !== 'idle'}
        status={dialogStatus}
        title="Stake OM"
        data={[
          { label: 'Amount', value: `${amount} OM` },
          { label: 'APY', value: '12%' },
        ]}
        onConfirm={handleConfirm}
        onClose={() => setDialogStatus('idle')}
      />
    </>
  );
}
```

---

## Common Patterns

### Pattern 1: Page Layout

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/my-page')({
  component: MyPage,
});

function MyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 
            className="text-5xl md:text-7xl font-black tracking-tight text-white uppercase"
            style={{ textShadow: '3px 3px 0 #000' }}
          >
            My Page
          </h1>
        </div>
        
        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>
            Content goes here
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### Pattern 2: Wallet-Gated Content

```tsx
import { useAccount } from 'wagmi';
import { WalletConnectPill } from '@/components/common/WalletConnectPill';

function MyFeature() {
  const { isConnected } = useAccount();
  
  if (!isConnected) {
    return (
      <Card className="p-8 text-center">
        <p className="mb-4 text-muted-foreground">
          Please connect your wallet to continue
        </p>
        <WalletConnectPill />
      </Card>
    );
  }
  
  return (
    // Feature content
  );
}
```

### Pattern 3: Network Check

```tsx
import { useChainId } from 'wagmi';
import { NetworkBanner } from '@/components/common/NetworkBanner';
import { DEFAULT_CHAIN_ID } from '@/config/chains';

function MyFeature() {
  const chainId = useChainId();
  
  return (
    <>
      {chainId !== DEFAULT_CHAIN_ID && (
        <NetworkBanner requiredChainId={DEFAULT_CHAIN_ID} />
      )}
      
      {/* Feature content */}
    </>
  );
}
```

---

## Design System Basics

### Colors

Use semantic color variables:

```tsx
// Page background (Teal)
<div className="bg-background text-foreground">

// White cards with dark blue text
<Card className="bg-card text-card-foreground">

// Primary button (Dark blue)
<Button className="bg-primary text-primary-foreground">

// Secondary/accent (Gold)
<Button className="bg-secondary text-secondary-foreground">
```

### Typography

```tsx
// Hero heading (with required shadow)
<h1 
  className="text-5xl md:text-7xl font-black tracking-tight text-white uppercase"
  style={{ textShadow: '3px 3px 0 #000' }}
>

// Page heading
<h2 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">

// Card title
<h3 className="text-2xl font-semibold">

// Body text
<p className="text-base font-normal">
```

### Buttons

```tsx
// Always use sharp corners (NOT rounded-full)
<Button className="rounded-[4px]">
  Action
</Button>

// Variants
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
```

---

## Debugging Tools

### DevTools Route

Navigate to `/devtools` (only in development mode) to access:

- Color swatches
- Typography examples
- Button variants
- Transaction dialog simulator
- Current network info

### Kitchen Sink Route

Navigate to `/kitchen-sink` to see all components in action.

---

## Next Steps

1. **Read the Architecture Guide:** See `/docs/dev/ARCHITECTURE.md` for deep dives into the config system, state management, and monorepo layout.
2. **Learn Common Workflows:** See `/docs/dev/WORKFLOWS.md` for step-by-step guides on adding networks, features, and more.
3. **Explore Agent Documentation:** If you're using LLM assistants, check `/docs/agents/` for detailed specifications they should follow.

---

## Getting Help

- **Documentation Issues:** Open an issue on GitHub.
- **Design Questions:** Reference `/docs/agents/DESIGN_TOKENS.md` for exact color codes and styles.
- **Component Questions:** Reference `/docs/agents/COMPONENT_API.md` for detailed component specs.

Happy coding! 🎉
