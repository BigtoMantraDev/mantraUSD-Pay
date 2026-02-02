# Change: Add Backend API for Gasless Scan-to-Pay

## Why

The mantraUSD Scan-to-Pay system requires a NestJS backend to serve as the relayer and session management layer. This backend enables gasless payments by:

1. Managing payment sessions (create, retrieve, validate, fulfill)
2. Relaying EIP-7702 transactions (users sign, backend pays gas)
3. Calculating dynamic gas fees in real-time
4. Providing secure transaction simulation and validation

Without this backend, users would need to pay gas themselves, breaking the "gasless" UX promise.

## What Changes

### New Package: `packages/backend`

- **NestJS Backend API** with modular architecture
- **Session Module**: CRUD operations for payment sessions
- **Relay Module**: EIP-7702 transaction relay with gas sponsorship
- **Fee Module**: Dynamic gas fee calculation with quote TTL
- **Blockchain Module**: Viem-based chain interaction layer

### New Capabilities (OpenSpec)

| Capability               | Description                                           |
|--------------------------|-------------------------------------------------------|
| `session-management`     | Payment session lifecycle (create, get, list, cancel) |
| `relay-service`          | EIP-7702 transaction relay and validation             |
| `fee-calculation`        | Dynamic customer fee + fixed merchant fee             |
| `blockchain-integration` | Single-network chain interaction layer                |

### API Endpoints

| Method | Endpoint                       | Description               |
|--------|--------------------------------|---------------------------|
| GET    | `/health`                      | Health check + chain info |
| POST   | `/sessions`                    | Create payment session    |
| GET    | `/sessions/{sessionId}`        | Get session details       |
| GET    | `/sessions/{sessionId}/valid`  | Check session validity    |
| GET    | `/sessions/merchant/{address}` | List merchant sessions    |
| GET    | `/fees/quote`                  | Get current gas fee quote |
| POST   | `/relay`                       | Relay signed transaction  |
| GET    | `/relay/status`                | Get relayer status        |

**Note:** Single network per deployment. All endpoints require `chainId` parameter which is validated against the backend's configured network - returns 400 if mismatched.

### Non-Breaking Changes

- New package does not modify existing `webapp` or `contracts` packages
- Adds shared config consumed by backend and frontend

## Impact

### Affected Specs

- **NEW**: `session-management` - Payment session lifecycle
- **NEW**: `relay-service` - Transaction relay service
- **NEW**: `fee-calculation` - Fee calculation logic
- **NEW**: `blockchain-integration` - Blockchain interaction layer

### Affected Code

- `packages/backend/` - New NestJS application
- `packages/config/` - Shared configuration (optional, may start inline)
- `docker-compose.yml` - Local development setup
- `package.json` (root) - Workspace dependencies

### Dependencies

- Smart contracts (`DelegatedAccount.sol`, `SessionRegistry.sol`) must be deployed
- Chain RPC endpoints must be available (MANTRA Mainnet/Dukong)
- Private key for relayer/paymaster wallet

## Security Considerations

| Control                     | Description                                           |
|-----------------------------|-------------------------------------------------------|
| Rate Limiting               | 10 requests/minute/IP for relay endpoint              |
| Signature Verification      | EIP-712 signature recovery before relay               |
| Transaction Simulation      | `eth_call` simulation before broadcast                |
| Nonce Validation            | On-chain nonce check prevents replay                  |
| Session State Check         | Verify not expired, not fulfilled before relay        |
| Gas Price Cap               | Reject if gas price exceeds threshold                 |
| Customer Fee Cap            | Enforce maxCustomerFee from config                    |

## Out of Scope

- Webhook notifications (future enhancement)
- The Graph subgraph integration (future enhancement)
- Multi-token support (future enhancement)
- Refund mechanism (future enhancement)
