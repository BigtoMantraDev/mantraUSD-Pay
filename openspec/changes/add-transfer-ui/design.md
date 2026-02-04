# Transfer UI Design

## Context

The frontend needs to orchestrate a gasless transfer flow that involves:

1. User input (recipient, amount)
2. Fee quote from backend
3. EIP-712 signature from wallet
4. Relay submission to backend
5. Transaction confirmation on-chain

The existing webapp has foundational components (TokenInput, TransactionDialog, useAppConfig) that we'll extend rather
than replace.

**Stakeholders:**

- End users (want simple, gasless transfers)
- Developers (need clear, composable hooks)

**Constraints:**

- Must use existing OMies design system (CartoonBackground, Card styles)
- Must follow TanStack Router file-based routing
- Must use existing TransactionDialog pattern for consistency
- Backend must be running for relay functionality

## Goals / Non-Goals

**Goals:**

- Simple, intuitive transfer form
- Clear fee display before signing
- Smooth signature + relay flow
- Consistent with existing app patterns
- Mobile-responsive design

**Non-Goals:**

- Multi-token selection (single token per page for now)
- Transaction history (use explorer)
- Batch transfers (future enhancement)
- Advanced contract interactions (separate `/execute` route later)

## Architecture Decisions

### Decision: Dedicated Hooks for Each Backend Endpoint

**Choice:** Create separate hooks: `useFeeQuote`, `useNonce`, `useRelayTransaction`

**Rationale:**

- Single responsibility per hook
- Easy to test in isolation
- Composable for different use cases
- Follows existing hook patterns (useTokenBalance, etc.)

**Alternatives considered:**

- Single `useRelay` hook: Too coupled, harder to cache independently

### Decision: TanStack Query for Backend Calls

**Choice:** Use TanStack Query for fee quotes and nonce lookups

**Rationale:**

- Automatic caching and refetching
- Loading/error states out of the box
- Already available in the project
- Stale-while-revalidate for better UX

### Decision: Extend TransactionDialog for Relay Flow

**Choice:** Adapt existing TransactionDialog with relay-specific states

**Rationale:**

- Consistent UX with existing transaction flows
- Users already familiar with the pattern
- Reuse existing success/error rendering

**Modification:** Add `relaying` status between `signing` and `pending`

### Decision: Form State in Component (Not Global)

**Choice:** Keep transfer form state local to TransferForm component

**Rationale:**

- Transfer is a single-page flow
- No need for persistence across routes
- Simpler implementation
- Reset naturally on navigation

## Component Structure

```
src/
├── hooks/
│   ├── useEIP712Sign.ts      # EIP-712 typed data signing
│   ├── useFeeQuote.ts        # GET /fees/quote
│   ├── useNonce.ts           # GET /nonce/:address
│   └── useRelayTransaction.ts # POST /relay
├── components/
│   └── features/
│       └── transfer/
│           ├── index.ts
│           ├── TransferForm.tsx
│           ├── FeeDisplay.tsx
│           └── RelayStatus.tsx
└── routes/
    ├── index.tsx             # Home with hero + quick transfer
    └── transfer.tsx          # Full transfer page
```

## Hook Interfaces

### useFeeQuote

```typescript
interface UseFeeQuoteReturn {
  data: FeeQuote | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  isStale: boolean;
}

function useFeeQuote(chainId: number): UseFeeQuoteReturn;
```

### useNonce

```typescript
interface UseNonceReturn {
  nonce: bigint | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

function useNonce(address: Address, chainId: number): UseNonceReturn;
```

### useEIP712Sign

```typescript
interface ExecuteIntent {
  destination: Address;
  value: bigint;
  data: Hex;
  nonce: bigint;
  deadline: bigint;
}

interface UseEIP712SignReturn {
  sign: (intent: ExecuteIntent) => Promise<Hex>;
  isLoading: boolean;
  error: Error | null;
}

function useEIP712Sign(delegatedAccountAddress: Address): UseEIP712SignReturn;
```

### useRelayTransaction

```typescript
interface RelayParams {
  userAddress: Address;
  signature: Hex;
  intent: ExecuteIntent;
  chainId: number;
}

interface UseRelayTransactionReturn {
  relay: (params: RelayParams) => Promise<RelayResult>;
  isLoading: boolean;
  error: Error | null;
  data: RelayResult | null;
}

function useRelayTransaction(): UseRelayTransactionReturn;
```

## Transfer Flow States

```
┌─────────────┐
│    IDLE     │ User enters recipient + amount
└──────┬──────┘
       │ Valid inputs
       ▼
┌─────────────┐
│   REVIEW    │ Show fee, total, confirm button
└──────┬──────┘
       │ User clicks confirm
       ▼
┌─────────────┐
│  SIGNING    │ Wallet popup for EIP-712 signature
└──────┬──────┘
       │ Signature received
       ▼
┌─────────────┐
│  RELAYING   │ Submitting to backend
└──────┬──────┘
       │ Backend broadcasts tx
       ▼
┌─────────────┐
│  PENDING    │ Waiting for confirmation
└──────┬──────┘
       │ Tx confirmed
       ▼
┌─────────────┐
│  SUCCESS    │ Show tx hash, explorer link
└─────────────┘
```

## EIP-712 Typed Data Structure

```typescript
const domain = {
  name: 'DelegatedAccount',
  version: '1',
  chainId: chainId,
  verifyingContract: delegatedAccountAddress,
};

const types = {
  ExecuteData: [
    {name: 'account', type: 'address'},
    {name: 'destination', type: 'address'},
    {name: 'value', type: 'uint256'},
    {name: 'data', type: 'bytes'},
    {name: 'nonce', type: 'uint256'},
    {name: 'deadline', type: 'uint256'},
  ],
};

// For ERC20 transfer
const message = {
  account: userAddress,
  destination: tokenAddress,
  value: 0n,
  data: encodeFunctionData({
    abi: erc20Abi,
    functionName: 'transfer',
    args: [recipientAddress, amount],
  }),
  nonce: currentNonce,
  deadline: BigInt(Math.floor(Date.now() / 1000) + 300), // 5 min
};
```

## Error Handling

| Error                | User Message                            | Recovery                 |
|----------------------|-----------------------------------------|--------------------------|
| Backend unavailable  | "Relay service temporarily unavailable" | Show status, retry later |
| Signature rejected   | "Transaction cancelled"                 | Return to review         |
| Expired deadline     | "Quote expired, please try again"       | Refetch quote, retry     |
| Insufficient balance | "Insufficient balance"                  | Disable confirm button   |
| Invalid recipient    | "Invalid address format"                | Show inline validation   |
| Relay failed         | "Transaction failed: {reason}"          | Show error, allow retry  |

## Risks / Trade-offs

| Risk                         | Mitigation                                     |
|------------------------------|------------------------------------------------|
| Quote expires during signing | Show countdown, auto-refresh if expired        |
| Backend down                 | Show clear unavailable state, disable transfer |
| Nonce race condition         | Always fetch fresh nonce before signing        |
| User confusion about fees    | Clear fee breakdown, total display             |

## Open Questions

1. **Token selection**: Should the home page support multiple tokens or default to mantraUSD?
    - **Decision**: Default to mantraUSD, token selection in v2

2. **Fee payment**: Does the user need to have mantraUSD for fees, or is it deducted from transfer?
    - **Decision**: Fee is separate (user must have additional balance for fee)

3. **Deadline configuration**: Should users be able to set custom deadlines?
    - **Decision**: No, use fixed 5-minute deadline for simplicity
