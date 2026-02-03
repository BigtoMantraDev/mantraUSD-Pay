# Spec: Payment Hooks

> React hooks for session management, EIP-712 signing, and relay submission.

## Overview

Payment hooks encapsulate the business logic for fetching payment sessions, requesting user signatures, and submitting transactions to the relay service.

## Dependencies

- React 19
- Wagmi for wallet interactions
- Backend API for session and relay
- Config package for chain configuration

---

## ADDED Requirements

### Requirement: usePaymentSession Hook

The hook SHALL fetch and manage payment session data.

#### Scenario: Fetch session on mount

- Given a valid sessionId and chainId
- When usePaymentSession is called
- Then the hook SHALL fetch session data from GET /sessions/{sessionId}
- And return loading=true initially
- And return data when fetch completes

#### Scenario: Session not found

- Given an invalid sessionId
- When the fetch completes with 404
- Then the hook SHALL return error with code "SESSION_NOT_FOUND"
- And data SHALL be undefined

#### Scenario: Session data structure

- Given a successful session fetch
- When data is returned
- Then it SHALL include:
  - sessionId: string
  - merchant: address
  - amount: string (base amount)
  - customerFee: string (calculated fee)
  - totalAmount: string (amount + customerFee)
  - merchantReceives: string (amount - merchantFee)
  - token: { address, symbol, decimals }
  - status: "pending" | "fulfilled" | "expired" | "cancelled"
  - expiresAt: Date
  - feeQuoteExpiresAt: Date

#### Scenario: Poll for status updates

- Given a pending session
- When the hook is active
- Then it SHALL poll GET /sessions/{sessionId} every 2 seconds
- And update data if status changes

#### Scenario: Stop polling on terminal state

- Given a session with status "fulfilled", "expired", or "cancelled"
- When the status is detected
- Then polling SHALL stop
- And no further requests SHALL be made

#### Scenario: Session expiry countdown

- Given a session with expiresAt in the future
- When the hook returns
- Then it SHALL provide secondsRemaining: number
- And the value SHALL update every second

#### Scenario: Fee quote expiry detection

- Given a session with feeQuoteExpiresAt
- When the current time exceeds feeQuoteExpiresAt
- Then the hook SHALL return feeQuoteExpired: true
- And trigger a refetch to get new quote

#### Scenario: Refetch session

- Given an active session
- When refetch() is called
- Then a new request SHALL be made
- And data SHALL be updated with fresh response

---

### Requirement: useEIP712Sign Hook

The hook SHALL build EIP-712 typed data and request signatures.

#### Scenario: Build typed data for payment

- Given a payment session
- When buildTypedData() is called
- Then it SHALL return EIP-712 structured data with:
  - domain: { name, version, chainId, verifyingContract }
  - types: { Execute: [...] }
  - primaryType: "Execute"
  - message: { destination, value, data, nonce, deadline }

#### Scenario: Domain configuration

- Given a chainId
- When typed data is built
- Then domain.name SHALL be "DelegatedAccount"
- And domain.version SHALL be "1"
- And domain.chainId SHALL match the session chainId
- And domain.verifyingContract SHALL be the DelegatedAccount address

#### Scenario: Request signature

- Given built typed data
- When sign() is called
- Then wagmi signTypedData SHALL be invoked
- And the wallet popup SHALL appear

#### Scenario: Signature success

- Given the user approves the signature
- When the wallet returns
- Then the hook SHALL return signature: string (hex)
- And isSuccess SHALL be true

#### Scenario: User rejection

- Given the user rejects the signature
- When the wallet returns
- Then the hook SHALL return error with code "USER_REJECTED"
- And isSuccess SHALL be false
- And signature SHALL be undefined

#### Scenario: Deadline calculation

- Given a session with feeQuoteExpiresAt
- When the deadline is set in typed data
- Then deadline SHALL match feeQuoteExpiresAt timestamp
- And provide buffer for transaction processing

#### Scenario: Nonce fetching

- Given a user address
- When building typed data
- Then the current nonce SHALL be fetched from DelegatedAccount contract
- And included in the message

---

### Requirement: useRelayPayment Hook

The hook SHALL submit signed payments to the relay service.

#### Scenario: Submit relay request

- Given a session and signature
- When relay() is called
- Then POST /relay SHALL be called with:
  - sessionId: string
  - userAddress: address
  - signature: string
  - chainId: number

#### Scenario: Relay success

- Given a valid relay request
- When the backend accepts and broadcasts
- Then the hook SHALL return:
  - success: true
  - txHash: string
  - message: string

#### Scenario: Relay failure - session expired

- Given a relay request for an expired session
- When the backend rejects
- Then the hook SHALL return:
  - success: false
  - error: { code: "SESSION_EXPIRED", message: string }

#### Scenario: Relay failure - invalid signature

- Given a relay request with tampered signature
- When the backend rejects
- Then the hook SHALL return:
  - success: false
  - error: { code: "INVALID_SIGNATURE", message: string }

#### Scenario: Relay failure - fee quote expired

- Given a relay request with expired fee quote
- When the backend rejects
- Then the hook SHALL return:
  - success: false
  - error: { code: "FEE_QUOTE_EXPIRED", message: string }

#### Scenario: Relay failure - insufficient balance

- Given a relay request where user lacks funds
- When the backend simulation fails
- Then the hook SHALL return:
  - success: false
  - error: { code: "INSUFFICIENT_BALANCE", message: string }

#### Scenario: Transaction confirmation polling

- Given a successful relay with txHash
- When polling for confirmation
- Then the hook SHALL check transaction receipt every 2 seconds
- And return isConfirmed: true when receipt is found

#### Scenario: Transaction failure

- Given a relay that was broadcast
- When the transaction reverts
- Then the hook SHALL return:
  - success: false
  - txHash: string (for reference)
  - error: { code: "TX_REVERTED", message: string }

#### Scenario: Loading states

- Given a relay in progress
- When the request is pending
- Then isLoading SHALL be true
- And isLoading SHALL be false when complete

---

## Hook Interfaces

```typescript
interface UsePaymentSessionResult {
  data: PaymentSession | undefined;
  isLoading: boolean;
  isError: boolean;
  error: PaymentError | null;
  secondsRemaining: number;
  feeQuoteExpired: boolean;
  refetch: () => Promise<void>;
}

interface UseEIP712SignResult {
  buildTypedData: (session: PaymentSession) => TypedData;
  sign: () => Promise<void>;
  signature: string | undefined;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: SignError | null;
  reset: () => void;
}

interface UseRelayPaymentResult {
  relay: (params: RelayParams) => Promise<void>;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isConfirmed: boolean;
  txHash: string | undefined;
  error: RelayError | null;
  reset: () => void;
}
```

---

## Error Codes

| Code                  | Hook              | Description                           |
|-----------------------|-------------------|---------------------------------------|
| SESSION_NOT_FOUND     | usePaymentSession | Session ID does not exist             |
| SESSION_EXPIRED       | usePaymentSession | Session has expired                   |
| SESSION_FULFILLED     | usePaymentSession | Session already paid                  |
| NETWORK_ERROR         | All               | API request failed                    |
| USER_REJECTED         | useEIP712Sign     | User rejected signature               |
| INVALID_SIGNATURE     | useRelayPayment   | Signature verification failed         |
| FEE_QUOTE_EXPIRED     | useRelayPayment   | Fee quote no longer valid             |
| INSUFFICIENT_BALANCE  | useRelayPayment   | User lacks funds for payment          |
| TX_REVERTED           | useRelayPayment   | Transaction was reverted on-chain     |
| RATE_LIMITED          | useRelayPayment   | Too many requests                     |
