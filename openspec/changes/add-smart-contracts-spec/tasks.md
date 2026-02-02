# Tasks: Add Smart Contracts Specification

## Overview

Implementation tasks for DelegatedAccount and SessionRegistry contracts.

---

## Phase 1: DelegatedAccount Contract

### 1.1 Core Implementation
- [ ] Create contract shell with EIP-7702 compatibility
- [ ] Implement EIP-712 domain separator with chainId
- [ ] Implement signature verification for execute()
- [ ] Add nonce management (mapping + getter)
- [ ] Add deadline enforcement with block.timestamp check
- [ ] Implement atomic execution with try/catch

### 1.2 Security Features
- [ ] Add destination address validation (non-zero, not self)
- [ ] Implement EIP-1271 smart contract signature support
- [ ] Add value transfer support with proper checks
- [ ] Emit execution events for off-chain tracking

### 1.3 Token Helper
- [ ] Implement transferToken() helper for ERC-20 transfers
- [ ] Use SafeERC20 for safe transfers
- [ ] Validate token addresses and amounts

---

## Phase 2: SessionRegistry Contract

### 2.1 Session Management
- [ ] Define Session struct (merchant, token, amounts, fees, status, timestamps)
- [ ] Implement createSession() with amount/duration validation
- [ ] Implement fulfillSession() with multi-party transfers
- [ ] Implement cancelSession() with merchant-only access
- [ ] Add session query functions (getSession, isSessionValid)

### 2.2 Fee Configuration
- [ ] Define FeeConfig struct (customerRate, merchantRate, collector, toggles)
- [ ] Implement setFeeConfig() with owner-only access
- [ ] Add rate validation (≤500 = 5% max)
- [ ] Implement calculateCustomerFee() and calculateMerchantFee()
- [ ] Add fee toggle functionality (enable/disable each fee type)

### 2.3 Token Whitelist
- [ ] Implement token whitelist mapping
- [ ] Add setTokenWhitelisted() with owner-only access
- [ ] Validate tokens on session creation
- [ ] Add isTokenWhitelisted() query function

### 2.4 Admin Functions
- [ ] Implement withdrawFees() for fee collector
- [ ] Add proper access control (Ownable)
- [ ] Emit events for all state changes

---

## Phase 3: Testing

### 3.1 DelegatedAccount Tests
- [ ] Test valid signature execution
- [ ] Test invalid signature rejection
- [ ] Test nonce replay protection
- [ ] Test deadline expiry rejection
- [ ] Test destination validation
- [ ] Test EIP-1271 contract signatures

### 3.2 SessionRegistry Tests
- [ ] Test session creation with valid params
- [ ] Test session fulfillment flow
- [ ] Test session cancellation by merchant
- [ ] Test fee calculation accuracy
- [ ] Test token whitelist enforcement
- [ ] Test admin access control
- [ ] Test edge cases (expired sessions, double fulfillment)

---

## Phase 4: Documentation

### 4.1 Contract Documentation
- [ ] NatSpec comments for all public functions
- [ ] Interface documentation
- [ ] Event documentation

### 4.2 Integration Guide
- [ ] Document EIP-712 signing format
- [ ] Document session creation flow
- [ ] Document fee calculation formulas
