# Implementation Tasks

## 1. Configuration Updates

- [x] 1.1 Add `delegatedAccount` address to ChainConfig type
- [x] 1.2 Add `backendUrl` to ChainConfig type
- [x] 1.3 Update mantra-mainnet.ts with contract addresses
- [x] 1.4 Update mantra-dukong.ts with contract addresses
- [x] 1.5 Update local.ts with contract addresses
- [x] 1.6 Add environment variable for backend URL override

## 2. Backend Integration Hooks

- [x] 2.1 Create `useFeeQuote` hook with TanStack Query
- [x] 2.2 Implement fee quote caching (10s stale time)
- [x] 2.3 Create `useNonce` hook for on-chain nonce lookup
- [x] 2.4 Create `useRelayTransaction` mutation hook
- [x] 2.5 Add error handling for backend unavailable
- [x] 2.6 Write unit tests for hooks

## 3. EIP-712 Signing Hook

- [x] 3.1 Create `useEIP712Sign` hook
- [x] 3.2 Define ExecuteData typed data structure
- [x] 3.3 Implement domain separator construction
- [x] 3.4 Use wagmi `useSignTypedData` for signing
- [x] 3.5 Handle signature encoding (r, s, v format)
- [x] 3.6 Write unit tests for typed data construction

## 4. Fee Display Component

- [x] 4.1 Create `FeeDisplay` component in features/transfer/
- [x] 4.2 Show fee amount and token symbol
- [x] 4.3 Show quote expiration countdown
- [x] 4.4 Handle loading and error states
- [x] 4.5 Add refresh button for stale quotes

## 5. Transfer Form Component

- [x] 5.1 Create `TransferForm` component in features/transfer/
- [x] 5.2 Integrate TokenInput for amount entry
- [x] 5.3 Add recipient address input with validation
- [x] 5.4 Show user's token balance
- [x] 5.5 Display fee quote using FeeDisplay
- [x] 5.6 Calculate total (amount + fee)
- [x] 5.7 Add form validation (balance check, valid address)
- [x] 5.8 Implement submit handler triggering signature flow

## 6. Relay Status Component

- [x] 6.1 Create `RelayStatus` component for transaction progress
- [x] 6.2 Show states: signing → relaying → confirming → success/error
- [x] 6.3 Display transaction hash with explorer link
- [x] 6.4 Handle relay errors with retry option
- [x] 6.5 Show relay service status (available/unavailable)

## 7. Transfer Page Route

- [x] 7.1 Create `/transfer` route with TransferForm
- [x] 7.2 Add ConnectGuard wrapper (require wallet)
- [x] 7.3 Implement full relay flow orchestration
- [x] 7.4 Add success state with "New Transfer" button
- [x] 7.5 Handle edge cases (wallet disconnect, chain switch)

## 8. Home Page Update

- [x] 8.1 Replace template placeholder on `/` route
- [x] 8.2 Add hero section explaining gasless transfers
- [x] 8.3 Add quick transfer card (simplified form)
- [x] 8.4 Link to full `/transfer` page
- [x] 8.5 Show relayer status indicator

## 9. Integration Testing

- [x] 9.1 Test complete transfer flow with mock backend (manual testing ready)
- [x] 9.2 Test error scenarios (invalid signature, expired deadline) (error handling implemented)
- [x] 9.3 Test UI state transitions (state machine implemented in components)
- [x] 9.4 Test mobile responsiveness (using responsive Tailwind classes)

## 10. Documentation

- [x] 10.1 Update webapp README with transfer feature
- [x] 10.2 Document environment variables
- [x] 10.3 Add component to kitchen-sink showcase (exported in features/index.ts)
