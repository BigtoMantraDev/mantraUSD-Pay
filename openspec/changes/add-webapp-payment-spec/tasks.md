# Tasks: Add Webapp Payment Specification

## Overview

Implementation tasks for customer payment webapp features.

---

## Phase 1: Payment Route Setup

### 1.1 Route Structure
- [ ] Create `routes/pay/$sessionId.tsx` with TanStack Router
- [ ] Implement route loader for chainId query param validation
- [ ] Add route error boundary for invalid sessions
- [ ] Configure route metadata (title, description)

### 1.2 Page Container
- [ ] Create `PaymentPage.tsx` state machine container
- [ ] Implement state transitions (Loading → Review → Signing → Processing → Complete)
- [ ] Add wallet connection detection
- [ ] Add network validation with NetworkBanner

---

## Phase 2: Payment Hooks

### 2.1 usePaymentSession Hook
- [ ] Implement session fetch from backend API
- [ ] Add polling for session status updates
- [ ] Implement session expiry countdown
- [ ] Add fee quote expiry tracking
- [ ] Handle session not found / invalid states
- [ ] Return loading, error, data states

### 2.2 useEIP712Sign Hook
- [ ] Build EIP-712 domain separator with chainId
- [ ] Construct typed data for payment authorization
- [ ] Integrate with wagmi signTypedData
- [ ] Handle user rejection gracefully
- [ ] Return signing state and trigger function

### 2.3 useRelayPayment Hook
- [ ] Implement POST to /relay endpoint
- [ ] Handle response (txHash, error)
- [ ] Add transaction status polling
- [ ] Return submission state and trigger function

---

## Phase 3: Payment Components

### 3.1 Loading & Error States
- [ ] Create PaymentLoading with skeleton UI
- [ ] Create SessionExpired component
- [ ] Create SessionNotFound component
- [ ] Create PaymentAlreadyComplete component

### 3.2 Wallet Connection
- [ ] Create ConnectWalletPrompt component
- [ ] Integrate existing WalletConnectPill
- [ ] Handle connection state changes

### 3.3 Payment Review
- [ ] Create PaymentReview component
- [ ] Display merchant address with AddressDisplay
- [ ] Display payment amount with BalanceDisplay
- [ ] Show fee breakdown (customer fee, merchant receives)
- [ ] Add fee quote countdown timer
- [ ] Handle fee quote refresh
- [ ] Show session expiry countdown
- [ ] Implement Pay button

### 3.4 Balance Validation
- [ ] Create InsufficientBalance component
- [ ] Check user balance vs required amount
- [ ] Disable Pay button when insufficient

### 3.5 Signing State
- [ ] Create PaymentSigning component
- [ ] Show "Waiting for signature..." message
- [ ] Handle wallet popup indication

### 3.6 Processing State
- [ ] Create PaymentProcessing component
- [ ] Show transaction hash when available
- [ ] Display processing spinner
- [ ] Poll for confirmation

### 3.7 Success State
- [ ] Create PaymentSuccess component
- [ ] Show confirmation message
- [ ] Display transaction explorer link
- [ ] Show payment summary

### 3.8 Error State
- [ ] Create PaymentError component
- [ ] Display error message
- [ ] Provide retry option
- [ ] Link to support if needed

---

## Phase 4: Integration

### 4.1 API Integration
- [ ] Configure API base URL from config
- [ ] Add error handling for network failures
- [ ] Implement request/response types

### 4.2 Styling
- [ ] Apply OMies design system
- [ ] Ensure mobile responsiveness
- [ ] Test on various screen sizes

### 4.3 Testing
- [ ] Unit tests for payment hooks
- [ ] Component tests for payment states
- [ ] Integration tests for full flow
- [ ] Mobile browser testing

---

## Phase 5: Kitchen Sink & Documentation

### 5.1 Component Showcase
- [ ] Add payment components to /kitchen-sink route
- [ ] Show all payment states (mock data)
- [ ] Document component props

### 5.2 Documentation
- [ ] Update hooks/index.ts exports
- [ ] Add JSDoc comments to hooks
- [ ] Document payment flow in README

---

## Dependencies

- **Blocks Phase 2-3:** Backend API must be available for session fetching
- **Blocks Phase 4:** All components must be complete before integration testing
- **Parallelizable:** Phase 2.1, 2.2, 2.3 can be developed in parallel
- **Parallelizable:** Phase 3.1-3.8 components can be developed in parallel
