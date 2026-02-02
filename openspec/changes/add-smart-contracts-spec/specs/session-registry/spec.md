# Spec: SessionRegistry

> Payment session management contract with dual fee model for gasless scan-to-pay.

## Overview

The SessionRegistry contract manages payment sessions between merchants and customers. It handles session lifecycle (creation, fulfillment, cancellation), fee calculation and collection, and token whitelist management.

## Dependencies

- OpenZeppelin SafeERC20 for secure token transfers
- OpenZeppelin Ownable for admin access control
- OpenZeppelin ReentrancyGuard for reentrancy protection

---

## ADDED Requirements

### Requirement: Session Creation

The contract MUST allow merchants to create payment sessions.

#### Scenario: Create valid session

- Given a whitelisted token and valid amount
- When `createSession(token, amount, duration)` is called
- Then a new session MUST be created with status PENDING
- And the sessionId MUST be returned
- And the `SessionCreated` event MUST be emitted

#### Scenario: Calculate fees on creation

- Given the current fee configuration
- When a session is created with baseAmount
- Then customerFeeAmount MUST be calculated as `baseAmount * customerFeeRate / 10000`
- And merchantFeeAmount MUST be calculated as `baseAmount * merchantFeeRate / 10000`
- And these values MUST be stored in the session

#### Scenario: Invalid duration - too short

- Given a duration less than 5 minutes (300 seconds)
- When `createSession()` is called
- Then the transaction MUST revert with "Duration too short"

#### Scenario: Invalid duration - too long

- Given a duration greater than 24 hours (86400 seconds)
- When `createSession()` is called
- Then the transaction MUST revert with "Duration too long"

#### Scenario: Non-whitelisted token

- Given a token that is not whitelisted
- When `createSession()` is called
- Then the transaction MUST revert with "Token not whitelisted"

#### Scenario: Zero amount

- Given amount = 0
- When `createSession()` is called
- Then the transaction MUST revert with "Invalid amount"

---

### Requirement: Session Fulfillment

The contract MUST allow sessions to be fulfilled with proper fund distribution.

#### Scenario: Successful fulfillment

- Given a PENDING session that has not expired
- And the customer has approved sufficient tokens
- When `fulfillSession(sessionId, customer)` is called
- Then the session status MUST change to FULFILLED
- And tokens MUST be transferred according to fee model
- And the `SessionFulfilled` event MUST be emitted

#### Scenario: Token distribution

- Given a session with:
  - baseAmount = 100
  - customerFeeAmount = 2
  - merchantFeeAmount = 1
- When the session is fulfilled
- Then customer pays: 100 + 2 = 102 tokens
- And merchant receives: 100 - 1 = 99 tokens
- And fee collector receives: 2 + 1 = 3 tokens

#### Scenario: Fulfill expired session

- Given a session where `block.timestamp > expiresAt`
- When `fulfillSession()` is called
- Then the transaction MUST revert with "Session expired"

#### Scenario: Fulfill non-pending session

- Given a session with status FULFILLED or CANCELLED
- When `fulfillSession()` is called
- Then the transaction MUST revert with "Session not pending"

#### Scenario: Fulfill non-existent session

- Given a sessionId that does not exist
- When `fulfillSession()` is called
- Then the transaction MUST revert with "Session not found"

---

### Requirement: Session Cancellation

The contract MUST allow merchants to cancel their pending sessions.

#### Scenario: Merchant cancels session

- Given a PENDING session created by merchant A
- When merchant A calls `cancelSession(sessionId)`
- Then the session status MUST change to CANCELLED
- And the `SessionCancelled` event MUST be emitted

#### Scenario: Non-merchant attempts cancellation

- Given a session created by merchant A
- When merchant B calls `cancelSession(sessionId)`
- Then the transaction MUST revert with "Not session merchant"

#### Scenario: Cancel non-pending session

- Given a session with status FULFILLED
- When `cancelSession()` is called
- Then the transaction MUST revert with "Session not pending"

---

### Requirement: Session Expiration

The contract MUST enforce session expiration.

#### Scenario: Session expires automatically

- Given a session created at time T with duration D
- When `block.timestamp > T + D`
- Then the session MUST be considered expired
- And `isSessionValid()` MUST return false
- And fulfillment attempts MUST fail

#### Scenario: Check session validity

- Given a PENDING session that has not expired
- When `isSessionValid(sessionId)` is called
- Then it MUST return true

#### Scenario: Expired session validity

- Given a PENDING session that has expired
- When `isSessionValid(sessionId)` is called
- Then it MUST return false

---

### Requirement: Fee Configuration

The contract MUST allow the owner to configure fees.

#### Scenario: Set fee config

- Given the contract owner
- When `setFeeConfig(customerRate, merchantRate, collector, customerEnabled, merchantEnabled)` is called
- Then the fee configuration MUST be updated
- And the `FeeConfigUpdated` event MUST be emitted

#### Scenario: Rate exceeds maximum

- Given a customerFeeRate or merchantFeeRate > 500 (5%)
- When `setFeeConfig()` is called
- Then the transaction MUST revert with "Fee rate too high"

#### Scenario: Invalid fee collector

- Given feeCollector = address(0)
- When `setFeeConfig()` is called
- Then the transaction MUST revert with "Invalid fee collector"

#### Scenario: Non-owner attempts configuration

- Given a non-owner address
- When `setFeeConfig()` is called
- Then the transaction MUST revert with "Ownable: caller is not the owner"

#### Scenario: Disable customer fee

- Given customerFeeEnabled = false in config
- When calculating fees for a session
- Then customerFeeAmount MUST be 0

#### Scenario: Disable merchant fee

- Given merchantFeeEnabled = false in config
- When calculating fees for a session
- Then merchantFeeAmount MUST be 0

---

### Requirement: Token Whitelist

The contract MUST maintain a whitelist of allowed payment tokens.

#### Scenario: Add token to whitelist

- Given the contract owner
- When `setTokenWhitelisted(token, true)` is called
- Then the token MUST be whitelisted
- And the `TokenWhitelistUpdated` event MUST be emitted

#### Scenario: Remove token from whitelist

- Given a whitelisted token
- When `setTokenWhitelisted(token, false)` is called
- Then the token MUST be removed from whitelist

#### Scenario: Check whitelist status

- Given any token address
- When `isTokenWhitelisted(token)` is called
- Then the whitelist status MUST be returned

#### Scenario: Non-owner whitelist modification

- Given a non-owner address
- When `setTokenWhitelisted()` is called
- Then the transaction MUST revert

---

### Requirement: Fee Calculation

The contract MUST provide fee calculation functions.

#### Scenario: Calculate customer fee

- Given a baseAmount and current fee config
- When `calculateCustomerFee(baseAmount)` is called
- Then the customer fee MUST be returned
- As: `baseAmount * customerFeeRate / 10000` (if enabled, else 0)

#### Scenario: Calculate merchant fee

- Given a baseAmount and current fee config
- When `calculateMerchantFee(baseAmount)` is called
- Then the merchant fee MUST be returned
- As: `baseAmount * merchantFeeRate / 10000` (if enabled, else 0)

#### Scenario: Calculate total customer payment

- Given a baseAmount
- When `calculateTotalPayment(baseAmount)` is called
- Then the total MUST be `baseAmount + customerFee`

---

### Requirement: Session Query Functions

The contract MUST provide functions to query session data.

#### Scenario: Get session details

- Given a valid sessionId
- When `getSession(sessionId)` is called
- Then all session data MUST be returned:
  - merchant, token, baseAmount
  - customerFeeAmount, merchantFeeAmount
  - status, createdAt, expiresAt

#### Scenario: Get non-existent session

- Given an invalid sessionId
- When `getSession(sessionId)` is called
- Then default/zero values MUST be returned
- Or the transaction MAY revert with "Session not found"

#### Scenario: Get session count

- When `getSessionCount()` is called
- Then the total number of sessions MUST be returned

---

### Requirement: Fee Withdrawal

The contract MUST allow collected fees to be withdrawn.

#### Scenario: Withdraw accumulated fees

- Given accumulated fees in the contract
- When `withdrawFees(token, amount)` is called by fee collector
- Then tokens MUST be transferred to the fee collector
- And the `FeesWithdrawn` event MUST be emitted

#### Scenario: Non-collector withdrawal attempt

- Given a non-fee-collector address
- When `withdrawFees()` is called
- Then the transaction MUST revert with "Not fee collector"

#### Scenario: Insufficient balance

- Given a withdrawal amount exceeding contract balance
- When `withdrawFees()` is called
- Then the transaction MUST revert

---

### Requirement: Events

The contract MUST emit events for all significant state changes.

#### Event: SessionCreated

```solidity
event SessionCreated(
    uint256 indexed sessionId,
    address indexed merchant,
    address indexed token,
    uint256 baseAmount,
    uint256 customerFeeAmount,
    uint256 merchantFeeAmount,
    uint256 expiresAt
);
```

#### Event: SessionFulfilled

```solidity
event SessionFulfilled(
    uint256 indexed sessionId,
    address indexed customer,
    uint256 merchantAmount,
    uint256 feeAmount
);
```

#### Event: SessionCancelled

```solidity
event SessionCancelled(
    uint256 indexed sessionId
);
```

#### Event: FeeConfigUpdated

```solidity
event FeeConfigUpdated(
    uint16 customerFeeRate,
    uint16 merchantFeeRate,
    address feeCollector,
    bool customerFeeEnabled,
    bool merchantFeeEnabled
);
```

#### Event: TokenWhitelistUpdated

```solidity
event TokenWhitelistUpdated(
    address indexed token,
    bool whitelisted
);
```

#### Event: FeesWithdrawn

```solidity
event FeesWithdrawn(
    address indexed token,
    address indexed to,
    uint256 amount
);
```

---

### Requirement: Access Control

The contract MUST implement proper access control.

#### Scenario: Owner-only functions

- The following functions MUST be restricted to owner:
  - `setFeeConfig()`
  - `setTokenWhitelisted()`

#### Scenario: Merchant-only functions

- The following functions MUST be restricted to session merchant:
  - `cancelSession()`

#### Scenario: Fee collector functions

- The following functions MUST be restricted to fee collector:
  - `withdrawFees()`

---

## Interface

```solidity
interface ISessionRegistry {
    // Session Management
    function createSession(
        address token,
        uint256 amount,
        uint256 duration
    ) external returns (uint256 sessionId);

    function fulfillSession(
        uint256 sessionId,
        address customer
    ) external;

    function cancelSession(uint256 sessionId) external;

    // Queries
    function getSession(uint256 sessionId) external view returns (Session memory);
    function isSessionValid(uint256 sessionId) external view returns (bool);
    function getSessionCount() external view returns (uint256);

    // Fee Management
    function setFeeConfig(
        uint16 customerFeeRate,
        uint16 merchantFeeRate,
        address feeCollector,
        bool customerFeeEnabled,
        bool merchantFeeEnabled
    ) external;

    function calculateCustomerFee(uint256 amount) external view returns (uint256);
    function calculateMerchantFee(uint256 amount) external view returns (uint256);
    function calculateTotalPayment(uint256 amount) external view returns (uint256);
    function getFeeConfig() external view returns (FeeConfig memory);

    // Token Whitelist
    function setTokenWhitelisted(address token, bool whitelisted) external;
    function isTokenWhitelisted(address token) external view returns (bool);

    // Fee Withdrawal
    function withdrawFees(address token, uint256 amount) external;
}
```

---

## Data Structures

```solidity
enum SessionStatus {
    PENDING,
    FULFILLED,
    CANCELLED
}

struct Session {
    address merchant;
    address token;
    uint256 baseAmount;
    uint256 customerFeeAmount;
    uint256 merchantFeeAmount;
    SessionStatus status;
    uint256 createdAt;
    uint256 expiresAt;
}

struct FeeConfig {
    uint16 customerFeeRate;     // Basis points (0-500)
    uint16 merchantFeeRate;     // Basis points (0-500)
    address feeCollector;
    bool customerFeeEnabled;
    bool merchantFeeEnabled;
}
```

---

## Security Considerations

| Risk                    | Mitigation                                      |
|-------------------------|--------------------------------------------------|
| Reentrancy attacks      | ReentrancyGuard on state-changing functions     |
| Excessive fees          | Max fee rate cap at 5% (500 basis points)       |
| Unauthorized access     | Ownable + role-based access control             |
| Token compatibility     | SafeERC20 for all transfers + whitelist         |
| Front-running           | Session is merchant-specific, limited exposure  |
| Overflow/underflow      | Solidity 0.8+ built-in checks                   |
