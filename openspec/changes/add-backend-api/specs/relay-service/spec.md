# Capability: Relay Service

Transaction relay service for gasless EIP-7702 payments.

## ADDED Requirements

### Requirement: Relay Signed Transaction

The system SHALL relay signed payment transactions via `POST /relay`.

The request MUST include:

- `sessionId` - The payment session to fulfill
- `userAddress` - The payer's wallet address
- `signature` - EIP-712 signature of the execution intent
- `intent` - The execution intent object containing:
    - `destination` - Token contract address
    - `value` - Native value (typically "0")
    - `data` - Encoded transfer function call
    - `nonce` - User's current nonce
    - `deadline` - Signature expiration timestamp
- `chainId` - Target chain ID (must match configured network)

The system SHALL perform the following validations before relaying:

1. Verify session exists and is valid (not expired, not fulfilled)
2. Recover signer from EIP-712 signature matches `userAddress`
3. Verify `nonce` matches on-chain nonce for user
4. Verify `deadline` has not passed
5. Simulate transaction via `eth_call` to check for revert
6. Verify customer fee quote has not expired

Upon successful validation, the system SHALL:

1. Construct EIP-7702 Type 4 transaction with authorization list
2. Sign transaction with relayer wallet
3. Submit transaction to the network
4. Wait for transaction confirmation
5. Return success with transaction hash

#### Scenario: Successful payment relay

- **GIVEN** an active session with ID "0xabc123..."
- **AND** a valid EIP-712 signature from the payer
- **AND** the payer has sufficient token balance
- **WHEN** the client calls `POST /relay`
- **THEN** the system returns status 200
- **AND** the response includes `txHash`
- **AND** the response includes `explorerUrl`
- **AND** `success` is true

#### Scenario: Invalid signature

- **GIVEN** an active session
- **AND** a signature that doesn't match the claimed userAddress
- **WHEN** the client calls `POST /relay`
- **THEN** the system returns status 401
- **AND** the error message indicates invalid signature

#### Scenario: Session already fulfilled

- **GIVEN** a session that has already been paid
- **WHEN** the client calls `POST /relay`
- **THEN** the system returns status 409
- **AND** the error message indicates session already fulfilled

#### Scenario: Session expired

- **GIVEN** a session with `expiresAt` in the past
- **WHEN** the client calls `POST /relay`
- **THEN** the system returns status 410
- **AND** the error message indicates session expired

#### Scenario: Nonce mismatch

- **GIVEN** an intent with a stale nonce
- **WHEN** the client calls `POST /relay`
- **THEN** the system returns status 400
- **AND** the error message indicates nonce mismatch

#### Scenario: Signature deadline expired

- **GIVEN** an intent with `deadline` in the past
- **WHEN** the client calls `POST /relay`
- **THEN** the system returns status 400
- **AND** the error message indicates signature expired

#### Scenario: Simulation fails (insufficient balance)

- **GIVEN** a payer with insufficient token balance
- **WHEN** the client calls `POST /relay`
- **THEN** the system returns status 400
- **AND** the error message indicates transfer would fail

#### Scenario: Fee quote expired

- **GIVEN** a session with expired `feeQuoteExpiresAt`
- **WHEN** the client calls `POST /relay`
- **THEN** the system returns status 400
- **AND** the error message indicates fee quote expired
- **AND** the message instructs client to refresh session

#### Scenario: Chain ID mismatch

- **GIVEN** backend configured for chain 5887
- **AND** request includes `chainId: 5888`
- **WHEN** the client calls `POST /relay`
- **THEN** the system returns status 400
- **AND** the error indicates chain ID mismatch

---

### Requirement: Relayer Status

The system SHALL provide relayer status via `GET /relay/status`.

The system SHALL return:

- `available` - Whether the relayer can process requests
- `balance` - Relayer wallet balance (for gas)
- `address` - Relayer wallet address
- `chainId` - Configured network chain ID
- `networkName` - Human-readable network name

The relayer SHALL be marked unavailable if:

- Wallet balance is below minimum threshold
- Rate limit exceeded
- System is in maintenance mode

#### Scenario: Relayer available

- **GIVEN** a relayer with sufficient balance
- **WHEN** the client calls `GET /relay/status`
- **THEN** `available` is true
- **AND** `balance` shows current balance
- **AND** `address` is the relayer wallet
- **AND** `chainId` matches configured network

#### Scenario: Relayer low balance

- **GIVEN** a relayer with balance below threshold
- **WHEN** the client calls `GET /relay/status`
- **THEN** `available` is false
- **AND** the client knows to show maintenance message

---

### Requirement: Rate Limiting

The system SHALL enforce rate limiting on the relay endpoint.

Rate limit configuration:

- Window: 60 seconds
- Maximum requests: 10 per IP address

When rate limit is exceeded, the system SHALL:

- Return status 429 (Too Many Requests)
- Include `Retry-After` header with seconds until reset
- Log the rate limit event

#### Scenario: Under rate limit

- **GIVEN** a client that has made 5 requests in the last minute
- **WHEN** the client calls `POST /relay`
- **THEN** the request is processed normally

#### Scenario: Rate limit exceeded

- **GIVEN** a client that has made 10 requests in the last minute
- **WHEN** the client calls `POST /relay`
- **THEN** the system returns status 429
- **AND** the `Retry-After` header indicates wait time

---

### Requirement: Transaction Simulation

The system SHALL simulate all transactions before broadcasting.

Simulation MUST:

- Use `eth_call` with the exact transaction parameters
- Catch revert reasons and return meaningful errors
- Validate gas estimation is within acceptable bounds

If simulation fails, the system SHALL NOT broadcast the transaction.

#### Scenario: Simulation succeeds

- **GIVEN** a valid relay request with sufficient balance
- **WHEN** the system simulates the transaction
- **THEN** simulation completes without revert
- **AND** the transaction is broadcast

#### Scenario: Simulation reverts

- **GIVEN** a relay request that would fail on-chain
- **WHEN** the system simulates the transaction
- **THEN** simulation returns revert reason
- **AND** the transaction is NOT broadcast
- **AND** client receives descriptive error

---

### Requirement: EIP-7702 Transaction Construction

The system SHALL construct valid EIP-7702 Type 4 transactions.

The transaction MUST include:

- `type: 4` for EIP-7702 transactions
- `authorizationList` with user's delegation authorization
- Proper gas estimation for the delegated call
- Chain-specific parameters (chainId, nonce, maxFeePerGas, maxPriorityFeePerGas)

The DelegatedAccount contract MUST be set as the delegation target.

#### Scenario: Valid Type 4 transaction

- **GIVEN** a valid relay request
- **WHEN** the system constructs the transaction
- **THEN** the transaction type is 4
- **AND** authorizationList contains user's authorization
- **AND** the transaction is signed by the relayer

---

### Requirement: Relay Response Format

Successful relay responses SHALL include:

| Field         | Type    | Description                    |
|---------------|---------|--------------------------------|
| `success`     | boolean | Always true for 200 response   |
| `txHash`      | string  | Transaction hash               |
| `explorerUrl` | string  | Link to block explorer         |
| `message`     | string  | Human-readable success message |

Error responses SHALL include:

| Field        | Type    | Description                  |
|--------------|---------|------------------------------|
| `statusCode` | number  | HTTP status code             |
| `error`      | string  | Error category               |
| `message`    | string  | Human-readable error message |
| `details`    | object? | Additional error context     |

#### Scenario: Success response format

- **GIVEN** a successfully relayed transaction
- **WHEN** the response is returned
- **THEN** all success fields are present
- **AND** `txHash` is a valid hex string
- **AND** `explorerUrl` is a valid URL

#### Scenario: Error response format

- **GIVEN** a failed relay attempt
- **WHEN** the error response is returned
- **THEN** all error fields are present
- **AND** `message` is user-friendly
