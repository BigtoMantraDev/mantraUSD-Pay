# OMies dApp Template (SPA)

A modern React-based template for building decentralized applications on EVM chains, specifically optimized for MANTRA Chain development. Features a distinctive cartoon-style visual identity with comprehensive Web3 components.

## Features

- **EVM Wallet Integration**: Connect to EVM wallets using Reown AppKit (WalletConnect v2)
- **Multi-Chain Support**: Built-in support for MANTRA mainnet, testnet, and local development
- **OMies Design System**: Distinctive teal/yellow cartoon aesthetic with glassmorphism effects
- **Modern UI Components**: 45+ ShadCN primitives + 15 Web3-specific components
- **Type Safety**: Full TypeScript support with proper typing
- **Transaction Flow**: Complete review → sign → pending → success flow with dialogs
- **Responsive Design**: Mobile-first with drawer navigation
- **Developer Ready**: DevTools page, Kitchen Sink showcase, error handling

## What's Included

### Common Components (`@/components/common`)

| Component                    | Purpose                                            |
| ---------------------------- | -------------------------------------------------- |
| `AddressDisplay`             | Shortened address with copy + explorer link        |
| `ApprovalButton`             | Automatic ERC20 approve flow                       |
| `BalanceDisplay`             | Token balance formatting with loading states       |
| `ConnectGuard`               | Wrapper showing "Connect Wallet" when disconnected |
| `CopyButton`                 | Copy-to-clipboard with tooltip feedback            |
| `ErrorBoundary`              | React error boundary with HOC                      |
| `MultiStepTransactionDialog` | Multi-step tx flow (approve → execute)             |
| `Navbar`                     | Glassmorphism navbar with mobile drawer            |
| `NetworkBanner`              | Testnet/unsupported network warnings               |
| `NetworkSelector`            | Chain switching dropdown                           |
| `PageError`                  | Full-page error display with dev details           |
| `TokenInput`                 | Amount input with max button, balance, validation  |
| `TokenSelector`              | Searchable token picker with balances              |
| `TransactionDialog`          | Single-step transaction flow                       |
| `WalletConnectPill`          | Custom AppKit wrapper with popover                 |

### Hooks (`@/hooks`)

| Hook                 | Purpose                                |
| -------------------- | -------------------------------------- |
| `useAppConfig`       | Chain config with explorer URL helpers |
| `useTransactionFlow` | Transaction state machine              |
| `useTokenBalance`    | Fetch ERC20/native token balance       |
| `useTokenAllowance`  | Check ERC20 allowance for spender      |
| `useDebounce`        | Debounce values for search/input       |
| `useLocalStorage`    | Persisted state with cross-tab sync    |
| `useMediaQuery`      | CSS media query hook                   |
| `useBreakpoints`     | Tailwind-aligned breakpoint states     |

### Feature Components (`@/components/features`)

| Component    | Purpose                                              |
| ------------ | ---------------------------------------------------- |
| `FaucetCard` | Example testnet faucet (demonstrates best practices) |

### Developer Tools

- `/devtools` - Debug chain config, wallet status, network info
- `/kitchen-sink` - Component showcase with all components

## Quick Start

```bash
# Install dependencies (from monorepo root)
yarn install

# Start development server
yarn workspace @dapp-evm/webapp dev

# Build for production  
yarn workspace @dapp-evm/webapp build
```

## Usage Examples

### Token Amount Input

```tsx
import { TokenInput } from '@/components/common';
import { useAccount } from 'wagmi';

function StakeForm() {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');

  return (
    <TokenInput
      value={amount}
      onChange={setAmount}
      ownerAddress={address}
      symbol="OM"
      showMaxButton
      showBalance
    />
  );
}
```

### Protected Content

```tsx
import { ConnectGuard } from '@/components/common';

function Dashboard() {
  return (
    <ConnectGuard message="Connect to view your portfolio">
      <Portfolio />
    </ConnectGuard>
  );
}
```

### Transaction Flow

```tsx
import { TransactionDialog } from '@/components/common';
import { useTransactionFlow } from '@/hooks';

function SendButton() {
  const { state, openReview, confirm, reset } = useTransactionFlow();

  return (
    <>
      <Button onClick={openReview}>Send Tokens</Button>
      <TransactionDialog
        open={state.status !== 'idle'}
        status={state.status}
        onConfirm={() => confirm({ address, abi, functionName: 'transfer', args })}
        onClose={reset}
      />
    </>
  );
}
```

### ERC20 Approval

```tsx
import { ApprovalButton } from '@/components/common';

<ApprovalButton
  tokenAddress={usdcAddress}
  spenderAddress={stakingContract}
  amount={parseUnits('100', 6)}
  onApprovalComplete={() => setStep('stake')}
>
  Approve USDC
</ApprovalButton>
```

## Architecture

Built with:

- **React 19** + **TypeScript** for type-safe development
- **Vite** for fast development and building
- **TanStack Router** for file-based type-safe routing
- **Wagmi v2** + **Reown AppKit** for Web3 integration
- **ShadCN UI** for accessible component library
- **Tailwind CSS v4** for utility-first styling

## Project Structure

```
src/
├── assets/images/          # SVG logos, icons
├── components/
│   ├── ui/                 # ShadCN primitives (45+ components)
│   ├── common/             # Web3 components (15 components)
│   ├── features/           # Domain-specific (FaucetCard, etc.)
│   └── scene/              # CartoonBackground
├── config/                 # Chain configs, wagmi setup
├── hooks/                  # Custom hooks (8 hooks)
├── lib/                    # Utilities (cn, error handling, formatting)
└── routes/                 # TanStack Router pages
```

## Environment Variables

```bash
# Required for wallet connection
VITE_REOWN_PROJECT_ID=your_project_id
```