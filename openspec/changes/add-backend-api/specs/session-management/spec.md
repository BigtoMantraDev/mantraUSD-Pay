# Capability: Session Management

Payment session lifecycle management for the Scan-to-Pay system.

## ADDED Requirements

### Requirement: Create Payment Session

The system SHALL allow merchants to create payment sessions via `POST /sessions`.

The request MUST include:

- `merchantAddress` - Valid Ethereum address of the merchant
- `amount` - Payment amount as a decimal string (e.g., "50.00")
- `chainId` - Target chain ID (must match backend's configured network)

The request MAY include:

- `reference` - Optional merchant order reference
- `duration` - Session duration in seconds (default: 900, min: 300, max: 86400)

The system SHALL:

1. Validate the merchant address format
2. Calculate customer fee if enabled (see `fee-calculation` capability)
3. Calculate merchant fee if enabled
4. Compute `customerPays` = amount + customerFee
5. Compute `merchantReceives` = amount - merchantFee
6. Call `SessionRegistry.createSession()` on-chain
7. Return session details with generated `sessionId`

#### Scenario: Successful session creation with both fees enabled

- **GIVEN** a valid merchant address and amount "100.00"
- **AND** customer fee is enabled with calculated fee "0.06"
- **AND** merchant fee is enabled at 1% (100 bps)
- **WHEN** the merchant calls `POST /sessions`
- **THEN** the system returns status 201
- **AND** the response includes `sessionId`
- **AND** `customerFee` equals "0.06"
- **AND** `merchantFee` equals "1.00"
- **AND** `customerPays` equals "100.06"
- **AND** `merchantReceives` equals "99.00"
- **AND** `qrUrl` contains a valid payment URL

#### Scenario: Session creation with customer fee disabled

- **GIVEN** a valid merchant address and amount "50.00"
- **AND** customer fee is disabled
- **WHEN** the merchant calls `POST /sessions`
- **THEN** `customerFee` equals "0.00"
- **AND** `customerPays` equals "50.00"

#### Scenario: Invalid merchant address

- **GIVEN** an invalid merchant address "0xinvalid"
- **WHEN** the merchant calls `POST /sessions`
- **THEN** the system returns status 400
- **AND** the error message indicates invalid address format

#### Scenario: Amount below minimum

- **GIVEN** an amount "0.0001" below the minimum threshold
- **WHEN** the merchant calls `POST /sessions`
- **THEN** the system returns status 400
- **AND** the error message indicates amount too low

#### Scenario: Chain ID mismatch

- **GIVEN** backend configured for chain 5887
- **AND** request includes `chainId: 5888`
- **WHEN** the merchant calls `POST /sessions`
- **THEN** the system returns status 400
- **AND** the error message indicates chain ID mismatch

---

### Requirement: Retrieve Payment Session

The system SHALL allow retrieval of session details via `GET /sessions/{sessionId}`.

The request MUST include:

- `sessionId` - The unique session identifier (path parameter)
- `chainId` - Target chain ID (query parameter, must match configured network)

The system SHALL return:

- All session fields including amounts, fees, status, and timestamps
- Current `feeQuoteExpiresAt` for customer fee validity
- `fulfilled` status and `payer` address if fulfilled

#### Scenario: Retrieve active session

- **GIVEN** an active session with ID "0xabc123..."
- **WHEN** the client calls `GET /sessions/0xabc123...?chainId=5887`
- **THEN** the system returns status 200
- **AND** the response includes all session details
- **AND** `fulfilled` is false

#### Scenario: Retrieve fulfilled session

- **GIVEN** a fulfilled session
- **WHEN** the client calls `GET /sessions/{id}`
- **THEN** the response includes `payer` address
- **AND** `fulfilled` is true

#### Scenario: Session not found

- **GIVEN** a non-existent session ID
- **WHEN** the client calls `GET /sessions/{id}`
- **THEN** the system returns status 404
- **AND** the error message indicates session not found

---

### Requirement: Check Session Validity

The system SHALL provide a lightweight validity check via `GET /sessions/{sessionId}/valid`.

The system SHALL return `valid: true` only if:

- Session exists
- Session is not expired (`expiresAt` > now)
- Session is not fulfilled

#### Scenario: Valid active session

- **GIVEN** an active, unfulfilled session
- **WHEN** the client calls `GET /sessions/{id}/valid`
- **THEN** the response is `{ "valid": true }`

#### Scenario: Expired session

- **GIVEN** a session with `expiresAt` in the past
- **WHEN** the client calls `GET /sessions/{id}/valid`
- **THEN** the response is `{ "valid": false }`

#### Scenario: Already fulfilled session

- **GIVEN** a session that has been fulfilled
- **WHEN** the client calls `GET /sessions/{id}/valid`
- **THEN** the response is `{ "valid": false }`

---

### Requirement: List Merchant Sessions

The system SHALL allow merchants to list their sessions via `GET /sessions/merchant/{address}`.

The request MUST include:

- `address` - Merchant wallet address (path parameter)
- `chainId` - Target chain ID (query parameter, must match configured network)

The request MAY include:

- `limit` - Maximum number of results (default: 20, max: 100)
- `offset` - Pagination offset (default: 0)
- `status` - Filter by status: "active", "fulfilled", "expired"

The system SHALL return sessions ordered by `createdAt` descending.

#### Scenario: List all merchant sessions

- **GIVEN** a merchant with 5 sessions
- **WHEN** the merchant calls `GET /sessions/merchant/{address}?chainId=5887`
- **THEN** the system returns up to 20 sessions
- **AND** sessions are ordered by creation date (newest first)

#### Scenario: Filter by status

- **GIVEN** a merchant with sessions in various states
- **WHEN** the merchant calls `GET /sessions/merchant/{address}?status=active`
- **THEN** only sessions with `fulfilled=false` and `expiresAt > now` are returned

#### Scenario: Pagination

- **GIVEN** a merchant with 50 sessions
- **WHEN** the merchant calls `GET /sessions/merchant/{address}?limit=10&offset=10`
- **THEN** sessions 11-20 are returned

---

### Requirement: Session Response Format

All session responses SHALL include the following fields:

| Field                | Type    | Description                                  |
|----------------------|---------|----------------------------------------------|
| `sessionId`          | string  | Unique session identifier (bytes32 hex)      |
| `merchantAddress`    | string  | Merchant wallet address                      |
| `tokenAddress`       | string  | Payment token contract address               |
| `amount`             | string  | Base payment amount                          |
| `amountFormatted`    | string  | Human-readable amount with symbol            |
| `customerFee`        | string  | Customer network fee                         |
| `customerFeeEnabled` | boolean | Whether customer fee is active               |
| `merchantFee`        | string  | Merchant service fee                         |
| `merchantFeeEnabled` | boolean | Whether merchant fee is active               |
| `customerPays`       | string  | Total customer pays (amount + customerFee)   |
| `merchantReceives`   | string  | Net merchant receives (amount - merchantFee) |
| `reference`          | string  | Merchant reference (may be empty)            |
| `createdAt`          | number  | Unix timestamp of creation                   |
| `expiresAt`          | number  | Unix timestamp of expiration                 |
| `feeQuoteExpiresAt`  | number  | Unix timestamp when fee quote expires        |
| `fulfilled`          | boolean | Whether session has been paid                |
| `payer`              | string? | Payer address (if fulfilled)                 |
| `qrUrl`              | string  | QR code image URL                            |
| `paymentUrl`         | string  | Direct payment link                          |
| `chainId`            | number  | Target chain ID                              |
| `networkName`        | string  | Human-readable network name                  |
| `tokenSymbol`        | string  | Payment token symbol                         |

#### Scenario: Response includes all required fields

- **GIVEN** a newly created session
- **WHEN** the session is retrieved
- **THEN** all fields from the table above are present
- **AND** numeric fields are properly typed
- **AND** optional fields are null when not applicable
