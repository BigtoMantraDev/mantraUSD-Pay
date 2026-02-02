# Capability: Blockchain Integration

Blockchain interaction layer for MANTRA Chain (single network per deployment).

## ADDED Requirements

### Requirement: Single Network Configuration

The system SHALL be configured for a single MANTRA Chain network per deployment.

Supported networks (deploy separately):
| Network        | Chain ID | Environment |
|----------------|----------|-------------|
| MANTRA Mainnet | 5888     | Production  |
| MANTRA Dukong  | 5887     | Testnet     |

Configuration MUST include:
- Network chain ID and name
- RPC endpoint URL
- Contract addresses (SessionRegistry, DelegatedAccount, mantraUSD)
- Relayer wallet private key

The configured network SHALL be exposed in API responses for client verification.

All API endpoints that accept `chainId` parameter MUST validate it matches the configured network and return 400 error if mismatched.

#### Scenario: Backend configured for testnet

- **GIVEN** environment configured with `CHAIN_ID=5887`
- **WHEN** the backend starts
- **THEN** all operations target Dukong testnet
- **AND** `/health` response includes `chainId: 5887`

#### Scenario: Backend configured for mainnet

- **GIVEN** environment configured with `CHAIN_ID=5888`
- **WHEN** the backend starts
- **THEN** all operations target MANTRA mainnet
- **AND** `/health` response includes `chainId: 5888`

#### Scenario: Chain ID mismatch rejected

- **GIVEN** backend configured with `CHAIN_ID=5887`
- **WHEN** a request arrives with `chainId=5888`
- **THEN** the system returns status 400
- **AND** error message indicates "Chain ID mismatch. Expected 5887, got 5888"

---

### Requirement: Viem Client Management

The system SHALL use Viem library for blockchain interactions.

The system MUST maintain:
- Single public client (for read operations)
- Single wallet client (for write operations)

Clients SHOULD:
- Reuse connections where possible
- Handle RPC errors gracefully
- Retry failed requests with backoff

#### Scenario: Read operation

- **GIVEN** a request to read session data
- **WHEN** the blockchain module processes it
- **THEN** public client is used
- **AND** no wallet signing is required

#### Scenario: Write operation

- **GIVEN** a request to relay a transaction
- **WHEN** the blockchain module processes it
- **THEN** wallet client is used
- **AND** transaction is signed with relayer key

---

### Requirement: Contract Interaction

The system SHALL provide type-safe contract interaction methods.

Required contract interfaces:
- `SessionRegistry` - Session CRUD operations
- `DelegatedAccount` - EIP-7702 execution
- `ERC20` (mantraUSD) - Token balance checks

Each contract interaction MUST:
- Use Viem's contract abstraction
- Include proper ABI types
- Handle revert errors meaningfully

#### Scenario: Call SessionRegistry.createSession

- **GIVEN** valid session parameters
- **WHEN** createSession is called
- **THEN** transaction is built with correct ABI encoding
- **AND** result is decoded to session ID

#### Scenario: Read token balance

- **GIVEN** a user address
- **WHEN** balanceOf is called on mantraUSD
- **THEN** balance is returned as bigint
- **AND** decimals are handled correctly

---

### Requirement: Gas Price Fetching

The system SHALL fetch current gas prices for fee calculation.

The system MUST:
- Call `eth_gasPrice` RPC method
- Cache gas price briefly (5 seconds) to reduce RPC calls
- Handle RPC failures gracefully

#### Scenario: Fetch gas price success

- **GIVEN** RPC is available
- **WHEN** gas price is requested
- **THEN** current gas price is returned in wei
- **AND** result is cached for 5 seconds

#### Scenario: Fetch gas price failure

- **GIVEN** RPC is temporarily unavailable
- **WHEN** gas price is requested
- **THEN** cached value is used if available
- **OR** error is thrown if no cache

---

### Requirement: Transaction Submission

The system SHALL submit transactions reliably.

Transaction submission MUST:
1. Estimate gas with buffer
2. Set appropriate maxFeePerGas and maxPriorityFeePerGas
3. Sign transaction with relayer wallet
4. Submit via `eth_sendRawTransaction`
5. Wait for confirmation (configurable timeout)
6. Return transaction receipt

If submission fails, the system MUST:
- Capture and log error details
- Return meaningful error to caller
- Apply retry logic that:
  - MAY automatically retry on transient pre-submission errors (e.g., network errors, RPC timeouts) where no transaction hash was obtained and the node did not acknowledge the transaction
  - MUST NOT automatically retry after successful submission (e.g., once a transaction hash is known, or on nonce/`already known`-type errors) to avoid double-spend or nonce conflicts

#### Scenario: Successful transaction

- **GIVEN** a valid signed transaction
- **WHEN** transaction is submitted
- **THEN** transaction hash is returned immediately
- **AND** system waits for confirmation
- **AND** receipt is returned on success

#### Scenario: Transaction reverts on-chain

- **GIVEN** a transaction that reverts
- **WHEN** receipt is received
- **THEN** revert reason is extracted
- **AND** meaningful error is returned

#### Scenario: Transaction timeout

- **GIVEN** a transaction that doesn't confirm within timeout
- **WHEN** timeout is reached
- **THEN** error indicates timeout
- **AND** transaction hash is still provided (for manual check)

---

### Requirement: Nonce Management

The system SHALL correctly manage nonces for the relayer wallet.

The system MUST:
- Track pending transactions
- Use `eth_getTransactionCount` with "pending" parameter
- Increment nonce for sequential transactions
- Handle nonce conflicts gracefully

#### Scenario: Sequential transactions

- **GIVEN** two relay requests in quick succession
- **WHEN** both transactions are built
- **THEN** nonces are correctly incremented
- **AND** neither transaction fails due to nonce conflict

#### Scenario: Nonce sync on startup

- **GIVEN** the backend restarts
- **WHEN** first transaction is built
- **THEN** nonce is fetched from chain (not from memory)

---

### Requirement: Environment Configuration

The system SHALL load configuration from environment variables.

Required environment variables:

| Variable               | Description                         | Example                    |
|------------------------|-------------------------------------|----------------------------|
| `CHAIN_ID`             | Network chain ID                    | `5887`                     |
| `CHAIN_NAME`           | Human-readable network name         | `MANTRA Dukong`            |
| `RPC_URL`              | JSON-RPC endpoint                   | `https://rpc.dukong.mantra.zone` |
| `RELAYER_PRIVATE_KEY`  | Relayer wallet private key (hex)    | `0x...`                    |
| `SESSION_REGISTRY`     | SessionRegistry contract address    | `0x...`                    |
| `DELEGATED_ACCOUNT`    | DelegatedAccount contract address   | `0x...`                    |
| `MANTRAUSD_ADDRESS`    | mantraUSD token contract address    | `0x...`                    |

The system SHALL validate all configuration on startup and fail fast if invalid.

#### Scenario: Valid configuration

- **GIVEN** all required environment variables are set
- **WHEN** the backend starts
- **THEN** Viem clients are initialized
- **AND** health check passes

#### Scenario: Missing configuration

- **GIVEN** `RPC_URL` is not set
- **WHEN** the backend starts
- **THEN** startup fails with clear error message
- **AND** error lists missing variables

---

### Requirement: Health Check

The system SHALL provide health status via `GET /health`.

Health check MUST verify:
- RPC connectivity
- Relayer wallet balance above minimum threshold
- Contract accessibility

Response format:
```json
{
  "status": "ok" | "degraded" | "unhealthy",
  "chainId": 5887,
  "networkName": "MANTRA Dukong",
  "rpc": true,
  "relayer": {
    "address": "0x...",
    "balance": "1.5"
  },
  "contracts": {
    "sessionRegistry": true,
    "delegatedAccount": true,
    "mantraUSD": true
  }
}
```

#### Scenario: All systems healthy

- **GIVEN** RPC responsive and balance sufficient
- **WHEN** health check is called
- **THEN** status is "ok"
- **AND** all checks show true

#### Scenario: Low relayer balance

- **GIVEN** relayer balance is below threshold
- **WHEN** health check is called
- **THEN** status is "degraded"
- **AND** response includes balance warning

#### Scenario: RPC unavailable

- **GIVEN** RPC is down
- **WHEN** health check is called
- **THEN** status is "unhealthy"
- **AND** `rpc` is false

---

### Requirement: Error Handling

The system SHALL handle blockchain errors gracefully.

Error categories:
| Error Type           | Handling                                    |
|----------------------|---------------------------------------------|
| RPC Timeout          | Retry with backoff, then fail               |
| Invalid Response     | Log and return internal error               |
| Insufficient Gas     | Return clear error about gas                |
| Revert               | Extract reason and return                   |
| Nonce Too Low        | Refresh nonce and retry once                |

All blockchain errors MUST be logged with full context.

#### Scenario: RPC timeout with retry

- **GIVEN** first RPC call times out
- **WHEN** the system retries
- **THEN** up to 3 retries are attempted
- **AND** backoff increases between retries

#### Scenario: Contract revert with reason

- **GIVEN** a contract call reverts with "SessionExpired"
- **WHEN** the error is processed
- **THEN** revert reason is extracted
- **AND** user-friendly message is returned
