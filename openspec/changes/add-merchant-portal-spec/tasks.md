# Tasks: Add Merchant Portal Specification

## Overview

Implementation tasks for the merchant portal webapp.

---

## Phase 1: Package Setup

### 1.1 Initialize Package
- [ ] Create `packages/merchant-portal` directory structure
- [ ] Initialize package.json with `@mantrausd-pay/merchant-portal`
- [ ] Configure Vite for React 19 + TypeScript
- [ ] Set up TanStack Router with file-based routing
- [ ] Configure Tailwind CSS v4 with OMies preset
- [ ] Add Wagmi + AppKit configuration

### 1.2 Base Layout
- [ ] Create `__root.tsx` with Navbar and CartoonBackground
- [ ] Add WalletConnectPill to Navbar
- [ ] Add NetworkBanner for testnet indication
- [ ] Configure protected routes (require wallet connection)

---

## Phase 2: Hooks Implementation

### 2.1 useCreateSession Hook
- [ ] Implement POST to /sessions endpoint
- [ ] Handle loading, success, error states
- [ ] Return created session with payment URL
- [ ] Validate merchant address matches connected wallet

### 2.2 useMerchantSessions Hook
- [ ] Implement GET /sessions/merchant/:address
- [ ] Add pagination support (limit, offset)
- [ ] Add status filter parameter
- [ ] Implement polling with configurable interval
- [ ] Handle empty state (no sessions)

### 2.3 useSessionStats Hook
- [ ] Calculate today's payment count from sessions
- [ ] Calculate today's volume (sum of fulfilled amounts)
- [ ] Calculate active session count (pending + not expired)
- [ ] Derive stats from useMerchantSessions data

### 2.4 useCancelSession Hook
- [ ] Implement DELETE /sessions/:sessionId
- [ ] Verify session belongs to connected wallet
- [ ] Handle success/error states
- [ ] Trigger session list refetch on success

---

## Phase 3: Dashboard Components

### 3.1 Stats Cards
- [ ] Create StatsCard base component
- [ ] Create TodayPaymentsCard (count of fulfilled today)
- [ ] Create TodayVolumeCard (sum of amounts)
- [ ] Create ActiveSessionsCard (pending count)
- [ ] Add loading skeletons for stats

### 3.2 Active Sessions List
- [ ] Create ActiveSessionsList component
- [ ] Create SessionListItem with status badge
- [ ] Show amount, reference, created time
- [ ] Add "View QR" quick action
- [ ] Handle empty state

### 3.3 Recent Payments List
- [ ] Create RecentPaymentsList component
- [ ] Create PaymentListItem (fulfilled sessions)
- [ ] Show amount, payer address, timestamp
- [ ] Link to session detail
- [ ] Limit to 5 most recent

---

## Phase 4: Session Creation

### 4.1 Create Session Form
- [ ] Create CreateSessionForm component
- [ ] Add AmountInput with validation (> 0, 6 decimals max)
- [ ] Add ReferenceInput (optional, max 100 chars)
- [ ] Add DurationSelect with preset options
- [ ] Add submit button with loading state
- [ ] Display fee preview (customer + merchant fees)

### 4.2 Duration Options
- [ ] 5 minutes
- [ ] 15 minutes (default)
- [ ] 30 minutes
- [ ] 1 hour
- [ ] 24 hours

### 4.3 Session Created Modal
- [ ] Create modal showing success
- [ ] Display QR code prominently
- [ ] Show payment URL with copy button
- [ ] Add "Print QR" button
- [ ] Add "Create Another" action
- [ ] Add "View Session" action

---

## Phase 5: QR Code Display

### 5.1 QR Code Generator
- [ ] Add `qrcode` library to dependencies
- [ ] Create QRCodeDisplay component
- [ ] Generate QR from payment URL
- [ ] Support multiple sizes (modal, detail, print)
- [ ] Add high contrast / quiet zone

### 5.2 QR Code Actions
- [ ] Copy payment URL to clipboard
- [ ] Download QR as PNG
- [ ] Print QR (browser print with CSS)
- [ ] Share link (Web Share API if available)

---

## Phase 6: Session Detail View

### 6.1 Session Header
- [ ] Display session ID
- [ ] Show status badge (Pending, Fulfilled, Expired, Cancelled)
- [ ] Show countdown for pending sessions

### 6.2 Session Details
- [ ] Display amount (base + fees)
- [ ] Display reference (if set)
- [ ] Display created timestamp
- [ ] Display expiry timestamp
- [ ] Display payment token

### 6.3 Payment Information (Fulfilled)
- [ ] Display payer address
- [ ] Display transaction hash with explorer link
- [ ] Display payment timestamp
- [ ] Display amount merchant received

### 6.4 Session Actions
- [ ] Cancel button (pending only)
- [ ] Confirmation dialog for cancel
- [ ] Navigate back after cancel

---

## Phase 7: Payment History

### 7.1 History Filters
- [ ] Status filter (All, Fulfilled, Expired, Cancelled)
- [ ] Date range filter (Today, Week, Month, Custom)
- [ ] Reference search (optional)

### 7.2 Session Table
- [ ] Create responsive table component
- [ ] Columns: Reference/ID, Amount, Status, Date, Payer
- [ ] Sort by date (newest first)
- [ ] Pagination controls

### 7.3 Empty States
- [ ] No sessions ever created
- [ ] No sessions matching filter
- [ ] Call-to-action to create session

---

## Phase 8: Connect Guard

### 8.1 Wallet Requirement
- [ ] Create ConnectGuard HOC/component
- [ ] Redirect to connect prompt if no wallet
- [ ] Store intended destination for redirect after connect
- [ ] Handle wallet disconnection mid-session

### 8.2 Connect Prompt
- [ ] Full-page connect wallet prompt
- [ ] Explain merchant functionality requires wallet
- [ ] Include WalletConnectPill
- [ ] Network selection if needed

---

## Phase 9: Testing & Polish

### 9.1 Testing
- [ ] Unit tests for hooks
- [ ] Component tests for forms
- [ ] Integration tests for session creation flow
- [ ] E2E test for create → QR → view cycle

### 9.2 Polish
- [ ] Loading states for all async operations
- [ ] Error boundaries for route errors
- [ ] Mobile responsive layouts
- [ ] Print stylesheet for QR codes

### 9.3 Documentation
- [ ] Update hooks/index.ts exports
- [ ] Add JSDoc comments
- [ ] Create MERCHANT_GUIDE.md

---

## Dependencies

- **Blocks Phase 2+:** Backend API must be running
- **Blocks Phase 5:** QR code library must be installed
- **Parallelizable:** Phase 3, 4, 6, 7 components can be developed in parallel
- **Parallelizable:** Phase 2 hooks can be developed alongside Phase 3-7 (mock data)
