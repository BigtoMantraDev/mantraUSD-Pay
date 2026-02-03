# Change: Add Webapp Payment Specification

## Why

The mantraUSD-Pay customer webapp needs comprehensive specifications for the payment flow. Based on PRD Section 7, the webapp must support:

1. **Payment Route** - `/pay/{sessionId}?chainId={chainId}` for processing payments
2. **Payment Hooks** - Hooks for session fetching, EIP-712 signing, and relay submission
3. **Payment Components** - UI states for the complete payment journey
4. **State Machine** - Clear transitions between loading, signing, processing, and completion states

This proposal documents the customer payment webapp specifications to ensure consistent implementation.

## What Changes

### New Specifications

| Spec                  | Description                                           |
|-----------------------|-------------------------------------------------------|
| `payment-flow`        | Route structure, state machine, and navigation logic  |
| `payment-hooks`       | React hooks for session, signing, and relay           |
| `payment-components`  | UI components for all payment states                  |

### Key Features

**Payment Flow:**
- Route `/pay/:sessionId` with chainId query parameter
- State machine: Loading → Connected → Signing → Processing → Success/Error
- Session expiry handling with countdown timer
- Automatic status polling for fulfillment detection

**Payment Hooks:**
- `usePaymentSession(sessionId, chainId)` - Fetch and poll session
- `useEIP712Sign(chainId)` - Build typed data and request signature
- `useRelayPayment()` - Submit signed intent to backend relay

**Payment Components:**
- PaymentLoading, SessionExpired, PaymentAlreadyComplete
- ConnectWalletPrompt, InsufficientBalance
- PaymentConfirm (with fee breakdown)
- SigningPrompt, ProcessingPayment
- PaymentSuccess, PaymentError

### Non-Breaking Changes

- Builds on existing common components (TransactionDialog, WalletConnectPill, etc.)
- Uses existing config infrastructure (useAppConfig, CHAIN_CONFIGS)
- Follows established OMies design system

## Impact

### Affected Code

- `packages/webapp/src/routes/pay/$sessionId.tsx` - New route
- `packages/webapp/src/hooks/usePaymentSession.ts` - New hook
- `packages/webapp/src/hooks/useEIP712Sign.ts` - New hook
- `packages/webapp/src/hooks/useRelayPayment.ts` - New hook
- `packages/webapp/src/components/features/payment/` - New component folder

### Dependencies

- Backend API must be available (`add-backend-api` spec)
- Config package for chain/contract configuration (`add-config-package-spec`)

## Out of Scope

- Merchant portal (separate proposal)
- Backend implementation (covered in `add-backend-api`)
- Smart contract logic (covered in `add-smart-contracts-spec`)
