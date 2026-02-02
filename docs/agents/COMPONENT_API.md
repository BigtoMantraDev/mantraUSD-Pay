# OMies Component API - Detailed Specifications

**Purpose:** This document provides detailed technical specifications for all components in the OMies dApp component library. These are strict rules that agents MUST follow when building or modifying components.

**Location:** All components specified here MUST be built in `src/components/common/` unless otherwise noted.

---

## Table of Contents

1. [Wallet Connection Components](#1-wallet-connection-components)
2. [Transaction Components](#2-transaction-components)
3. [Network Components](#3-network-components)
4. [Utility Components](#4-utility-components)
5. [Layout Components](#5-layout-components)
6. [Error Handling Components](#6-error-handling-components)
7. [Developer Tools](#7-developer-tools)
8. [Configuration System](#8-configuration-system)

---

## 1. Wallet Connection Components

### 1.1 WalletConnectPill

**File:** `src/components/common/WalletConnectPill.tsx`

**Purpose:** Custom UI wrapper around AppKit to match OMies brand. Never use raw `<appkit-button />`.

#### State Machine

| State        | Condition                              | Visual                                   |
| ------------ | -------------------------------------- | ---------------------------------------- |
| Disconnected | `!isConnected`                         | Button "CONNECT WALLET"                  |
| Connected    | `isConnected && address && chainId`    | Glass pill with network + balance + address |
| Loading      | `isConnecting`                         | Button with spinner                      |

#### Props Interface

```typescript
interface WalletConnectPillProps {
  className?: string;
}
```

#### Disconnected State

**Component:** ShadCN `<Button>`

```tsx
<Button 
  variant="default" 
  className="rounded-[4px] font-semibold"
  onClick={() => modal.open()}
>
  CONNECT WALLET
</Button>
```

**Styling:**
* Variant: `default` (Dark Blue #3B506C)
* Border Radius: `rounded-[4px]` (sharp corners)
* Text: White, uppercase, semi-bold
* Height: `h-10`
* Padding: `px-4`

#### Connected State

**Container:**
```tsx
<div className="flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full pl-2 pr-4 py-1.5">
```

**Elements (left to right):**

1.  **Network Icon**
    * Circular image/svg
    * Size: `w-6 h-6`
    * Source: `config.ui.icon` from active chain config
    * Alt text: Network name

2.  **Balance Display**
    * Component: `<BalanceDisplay />`
    * Props: `value={balance}`, `symbol="OM"`, `decimals={18}`, `compact={true}`
    * Text color: White
    * Font weight: Medium

3.  **Separator**
    * Vertical divider: `<div className="h-4 w-[1px] bg-white/30" />`

4.  **Address Display**
    * Component: `<AddressDisplay />`
    * Props: `address={address}`, `className="text-white"`, `showCopy={false}`
    * Truncation: Show first 6 and last 4 characters

#### Interaction (Connected)

**On Click:** Opens ShadCN `Popover` positioned below the pill.

**Popover Content:**

```tsx
<PopoverContent className="w-64 p-4 bg-white rounded-lg shadow-lg">
  <div className="space-y-3">
    {/* Header */}
    <div className="font-semibold text-lg text-primary">
      My Account
    </div>
    
    {/* Copy Address Row */}
    <button className="flex items-center gap-2 w-full p-2 hover:bg-zinc-100 rounded">
      <Copy className="size-4" />
      <span className="flex-1 text-left">Copy Address</span>
    </button>
    
    {/* View on Explorer Row */}
    <a 
      href={`${config.urls.explorer}/address/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 w-full p-2 hover:bg-zinc-100 rounded"
    >
      <ExternalLink className="size-4" />
      <span className="flex-1 text-left">View on Explorer</span>
    </a>
    
    {/* Disconnect Row */}
    <button 
      className="flex items-center gap-2 w-full p-2 hover:bg-red-50 rounded text-destructive"
      onClick={disconnect}
    >
      <LogOut className="size-4" />
      <span className="flex-1 text-left">Disconnect</span>
    </button>
  </div>
</PopoverContent>
```

#### Edge Cases

* **Wrong Network:** Show network name in yellow if `config.isTestnet` or red if unsupported.
* **No Balance:** Show "0.00 OM" if balance is undefined or 0.
* **Long Address:** Always truncate, never show full address in pill.

#### Required Hooks

```typescript
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useAppConfig } from '@/lib/hooks/useAppConfig';
```

---

## 2. Transaction Components

### 2.1 TransactionDialog

**File:** `src/components/common/TransactionDialog.tsx`

**Purpose:** Standard single-step transaction flow (Stake, Claim, Transfer, etc.).

#### Props Interface

```typescript
interface TransactionDialogProps {
  open: boolean;
  status: 'idle' | 'review' | 'signing' | 'processing' | 'success' | 'error';
  title: string;
  data: Array<{ label: string; value: string | ReactNode }>;
  txHash?: string;
  error?: Error;
  onConfirm: () => void;
  onClose: () => void;
}
```

#### State Machine

| Status       | Visual State                                  | User Actions                     |
| ------------ | --------------------------------------------- | -------------------------------- |
| `idle`       | Dialog closed                                 | N/A                              |
| `review`     | Show transaction details, "CONFIRM" button    | Confirm or Cancel                |
| `signing`    | "Please sign..." with pulse animation         | Wait (wallet modal open)         |
| `processing` | Loader with "Waiting for confirmation..."     | Wait                             |
| `success`    | Green check, "View on Explorer" + "Close"     | View tx or close                 |
| `error`      | Red alert icon, error accordion               | Retry or close                   |

#### State: Review

**Header:**
```tsx
<DialogHeader>
  <DialogTitle>{title}</DialogTitle>
  <DialogDescription>Review your transaction details below.</DialogDescription>
</DialogHeader>
```

**Body:**
```tsx
<div className="rounded-lg bg-zinc-100 p-4 space-y-3">
  {data.map((item) => (
    <div key={item.label} className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{item.label}</span>
      <span className="text-sm font-medium text-card-foreground">
        {item.value}
      </span>
    </div>
  ))}
</div>
```

**Footer:**
```tsx
<DialogFooter>
  <Button variant="outline" onClick={onClose}>
    Cancel
  </Button>
  <Button onClick={onConfirm}>
    CONFIRM
  </Button>
</DialogFooter>
```

#### State: Signing

**Body:**
```tsx
<div className="flex flex-col items-center gap-4 py-8">
  <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
    <Wallet className="size-8 text-primary" />
  </div>
  <div className="text-center space-y-2">
    <p className="font-semibold text-lg">Waiting for Signature</p>
    <p className="text-sm text-muted-foreground">
      Please sign the transaction in your wallet...
    </p>
  </div>
</div>
```

**Footer:** None (no buttons, user must interact with wallet).

#### State: Processing

**Body:**
```tsx
<div className="flex flex-col items-center gap-4 py-8">
  <Loader2 className="size-12 animate-spin text-primary" />
  <div className="text-center space-y-2">
    <p className="font-semibold text-lg">Processing Transaction</p>
    <p className="text-sm text-muted-foreground">
      Waiting for confirmation on the blockchain...
    </p>
    <p className="text-xs text-muted-foreground italic">
      The Omies are working on it 🎉
    </p>
  </div>
</div>
```

**Footer:** None.

#### State: Success

**Body:**
```tsx
<div className="flex flex-col items-center gap-4 py-8">
  <div className="size-16 rounded-full bg-green-100 flex items-center justify-center">
    <Check className="size-10 text-green-600" />
  </div>
  <div className="text-center space-y-2">
    <p className="font-semibold text-lg text-green-600">Transaction Successful!</p>
    <p className="text-sm text-muted-foreground">
      Your transaction has been confirmed on the blockchain.
    </p>
  </div>
</div>
```

**Footer:**
```tsx
<DialogFooter className="flex-col sm:flex-row gap-2">
  {txHash && (
    <Button 
      variant="outline" 
      onClick={() => window.open(`${config.urls.explorer}/tx/${txHash}`, '_blank')}
    >
      View on Explorer
    </Button>
  )}
  <Button onClick={onClose}>
    Close
  </Button>
</DialogFooter>
```

#### State: Error

**Body:**
```tsx
<div className="flex flex-col items-center gap-4 py-8">
  <div className="size-16 rounded-full bg-red-100 flex items-center justify-center">
    <AlertCircle className="size-10 text-destructive" />
  </div>
  <div className="text-center space-y-2">
    <p className="font-semibold text-lg text-destructive">Transaction Failed</p>
    <p className="text-sm text-muted-foreground">
      An error occurred while processing your transaction.
    </p>
  </div>
  
  {/* Error Details Accordion */}
  <Accordion type="single" collapsible className="w-full">
    <AccordionItem value="details">
      <AccordionTrigger>View Error Details</AccordionTrigger>
      <AccordionContent>
        <pre className="text-xs bg-zinc-100 p-3 rounded overflow-auto max-h-40">
          {error?.message || 'Unknown error'}
        </pre>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</div>
```

**Footer:**
```tsx
<DialogFooter>
  <Button variant="outline" onClick={onClose}>
    Close
  </Button>
  <Button onClick={onConfirm}>
    Try Again
  </Button>
</DialogFooter>
```

#### Edge Cases & Rules

1.  **User Rejection:** If user rejects in wallet, status goes to `error` with message "User rejected transaction".
2.  **Network Error:** If RPC fails, status goes to `error` with network error details.
3.  **No TxHash:** If transaction fails before broadcasting, don't show "View on Explorer" button.
4.  **Gas Estimation Failure:** Show in review state with warning: "Gas estimation failed. Transaction may fail."
5.  **Dialog Close Protection:** Dialog should NOT be closeable during `signing` and `processing` states (disable backdrop click and ESC key).

---

### 2.2 MultiStepTransactionDialog

**File:** `src/components/common/MultiStepTransactionDialog.tsx`

**Purpose:** Complex flows (e.g., Approve Token → Deposit Token).

#### Props Interface

```typescript
interface Step {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

interface MultiStepTransactionDialogProps extends TransactionDialogProps {
  steps: Step[];
  currentStepIndex: number;
}
```

#### Stepper Indicator

**Visual:** Horizontal row of circles connected by lines.

```tsx
<div className="flex items-center justify-center gap-2 mb-6">
  {steps.map((step, index) => (
    <React.Fragment key={step.id}>
      {/* Circle */}
      <div className={cn(
        "size-10 rounded-full flex items-center justify-center border-2 transition-all",
        step.status === 'pending' && "border-zinc-300 bg-white",
        step.status === 'active' && "border-primary bg-white",
        step.status === 'completed' && "border-green-500 bg-green-500",
        step.status === 'error' && "border-destructive bg-white",
      )}>
        {step.status === 'completed' ? (
          <Check className="size-5 text-white" />
        ) : step.status === 'active' ? (
          <Loader2 className="size-5 animate-spin text-primary" />
        ) : step.status === 'error' ? (
          <X className="size-5 text-destructive" />
        ) : (
          <span className="text-sm font-medium text-zinc-400">{index + 1}</span>
        )}
      </div>
      
      {/* Connector Line */}
      {index < steps.length - 1 && (
        <div className={cn(
          "h-[2px] w-12 transition-all",
          steps[index + 1].status === 'completed' ? "bg-green-500" : "bg-zinc-300"
        )} />
      )}
    </React.Fragment>
  ))}
</div>

{/* Step Title */}
<p className="text-center text-sm font-medium text-muted-foreground mb-4">
  Step {currentStepIndex + 1} of {steps.length}: {steps[currentStepIndex].title}
</p>
```

#### Auto-Advance Logic

When a step completes successfully:

1.  Mark current step status as `completed`.
2.  Increment `currentStepIndex`.
3.  Mark next step status as `active`.
4.  Reset transaction status to `review` to show the next transaction details.

**Example Flow:**

```typescript
// Step 1: Approve
status: 'review' -> 'signing' -> 'processing' -> 'success'
// Auto-advance
steps[0].status = 'completed';
currentStepIndex = 1;
steps[1].status = 'active';
status = 'review'; // Show review for Step 2

// Step 2: Deposit
status: 'review' -> 'signing' -> 'processing' -> 'success'
// All steps complete
allStepsComplete = true;
```

#### Final Success State

After all steps complete, show combined success message:

```tsx
<div className="text-center space-y-2">
  <p className="font-semibold text-lg text-green-600">All Steps Completed!</p>
  <p className="text-sm text-muted-foreground">
    Your multi-step transaction was successful.
  </p>
</div>
```

---

## 3. Network Components

### 3.1 NetworkBanner

**File:** `src/components/common/NetworkBanner.tsx`

**Purpose:** Prevent actions on wrong chain.

#### Props Interface

```typescript
interface NetworkBannerProps {
  requiredChainId: number;
  mode?: 'banner' | 'fullscreen';
}
```

#### Logic

```typescript
const { chain } = useAccount();
const { switchChain } = useSwitchChain();
const config = useAppConfig();

const isWrongNetwork = chain?.id !== requiredChainId;
const isTestnet = config.isTestnet;
```

#### Visual Variants

**Banner Mode (default):**
```tsx
<div className="fixed bottom-0 left-0 right-0 bg-destructive text-destructive-foreground p-4 z-50">
  <div className="container mx-auto flex items-center justify-between">
    <div className="flex items-center gap-2">
      <AlertCircle className="size-5" />
      <p className="font-medium">
        Wrong Network. Please switch to {config.name}.
      </p>
    </div>
    <Button 
      variant="secondary" 
      size="sm"
      onClick={() => switchChain({ chainId: requiredChainId })}
    >
      Switch Network
    </Button>
  </div>
</div>
```

**Fullscreen Mode:**
```tsx
<div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
  <Card className="max-w-md p-8 text-center space-y-6">
    <div className="size-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
      <AlertCircle className="size-10 text-destructive" />
    </div>
    <div className="space-y-2">
      <h2 className="text-2xl font-bold">Wrong Network</h2>
      <p className="text-muted-foreground">
        This dApp requires {config.name}. Please switch your wallet to the correct network.
      </p>
    </div>
    <Button onClick={() => switchChain({ chainId: requiredChainId })}>
      Switch to {config.name}
    </Button>
  </Card>
</div>
```

#### Conditional Rendering

Only render if:
1.  Wallet is connected (`isConnected`).
2.  Chain ID does not match required chain (`chain?.id !== requiredChainId`).

---

### 3.2 NetworkSelector

**File:** `src/components/common/NetworkSelector.tsx`

**Purpose:** Dropdown to switch between supported chains.

#### Props Interface

```typescript
interface NetworkSelectorProps {
  className?: string;
}
```

#### Component Structure

```tsx
<Select value={String(chain?.id)} onValueChange={(value) => switchChain({ chainId: Number(value) })}>
  <SelectTrigger className="w-[200px] bg-white/10 backdrop-blur-md border-white/20 text-white">
    <SelectValue>
      <div className="flex items-center gap-2">
        {/* Status Dot */}
        <div className={cn(
          "size-2 rounded-full",
          config.isTestnet ? "bg-yellow-400" : "bg-green-400",
          !chain && "bg-red-400"
        )} />
        {/* Network Name */}
        <span>{config.name || 'Select Network'}</span>
      </div>
    </SelectValue>
  </SelectTrigger>
  
  <SelectContent>
    {Object.values(CHAIN_CONFIGS).map((chainConfig) => (
      <SelectItem key={chainConfig.chainId} value={String(chainConfig.chainId)}>
        <div className="flex items-center gap-2">
          <img src={chainConfig.ui.icon} alt={chainConfig.name} className="size-5 rounded-full" />
          <span>{chainConfig.name}</span>
          {chainConfig.isTestnet && (
            <span className="text-xs text-yellow-600">(Testnet)</span>
          )}
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### Status Indicators

| Condition         | Dot Color | Label         |
| ----------------- | --------- | ------------- |
| Mainnet           | Green     | Network name  |
| Testnet           | Yellow    | Network name + "(Testnet)" |
| Unsupported/None  | Red       | "Wrong Network" |

---

## 4. Utility Components

### 4.1 AddressDisplay

**File:** `src/components/common/AddressDisplay.tsx`

#### Props Interface

```typescript
interface AddressDisplayProps {
  address: string;
  className?: string;
  showCopy?: boolean;
  truncate?: boolean;
  explorerLink?: boolean;
}
```

#### Truncation Logic

```typescript
function truncateAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address || address.length < startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}
```

**Default:** Show first 6 and last 4 characters (`0x1234...5678`).

#### Component Structure

```tsx
<div className={cn("inline-flex items-center gap-1", className)}>
  {explorerLink ? (
    <a 
      href={`${config.urls.explorer}/address/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-xs hover:underline"
    >
      {truncate ? truncateAddress(address) : address}
    </a>
  ) : (
    <span className="font-mono text-xs">
      {truncate ? truncateAddress(address) : address}
    </span>
  )}
  
  {showCopy && <CopyButton text={address} />}
</div>
```

---

### 4.2 BalanceDisplay

**File:** `src/components/common/BalanceDisplay.tsx`

#### Props Interface

```typescript
interface BalanceDisplayProps {
  value: bigint | undefined;
  decimals?: number;        // Default: 18
  symbol: string;
  icon?: string;
  precision?: number;       // Default: 2
  compact?: boolean;        // Default: false
  className?: string;
}
```

#### Formatting Logic

```typescript
import { formatUnits } from 'viem';

function formatBalance(value: bigint, decimals: number, precision: number, compact: boolean): string {
  const formatted = formatUnits(value, decimals);
  const num = parseFloat(formatted);
  
  // Handle tiny amounts
  const threshold = Math.pow(10, -precision);
  if (num > 0 && num < threshold) {
    return `< ${threshold.toFixed(precision)}`;
  }
  
  // Compact mode for large numbers
  if (compact && num >= 1_000_000) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(num);
  }
  
  // Standard formatting
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  });
}
```

#### Component Structure

```tsx
<div className={cn("inline-flex items-center gap-1", className)}>
  {icon && <img src={icon} alt={symbol} className="size-4 rounded-full" />}
  
  {value === undefined ? (
    <Skeleton className="h-4 w-16" />
  ) : (
    <span className="font-medium">
      {formatBalance(value, decimals, precision, compact)} {symbol}
    </span>
  )}
</div>
```

#### Edge Cases

* **Undefined Value:** Show skeleton loader.
* **Zero Value:** Show "0.00 OM" (or with appropriate precision).
* **Negative Value:** Should never happen with BigInt balances, but if so, show "0.00".
* **Very Large Numbers:** If compact mode, show "1.2M", "3.5B", etc.
* **Very Small Numbers:** Show "< 0.01" if below precision threshold.

---

### 4.3 CopyButton

**File:** `src/components/common/CopyButton.tsx`

#### Props Interface

```typescript
interface CopyButtonProps {
  text: string;
  className?: string;
}
```

#### State Management

```typescript
const [copied, setCopied] = useState(false);

const handleCopy = async () => {
  await navigator.clipboard.writeText(text);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};
```

#### Component Structure

```tsx
<Button
  variant="ghost"
  size="icon"
  className={cn("size-5 hover:bg-transparent", className)}
  onClick={handleCopy}
>
  {copied ? (
    <Check className="size-4 text-green-500" />
  ) : (
    <Copy className="size-4" />
  )}
</Button>
```

#### With Tooltip (Optional)

```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon" onClick={handleCopy}>
        {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      {copied ? 'Copied!' : 'Copy'}
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## 5. Layout Components

### 5.1 Navbar

**File:** `src/components/common/Navbar.tsx`

#### Structure

```tsx
<nav className="fixed top-4 left-4 right-4 z-50 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 shadow-lg">
  <div className="container mx-auto flex items-center justify-between">
    {/* Logo */}
    <Link to="/" className="flex items-center gap-2">
      <img src="/om.svg" alt="OMies" className="size-8" />
      <span className="font-bold text-lg text-white">OMies</span>
    </Link>
    
    {/* Navigation Links */}
    <div className="hidden md:flex items-center gap-6">
      <Link to="/stake" className="text-white hover:text-white/80">
        Stake
      </Link>
      <Link to="/migrate" className="text-white hover:text-white/80">
        Migrate
      </Link>
    </div>
    
    {/* Wallet Connection */}
    <WalletConnectPill />
  </div>
</nav>
```

#### Styling Rules

* **Position:** Fixed at top with `top-4` offset.
* **Glass Effect:** `bg-white/10 backdrop-blur-md border border-white/20`.
* **Border Radius:** `rounded-2xl`.
* **Shadow:** `shadow-lg`.
* **Z-Index:** `z-50` (above page content).

---

### 5.2 CartoonBackground

**File:** `src/components/scene/CartoonBackground.tsx`

#### Purpose

The signature visual anchor for all OMies dApps. Must be present on all branded pages.

#### Structure

```tsx
export function CartoonBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      {/* Sky Layer */}
      <div className="absolute inset-0 bg-[#4FA3DC]" />
      
      {/* Sun Rays (Rotating) */}
      <div className="absolute top-[20%] right-[15%] w-40 h-40">
        <div className="absolute inset-0 animate-sun-spin">
          {/* 12 rays */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-2 h-20 bg-white/20 origin-top"
              style={{
                transform: `translate(-50%, -50%) rotate(${i * 30}deg)`,
              }}
            />
          ))}
        </div>
        
        {/* Sun Circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-yellow-300 rounded-full" />
      </div>
      
      {/* Clouds (Optional) */}
      <div className="absolute top-[30%] left-[10%] animate-cloud-pulse">
        {/* Cloud SVG */}
      </div>
      
      {/* Hills */}
      <div className="absolute bottom-0 left-0 right-0">
        {/* Back Hill */}
        <div 
          className="absolute bottom-0 w-full h-[200px] bg-[#48BB78]"
          style={{ 
            borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
            left: '0',
            right: '0',
          }}
        />
        
        {/* Front Hill */}
        <div 
          className="absolute bottom-0 w-full h-[150px] bg-[#68D391]"
          style={{ 
            borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
            left: '0',
            right: '0',
          }}
        />
      </div>
    </div>
  );
}
```

#### Critical Rules

1.  **Z-Index:** MUST be `z-[-1]`.
2.  **Position:** MUST be `fixed inset-0`.
3.  **Pointer Events:** MUST be `pointer-events-none` to allow interaction with page content.
4.  **Exact Colors:**
    * Sky: `#4FA3DC`
    * Back Hill: `#48BB78`
    * Front Hill: `#68D391`
5.  **Sun Animation:** MUST use `animate-sun-spin` (60s rotation).
6.  **Cloud Animation:** MUST use `animate-cloud-pulse` (8s cycle).

---

## 6. Error Handling Components

### 6.1 PageError

**File:** `src/components/common/PageError.tsx`

#### Props Interface

```typescript
interface PageErrorProps {
  error: Error;
  reset?: () => void;
}
```

#### Component Structure

```tsx
<div className="min-h-screen flex items-center justify-center p-4">
  <Card className="max-w-md p-8 text-center space-y-6">
    <div className="size-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
      <AlertCircle className="size-10 text-destructive" />
    </div>
    
    <div className="space-y-2">
      <h2 className="text-2xl font-bold text-destructive">Something Went Wrong</h2>
      <p className="text-muted-foreground">
        {error.message || 'An unexpected error occurred.'}
      </p>
    </div>
    
    <div className="flex gap-2 justify-center">
      {reset && (
        <Button onClick={reset}>
          Try Again
        </Button>
      )}
      <Button variant="outline" onClick={() => window.location.href = '/'}>
        Go Home
      </Button>
    </div>
  </Card>
</div>
```

#### Usage with Error Boundary

```tsx
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary FallbackComponent={PageError}>
  <YourComponent />
</ErrorBoundary>
```

---

## 7. Developer Tools

### 7.1 DevTools Route

**File:** `src/routes/devtools.tsx`

#### Purpose

Debug and test components, config, and styles. Only visible in development mode.

#### Route Guard

```tsx
export const Route = createFileRoute('/devtools')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw new Error('DevTools only available in development');
    }
  },
  component: DevToolsPage,
});
```

#### Sections

1.  **Color Swatches:** All brand colors with hex codes.
2.  **Typography Scale:** All heading and body styles.
3.  **Button Variants:** All button states and sizes.
4.  **Transaction Simulator:** Buttons to test each transaction dialog state.
5.  **Network Info:** Current chain, wallet address, config dump.
6.  **Component Showcase:** Links to /kitchen-sink.

---

## 8. Configuration System

### 8.1 useAppConfig Hook

**File:** `src/lib/hooks/useAppConfig.ts`

#### Purpose

Centralized hook to get current chain configuration.

#### Implementation

```typescript
import { useChainId } from 'wagmi';
import { CHAIN_CONFIGS, DEFAULT_CHAIN_ID } from '@/config/chains';

export function useAppConfig() {
  const chainId = useChainId();
  
  // Return config for current chain, or default if unsupported
  return CHAIN_CONFIGS[chainId] || CHAIN_CONFIGS[DEFAULT_CHAIN_ID];
}
```

#### Return Value

```typescript
{
  viemChain: Chain,
  chainId: number,
  name: string,
  isTestnet: boolean,
  urls: {
    subgraph: string,
    explorer: string,
    rpc: string,
  },
  contracts: {
    omToken: Address,
    stakingPool: Address,
    migrationHelper: Address,
  },
  ui: {
    color: string,
    icon: string,
  },
}
```

#### Usage

```tsx
const config = useAppConfig();

// Get explorer URL
const explorerUrl = `${config.urls.explorer}/tx/${txHash}`;

// Get contract address
const tokenAddress = config.contracts.omToken;

// Check if testnet
if (config.isTestnet) {
  console.warn('Running on testnet');
}
```

---

## 9. Testing Requirements

### Unit Tests

All components MUST have tests covering:

1.  **Rendering:** Component renders without crashing.
2.  **Props:** All prop combinations work correctly.
3.  **States:** All states render correctly (loading, error, success).
4.  **Interactions:** User interactions trigger expected behavior.
5.  **Accessibility:** ARIA attributes and keyboard navigation work.

### Example Test (TransactionDialog)

```typescript
describe('TransactionDialog', () => {
  it('renders review state correctly', () => {
    render(
      <TransactionDialog
        open={true}
        status="review"
        title="Stake OM"
        data={[{ label: 'Amount', value: '100 OM' }]}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />
    );
    
    expect(screen.getByText('Stake OM')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('100 OM')).toBeInTheDocument();
    expect(screen.getByText('CONFIRM')).toBeInTheDocument();
  });
  
  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = jest.fn();
    render(
      <TransactionDialog
        open={true}
        status="review"
        title="Stake OM"
        data={[]}
        onConfirm={onConfirm}
        onClose={jest.fn()}
      />
    );
    
    fireEvent.click(screen.getByText('CONFIRM'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
```

---

## 10. Accessibility Requirements

All components MUST follow these accessibility standards:

1.  **Semantic HTML:** Use appropriate elements (`<button>`, `<nav>`, `<main>`, etc.).
2.  **ARIA Attributes:** Add `aria-label`, `aria-describedby`, `role` where needed.
3.  **Keyboard Navigation:** All interactive elements must be keyboard accessible.
4.  **Focus Management:** Proper focus indicators and focus trapping in modals.
5.  **Screen Reader Support:** Meaningful labels and descriptions.
6.  **Color Contrast:** Minimum WCAG AA compliance (4.5:1 for normal text).

---

**End of Component API Documentation**

**Remember:** These specifications are strict rules. Agents MUST follow them exactly when building or modifying components. Deviations require explicit approval.
