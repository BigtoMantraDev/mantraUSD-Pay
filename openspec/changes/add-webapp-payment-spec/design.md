# Design: Webapp Payment Architecture

## Context

The customer payment webapp is the primary user-facing application for mantraUSD-Pay. Customers scan QR codes and complete gasless payments through this webapp.

**Background:**
- Built on OMies dApp template (React 19, Vite, TanStack Router)
- Uses existing component library (TransactionDialog, WalletConnectPill, etc.)
- Integrates with backend API for session management and relay
- Must support EIP-7702 gasless payment flow

**Constraints:**
- Must work on mobile (primary use case is scanning QR codes)
- No gas required from users (signature only)
- Fee quote expires quickly (60s TTL)
- Must handle wallet connection across multiple providers

**Stakeholders:**
- End users (customers making payments)
- Merchants (indirectly, as session creators)
- Backend team (API consumers)

## Goals / Non-Goals

**Goals:**
- Provide seamless gasless payment experience
- Clear fee transparency before signing
- Handle all error states gracefully
- Support session expiry and polling
- Mobile-first responsive design

**Non-Goals:**
- Merchant functionality (separate portal)
- Multiple token support (mantraUSD only)
- Payment history for customers (stateless)
- Push notifications

## Decisions

### Decision 1: TanStack Router Dynamic Route

**What:** Use `/pay/$sessionId` with file-based routing

**Why:**
- Follows TanStack Router conventions
- Type-safe route params
- Loader pattern for data fetching
- Clean URL structure matching PRD

**Trade-offs:**
- Requires chainId as query param (not in path)
- **Mitigation:** Query param validated in loader, default to configured chain

### Decision 2: Payment State Machine

**What:** Implement explicit state machine for payment flow

```
Loading → SessionError (invalid/expired)
Loading → WalletPrompt (valid session, not connected)
WalletPrompt → PaymentReview (connected)
PaymentReview → Signing (user clicks Pay)
Signing → Processing (signature received)
Processing → Success (tx confirmed)
Processing → Error (tx failed)
Signing → PaymentReview (user rejected)
```

**Why:**
- Clear state transitions
- Easier to test each state
- Prevents invalid UI combinations
- Matches PRD state diagram

**Alternatives considered:**
- Ad-hoc boolean flags - Harder to reason about
- Redux/Zustand - Overkill for single-page flow

### Decision 3: Hooks Architecture

**What:** Three specialized hooks instead of one monolithic hook

| Hook                | Responsibility                           |
|---------------------|------------------------------------------|
| `usePaymentSession` | Session fetch, polling, expiry countdown |
| `useEIP712Sign`     | Build typed data, request signature      |
| `useRelayPayment`   | Submit to backend, track tx status       |

**Why:**
- Single responsibility principle
- Easier to test individually
- Can be composed in page component
- Reusable for other flows if needed

**Trade-offs:**
- More files to maintain
- **Mitigation:** Clear interfaces between hooks

### Decision 4: Optimistic Polling with WebSocket Fallback

**What:** Poll session status every 2 seconds during processing, with optional WebSocket upgrade

**Why:**
- Simple to implement
- Works across all browsers
- WebSocket optional for real-time updates

**Alternatives considered:**
- SSE (Server-Sent Events) - Less browser support
- Pure WebSocket - More complex, not needed for MVP
- Long polling - More complex than short polling

**Trade-offs:**
- Slightly delayed feedback (up to 2s)
- **Mitigation:** Acceptable for payment confirmation

### Decision 5: Fee Quote Refresh UI

**What:** Show countdown timer for fee quote, auto-refresh when expired

**Why:**
- Dynamic customer fee requires fresh quotes
- Users understand time-limited pricing (like Uber)
- Prevents signing with stale fees

**Implementation:**
- Display "Quote expires in Xs" countdown
- Auto-fetch new quote when timer hits 0
- Show "Updating fee..." during refresh
- Require user acknowledgment if fee changed significantly (>10%)

### Decision 6: Component Folder Structure

**What:** Group payment components under `components/features/payment/`

```
components/features/payment/
├── PaymentPage.tsx         # Main container (state machine)
├── PaymentLoading.tsx      # Skeleton UI
├── PaymentReview.tsx       # Amount, merchant, fee breakdown
├── PaymentSigning.tsx      # Signing in progress
├── PaymentProcessing.tsx   # Transaction in progress
├── PaymentSuccess.tsx      # Success with tx link
├── PaymentError.tsx        # Error with retry
├── SessionExpired.tsx      # Expired state
├── InsufficientBalance.tsx # Balance warning
└── index.ts                # Exports
```

**Why:**
- Co-located payment logic
- Easy to find all payment-related components
- Follows existing features folder pattern

## Component Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    /pay/$sessionId Route                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   PaymentPage.tsx                         │  │
│  │                  (State Machine)                          │  │
│  │                                                           │  │
│  │   ┌─────────────┐     ┌─────────────┐                    │  │
│  │   │usePayment   │     │useEIP712    │                    │  │
│  │   │Session      │     │Sign         │                    │  │
│  │   └──────┬──────┘     └──────┬──────┘                    │  │
│  │          │                   │                            │  │
│  │          ▼                   ▼                            │  │
│  │   ┌─────────────┐     ┌─────────────┐     ┌────────────┐ │  │
│  │   │Session Data │     │Signature    │     │useRelay    │ │  │
│  │   │+ Fee Quote  │     │             │────▶│Payment     │ │  │
│  │   └─────────────┘     └─────────────┘     └────────────┘ │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│              ┌───────────────┼───────────────┐                  │
│              ▼               ▼               ▼                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │PaymentReview │  │PaymentSigning│  │PaymentSuccess│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Payment Data Flow                           │
│                                                                  │
│  1. Route Load                                                  │
│     └─▶ Validate sessionId + chainId                           │
│     └─▶ Fetch session from backend                              │
│                                                                  │
│  2. Session Response                                            │
│     └─▶ amount, merchant, token, fees                          │
│     └─▶ feeQuoteExpiresAt (countdown)                          │
│     └─▶ expiresAt (session expiry)                             │
│                                                                  │
│  3. User Signs                                                  │
│     └─▶ Build EIP-712 typed data                               │
│     └─▶ Call wallet signTypedData                              │
│     └─▶ Receive signature                                       │
│                                                                  │
│  4. Relay Submission                                            │
│     └─▶ POST /relay with signature + session                   │
│     └─▶ Backend creates EIP-7702 tx                            │
│     └─▶ Returns txHash                                          │
│                                                                  │
│  5. Confirmation                                                │
│     └─▶ Poll session status                                     │
│     └─▶ Display success with explorer link                     │
└─────────────────────────────────────────────────────────────────┘
```

## Risks / Trade-offs

### Risk: Mobile Wallet Deep Linking

**Risk:** Different wallets have different deep link behaviors
**Mitigation:** 
- Use AppKit for standardized WalletConnect integration
- Test with major wallets (MetaMask, Rainbow, Trust)
- Provide fallback QR for desktop

### Risk: Fee Quote Expiry During Signing

**Risk:** Fee quote expires while user is in wallet signing
**Mitigation:**
- Use deadline in EIP-712 signature matching quote expiry
- If signature deadline passed, prompt for new signature
- Backend validates quote wasn't expired at sign time

### Risk: Network Switching

**Risk:** User connected to wrong network
**Mitigation:**
- Validate chainId on route load
- Show NetworkBanner for wrong network
- Prompt network switch before payment review

### Risk: Session Fulfilled While Viewing

**Risk:** Another party fulfills session while customer is reviewing
**Mitigation:**
- Poll session status during review
- Immediately show "Already Paid" if status changes
- Prevent duplicate payment attempts

## Open Questions

1. **Q:** Should we support deep linking to specific wallets?
   **A:** Start with AppKit universal modal, add wallet-specific links if needed.

2. **Q:** How to handle partial connectivity (backend up, RPC down)?
   **A:** Backend handles RPC; if backend is up, payment should work. Show error if backend unreachable.

3. **Q:** Should payment review show OM equivalent of fees?
   **A:** MVP shows mantraUSD only. Add fiat/OM conversion in future enhancement.

4. **Q:** Offline support / PWA?
   **A:** Not for MVP. Payment requires network. Add PWA manifest for "Add to Home Screen" experience only.
