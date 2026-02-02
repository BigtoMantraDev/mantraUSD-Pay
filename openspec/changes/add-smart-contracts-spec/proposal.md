# Change: Add Smart Contracts Specification

## Why

The mantraUSD-Pay system requires two core smart contracts for gasless payments:

1. **DelegatedAccount** - EIP-7702 implementation for temporary EOA delegation
2. **SessionRegistry** - Payment session management with dual fee support

This proposal documents the complete specifications for both contracts based on the PRD requirements.

## What Changes

### New Specifications

| Spec                 | Description                                          |
|----------------------|------------------------------------------------------|
| `delegated-account`  | EIP-7702 execution contract for gasless transactions |
| `session-registry`   | Payment session lifecycle and fee management         |

### Key Features

**DelegatedAccount.sol:**
- EIP-712 typed data signature verification
- Nonce management for replay protection
- Deadline enforcement for signature expiry
- Atomic execution with proper error handling
- EIP-1271 smart contract signature validation
- Stateless design (only nonce storage)

**SessionRegistry.sol:**
- Session creation with configurable duration (5 min - 24 hours)
- Dual fee model (customer + merchant fees)
- Session fulfillment with multi-party transfers
- Session cancellation by merchant
- Token whitelist management
- Fee configuration (rates, toggles, collector)
- Admin access control

### Non-Breaking Changes

- New contracts to be deployed
- No modifications to existing webapp or backend

## Impact

### Affected Code

- `packages/contracts/src/DelegatedAccount.sol` - New contract
- `packages/contracts/src/SessionRegistry.sol` - New contract
- `packages/contracts/src/interfaces/` - Contract interfaces
- `packages/contracts/test/` - Contract tests

### Dependencies

- Foundry toolchain for development
- OpenZeppelin contracts (SafeERC20, Ownable, ReentrancyGuard)
- EIP-7702 support on MANTRA Chain

## Security Considerations

| Contract         | Key Security Features                                    |
|------------------|----------------------------------------------------------|
| DelegatedAccount | Signature verification, nonce tracking, deadline checks  |
| SessionRegistry  | Access control, fee caps (5% max), token whitelist       |

## Out of Scope

- Frontend integration (separate proposal)
- Backend relay logic (covered in `add-backend-api`)
- Deployment scripts (implementation detail)
