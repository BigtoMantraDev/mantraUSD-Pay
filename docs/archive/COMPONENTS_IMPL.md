# OMies Components Implementation Plan

> **Status:** Ready for Implementation  
> **Spec Source:** [UI_COMPONENTS.md](UI_COMPONENTS.md), [CONFIG_IDEA.md](CONFIG_IDEA.md)  
> **Target Directory:** `packages/webapp/src/`

---

## Overview

This plan implements 10 reusable components, 3 hooks, and a modular configuration architecture for the OMies dApp template. All shared components are Kitchen Sink tested.

### Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Configuration                                                  │
│   types.ts → networks/*.ts → chains.ts → wagmi.ts (update)              │
│                                    ↓                                    │
│                            useAppConfig()                               │
└─────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: Atomic Utilities                                               │
│   CopyButton → AddressDisplay ─┐                                        │
│                                ├→ BalanceDisplay                        │
└─────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: Wallet & Network                                               │
│   NetworkSelector ─┐                                                    │
│                    ├→ WalletConnectPill → Navbar (update)               │
│   NetworkBanner ───┘                                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: Transaction Flow                                               │
│   useTransactionFlow() → TransactionDialog → MultiStepTransactionDialog │
└─────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: Error Handling & DevTools                                      │
│   PageError → __root.tsx (integrate)                                    │
│   DevTools route                                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 6: Documentation                                                  │
│   AGENTS.md update (§7 Component Usage Rules)                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Configuration Architecture

### Task 1.1: Create Type Definitions
**File:** `src/config/types.ts`

- [x] Create `ChainConfig` interface with viemChain, chainId, name, isTestnet, urls, contracts, ui

### Task 1.2: Create Network Modules
**Directory:** `src/config/networks/`

- [x] Create `networks/mantra-mainnet.ts` — Production config
- [x] Create `networks/mantra-dukong.ts` — Testnet config  
- [x] Create `networks/local.ts` — Anvil dev config (deterministic addresses)

### Task 1.3: Create Aggregator
**File:** `src/config/chains.ts`

- [x] Export `SUPPORTED_CHAINS` array (for Wagmi)
- [x] Export `CHAIN_CONFIGS` record (chainId → config)
- [x] Export `DEFAULT_CHAIN_ID` (local in dev, mainnet in prod)

### Task 1.4: Update Wagmi Config
**File:** `src/config/wagmi.ts`

- [x] Import chains from `chains.ts` instead of inline definition
- [x] Use `SUPPORTED_CHAINS` for AppKit config

### Task 1.5: Create useAppConfig Hook
**File:** `src/hooks/useAppConfig.ts`

- [x] Returns current `ChainConfig` based on `useChainId()`
- [x] Falls back to `DEFAULT_CHAIN_ID` if unsupported chain
- [x] Include helper: `getExplorerTxUrl(hash: string): string`
- [x] Include helper: `getExplorerAddressUrl(address: string): string`

### Task 1.6: Kitchen Sink Update
- [x] Add "Configuration" section showing current chain info

---

## Phase 2: Atomic Utilities

### Task 2.1: CopyButton
**File:** `src/components/common/CopyButton.tsx`

- [x] Use Lucide `Copy` icon (default) / `Check` icon (success, 2s)
- [x] Use `navigator.clipboard.writeText()`
- [x] Wrap in ShadCN `Tooltip` showing "Copy" / "Copied!"
- [x] **Kitchen Sink:** Add to "Utilities" section

### Task 2.2: AddressDisplay
**File:** `src/components/common/AddressDisplay.tsx`

- [x] Use existing `shortenAddress()` from `lib/shortenAddress.tsx`
- [x] Integrate `CopyButton` (conditionally via `showCopy` prop)
- [x] **Kitchen Sink:** Add to "Utilities" section

### Task 2.3: BalanceDisplay
**File:** `src/components/common/BalanceDisplay.tsx`

- [x] Use `viem.formatUnits()` for conversion
- [x] Implement compact notation via `Intl.NumberFormat`
- [x] Handle tiny amounts: show `< 0.01` when value > 0 but rounds to 0
- [x] Show `Skeleton` when `value` is undefined
- [x] Floor values (never round up)
- [x] **Kitchen Sink:** Add to "Utilities" section

---

## Phase 3: Wallet & Network Components

### Task 3.1: NetworkSelector
**File:** `src/components/common/NetworkSelector.tsx`

- [x] ShadCN `Select` with glassmorphism style
- [x] Use `useSwitchChain()` and `CHAIN_CONFIGS`
- [x] Status dots: Green (mainnet), Yellow (testnet), Red (unsupported)
- [x] **Kitchen Sink:** Add to "Wallet" section

### Task 3.2: WalletConnectPill
**File:** `src/components/common/WalletConnectPill.tsx`

- [x] **Disconnected:** Button "CONNECT WALLET", calls `useAppKit().open()`
- [x] **Connected:** Glass pill with network icon, `BalanceDisplay`, separator, `AddressDisplay`
- [x] **Popover:** Copy Address, View on Explorer, Disconnect
- [x] **Kitchen Sink:** Add "Wallet" section

### Task 3.3: Update Navbar
**File:** `src/components/common/Navbar.tsx`

- [x] Remove `<appkit-button />`
- [x] Add `<WalletConnectPill />`

### Task 3.4: NetworkBanner
**File:** `src/components/common/NetworkBanner.tsx`

- [x] Shows testnet warning (yellow) or unsupported network error (red)
- [x] Compare `useAppConfig()` isSupported and isTestnet flags
- [x] Hidden on supported mainnets
- [x] **Kitchen Sink:** Add to "Wallet & Network" section

---

## Phase 4: Transaction Flow

### Task 4.1: useTransactionFlow Hook
**File:** `src/hooks/useTransactionFlow.ts`

- [x] State: `status`, `txHash`, `error`
- [x] Actions: `openReview()`, `confirm()`, `reset()`, `setError()`
- [x] Wrap `useWriteContract` + `useWaitForTransactionReceipt`

### Task 4.2: TransactionDialog
**File:** `src/components/common/TransactionDialog.tsx`

- [x] **Review:** Custom review content + "CONFIRM" button
- [x] **Signing:** Spinner + "Please confirm in your wallet..." text
- [x] **Processing:** Spinner + "Transaction pending..."
- [x] **Success:** Checkmark + explorer link
- [x] **Error:** XCircle icon + error message
- [x] **Kitchen Sink:** Add "Transaction Flow" section with state simulator

### Task 4.3: MultiStepTransactionDialog
**File:** `src/components/common/MultiStepTransactionDialog.tsx`

- [x] Vertical stepper UI (icons + step labels)
- [x] Step states: Idle (gray circle), Active (spinner), Completed (green check), Error (red X)
- [x] Auto-advance logic between steps
- [x] **Kitchen Sink:** Component available (demo uses single-step TransactionDialog)

---

## Phase 5: Error Handling & DevTools

### Task 5.1: PageError
**File:** `src/components/common/PageError.tsx`

- [x] Centered white Card with AlertTriangle icon
- [x] Error title + message + "Reload Page" button
- [x] Shows expanded error details in development mode
- [x] **Kitchen Sink:** Added to "Error Handling" section

### Task 5.2: Integrate Error Boundary
**File:** `src/routes/__root.tsx`

- [x] Created ErrorBoundary component with PageError fallback
- [x] Wrap `<Outlet />` in ErrorBoundary in __root.tsx

### Task 5.3: DevTools Route
**File:** `src/routes/devtools.tsx`

- [x] Guard with `import.meta.env.DEV`
- [x] Wallet status, Network info, Chain configuration dump
- [x] Supported chains list, Error testing buttons

---

## Phase 6: Documentation

### Task 6.1: Update AGENTS.md
**File:** `/AGENTS.md`

- [x] Added section **§7 Component Usage Rules** with:
  - ALWAYS use `WalletConnectPill` (never `<appkit-button />`)
  - ALWAYS use `AddressDisplay` / `BalanceDisplay` (never manual formatting)
  - ALL blockchain writes MUST use `TransactionDialog` or `MultiStepTransactionDialog`
  - Use `useAppConfig()` for contract addresses and explorer URLs
  - ALWAYS update `/kitchen-sink` when adding shared components

### Task 6.2: Final Kitchen Sink Review
- [x] Configuration section with useAppConfig and CHAIN_CONFIGS
- [x] Utilities section: CopyButton, AddressDisplay, BalanceDisplay
- [x] Wallet & Network section: NetworkBanner, NetworkSelector, WalletConnectPill
- [x] Transaction Flow section: TransactionDialog demo with simulated flow
- [x] Error Handling section: PageError component

---

## ✅ Implementation Complete!

All 21 tasks across 6 phases have been completed. See summary below.

## Checklist Summary

| Phase               | Tasks | Components/Files                                                  | Status |
| ------------------- | ----- | ----------------------------------------------------------------- | ------ |
| 1. Configuration    | 6     | types.ts, networks/*, chains.ts, wagmi.ts, useAppConfig           | ✅      |
| 2. Utilities        | 3     | CopyButton, AddressDisplay, BalanceDisplay                        | ✅      |
| 3. Wallet & Network | 4     | NetworkSelector, WalletConnectPill, Navbar, NetworkBanner         | ✅      |
| 4. Transaction      | 3     | useTransactionFlow, TransactionDialog, MultiStepTransactionDialog | ✅      |
| 5. Error & Dev      | 3     | PageError, ErrorBoundary, DevTools route                          | ✅      |
| 6. Documentation    | 2     | AGENTS.md §7, Kitchen Sink final review                           | ✅      |
| 6. Documentation    | 2     | AGENTS.md, Kitchen Sink review                                    |

**Total: 21 tasks across 6 phases**
