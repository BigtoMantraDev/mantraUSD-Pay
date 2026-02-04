# Implementation Tasks

## 1. Configuration Updates

- [ ] 1.1 Add `delegatedAccount` address to ChainConfig type
- [ ] 1.2 Add `backendUrl` to ChainConfig type
- [ ] 1.3 Update mantra-mainnet.ts with contract addresses
- [ ] 1.4 Update mantra-dukong.ts with contract addresses
- [ ] 1.5 Update local.ts with contract addresses
- [ ] 1.6 Add environment variable for backend URL override

## 2. Backend Integration Hooks

- [ ] 2.1 Create `useFeeQuote` hook with TanStack Query
- [ ] 2.2 Implement fee quote caching (10s stale time)
- [ ] 2.3 Create `useNonce` hook for on-chain nonce lookup
- [ ] 2.4 Create `useRelayTransaction` mutation hook
- [ ] 2.5 Add error handling for backend unavailable
- [ ] 2.6 Write unit tests for hooks

## 3. EIP-712 Signing Hook

- [ ] 3.1 Create `useEIP712Sign` hook
- [ ] 3.2 Define ExecuteData typed data structure
- [ ] 3.3 Implement domain separator construction
- [ ] 3.4 Use wagmi `useSignTypedData` for signing
- [ ] 3.5 Handle signature encoding (r, s, v format)
- [ ] 3.6 Write unit tests for typed data construction

## 4. Fee Display Component

- [ ] 4.1 Create `FeeDisplay` component in features/transfer/
- [ ] 4.2 Show fee amount and token symbol
- [ ] 4.3 Show quote expiration countdown
- [ ] 4.4 Handle loading and error states
- [ ] 4.5 Add refresh button for stale quotes

## 5. Transfer Form Component

- [ ] 5.1 Create `TransferForm` component in features/transfer/
- [ ] 5.2 Integrate TokenInput for amount entry
- [ ] 5.3 Add recipient address input with validation
- [ ] 5.4 Show user's token balance
- [ ] 5.5 Display fee quote using FeeDisplay
- [ ] 5.6 Calculate total (amount + fee)
- [ ] 5.7 Add form validation (balance check, valid address)
- [ ] 5.8 Implement submit handler triggering signature flow

## 6. Relay Status Component

- [ ] 6.1 Create `RelayStatus` component for transaction progress
- [ ] 6.2 Show states: signing → relaying → confirming → success/error
- [ ] 6.3 Display transaction hash with explorer link
- [ ] 6.4 Handle relay errors with retry option
- [ ] 6.5 Show relay service status (available/unavailable)

## 7. Transfer Page Route

- [ ] 7.1 Create `/transfer` route with TransferForm
- [ ] 7.2 Add ConnectGuard wrapper (require wallet)
- [ ] 7.3 Implement full relay flow orchestration
- [ ] 7.4 Add success state with "New Transfer" button
- [ ] 7.5 Handle edge cases (wallet disconnect, chain switch)

## 8. Home Page Update

- [ ] 8.1 Replace template placeholder on `/` route
- [ ] 8.2 Add hero section explaining gasless transfers
- [ ] 8.3 Add quick transfer card (simplified form)
- [ ] 8.4 Link to full `/transfer` page
- [ ] 8.5 Show relayer status indicator

## 9. Integration Testing

- [ ] 9.1 Test complete transfer flow with mock backend
- [ ] 9.2 Test error scenarios (invalid signature, expired deadline)
- [ ] 9.3 Test UI state transitions
- [ ] 9.4 Test mobile responsiveness

## 10. Documentation

- [ ] 10.1 Update webapp README with transfer feature
- [ ] 10.2 Document environment variables
- [ ] 10.3 Add component to kitchen-sink showcase
