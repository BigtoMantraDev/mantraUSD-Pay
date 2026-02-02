# Design: Smart Contracts Architecture

## Overview

This document details the architecture and design decisions for the mantraUSD-Pay smart contracts.

---

## Contract Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     MANTRA Chain                                 │
│                                                                  │
│  ┌────────────────┐         ┌────────────────────────────────┐  │
│  │ Customer EOA   │         │      SessionRegistry           │  │
│  │ (with 7702     │         │                                │  │
│  │  delegation)   │         │  • Session storage             │  │
│  └───────┬────────┘         │  • Fee configuration           │  │
│          │                   │  • Token whitelist             │  │
│          │ execute()         │  • Multi-party transfers       │  │
│          ▼                   └───────────────┬────────────────┘  │
│  ┌────────────────┐                         │                   │
│  │DelegatedAccount│─────────────────────────┤                   │
│  │                │         fulfillSession()│                   │
│  │  • Sig verify  │                         │                   │
│  │  • Nonce mgmt  │                         ▼                   │
│  │  • Execute     │         ┌────────────────────────────────┐  │
│  └────────────────┘         │         mantraUSD              │  │
│                              │      (ERC-20 Token)            │  │
│                              └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## DelegatedAccount Contract

### Design Philosophy

The DelegatedAccount follows a **stateless execution model** where:
- Only nonces are stored on-chain
- All execution parameters come from signed messages
- The contract acts as a "smart execution layer" for EOAs

### EIP-7702 Integration

```
┌─────────────────────────────────────────────────────────────┐
│                   EIP-7702 Flow                             │
│                                                             │
│  1. Customer signs EIP-712 message (off-chain)              │
│  2. Backend creates Type 4 tx with delegation               │
│  3. EOA temporarily delegates to DelegatedAccount           │
│  4. execute() called in customer's context                  │
│  5. Delegation revoked after tx                             │
└─────────────────────────────────────────────────────────────┘
```

### EIP-712 Type Structure

```solidity
struct ExecuteData {
    address destination;    // Target contract (SessionRegistry)
    uint256 value;          // ETH value (usually 0)
    bytes data;             // Encoded function call
    uint256 nonce;          // Replay protection
    uint256 deadline;       // Signature expiry timestamp
}

bytes32 constant EXECUTE_TYPEHASH = keccak256(
    "ExecuteData(address destination,uint256 value,bytes data,uint256 nonce,uint256 deadline)"
);
```

### Security Model

| Protection          | Mechanism                                    |
|---------------------|----------------------------------------------|
| Replay Prevention   | Nonce incremented on each execution          |
| Signature Expiry    | Deadline checked against block.timestamp     |
| Invalid Target      | Destination cannot be zero or self           |
| Signature Validity  | ECDSA + EIP-1271 for contract wallets        |

---

## SessionRegistry Contract

### Design Philosophy

The SessionRegistry implements a **pull payment model** where:
- Merchant creates session with expected payment amount
- Customer fulfills session (triggers transfer via delegation)
- Fees are calculated and collected atomically

### Session Lifecycle

```
┌──────────────┐    create     ┌──────────────┐    fulfill    ┌──────────────┐
│              │──────────────▶│              │──────────────▶│              │
│   (none)     │               │   PENDING    │               │  FULFILLED   │
│              │               │              │               │              │
└──────────────┘               └──────┬───────┘               └──────────────┘
                                      │
                                      │ cancel/expire
                                      ▼
                               ┌──────────────┐
                               │              │
                               │  CANCELLED   │
                               │              │
                               └──────────────┘
```

### Session Data Structure

```solidity
struct Session {
    address merchant;           // Payment recipient
    address token;              // Payment token (mantraUSD)
    uint256 baseAmount;         // Base payment amount
    uint256 customerFeeAmount;  // Pre-calculated customer fee
    uint256 merchantFeeAmount;  // Pre-calculated merchant fee
    SessionStatus status;       // PENDING, FULFILLED, CANCELLED
    uint256 createdAt;          // Creation timestamp
    uint256 expiresAt;          // Expiration timestamp
}
```

### Fee Model

```
┌─────────────────────────────────────────────────────────────────┐
│                     Payment Flow                                 │
│                                                                  │
│  Customer pays: baseAmount + customerFee                         │
│                                                                  │
│  Distribution:                                                   │
│  ├─▶ Merchant receives: baseAmount - merchantFee                │
│  └─▶ Fee Collector receives: customerFee + merchantFee          │
│                                                                  │
│  Fee Calculation:                                                │
│  • customerFee = baseAmount * customerFeeRate / 10000           │
│  • merchantFee = baseAmount * merchantFeeRate / 10000           │
│  • Max rate: 500 (5%)                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Fee Configuration

```solidity
struct FeeConfig {
    uint16 customerFeeRate;    // Rate in basis points (0-500)
    uint16 merchantFeeRate;    // Rate in basis points (0-500)
    address feeCollector;      // Address receiving fees
    bool customerFeeEnabled;   // Toggle customer fee
    bool merchantFeeEnabled;   // Toggle merchant fee
}
```

### Access Control

| Function              | Access                 | Rationale                    |
|-----------------------|------------------------|------------------------------|
| createSession         | Anyone                 | Merchant-initiated           |
| fulfillSession        | Anyone (customer)      | Requires valid signature     |
| cancelSession         | Session merchant only  | Merchant control             |
| setFeeConfig          | Owner only             | Admin operation              |
| setTokenWhitelisted   | Owner only             | Admin operation              |
| withdrawFees          | Fee collector only     | Fee management               |

---

## Integration Points

### Backend Relay Service

The relay service interacts with both contracts:

```
┌─────────────────────────────────────────────────────────────┐
│                   Relay Service Flow                        │
│                                                             │
│  1. POST /sessions                                          │
│     → Call SessionRegistry.createSession()                  │
│     → Return sessionId to merchant                          │
│                                                             │
│  2. POST /sessions/:id/pay                                  │
│     → Verify customer signature                             │
│     → Create Type 4 tx with:                                │
│       - EIP-7702 delegation to DelegatedAccount             │
│       - Call execute() with fulfillSession() payload        │
│     → Broadcast and return txHash                           │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Webapp

The webapp interacts via backend API:

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend Flow                             │
│                                                             │
│  Merchant:                                                  │
│  1. Configure payment amount                                │
│  2. Call backend API to create session                      │
│  3. Display QR code with sessionId                          │
│                                                             │
│  Customer:                                                  │
│  1. Scan QR code                                            │
│  2. Review payment details                                  │
│  3. Sign EIP-712 message (wallet)                           │
│  4. Backend relays transaction                              │
│  5. Display success/failure                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Gas Considerations

| Operation          | Estimated Gas | Paid By      |
|--------------------|---------------|--------------|
| createSession      | ~150,000      | Merchant     |
| fulfillSession     | ~200,000      | Relay        |
| cancelSession      | ~50,000       | Merchant     |

The relay service covers gas for `fulfillSession` as part of the gasless experience for customers.

---

## Upgrade Path

These contracts are designed to be **immutable** after deployment:

- No proxy pattern (simplicity and security)
- Version changes require new deployment
- SessionRegistry tracks contract version for compatibility
- Frontend/backend can support multiple registry versions if needed
