# Design: Backend API Architecture

## Context

The backend serves as the relay layer for gasless EIP-7702 payments. It must:

- Handle high-throughput session creation from merchants
- Process payment relay requests with low latency
- Calculate dynamic gas fees in real-time
- Maintain security against replay attacks and fee manipulation

### Stakeholders

| Stakeholder | Interest                                         |
|-------------|--------------------------------------------------|
| Customers   | Fast, gasless payments with transparent fees     |
| Merchants   | Reliable session creation, real-time fulfillment |
| Operators   | Monitoring, cost control, fee collection         |
| Developers  | Clean API, testable modules, easy deployment     |

### Constraints

- Must support MANTRA Mainnet (5888) and Dukong Testnet (5887)
- Relayer wallet must have sufficient OM for gas
- Customer fee calculation depends on real-time gas price
- Session expiry enforced both off-chain and on-chain

## Goals / Non-Goals

### Goals

1. **Gasless UX**: Users sign, backend pays gas
2. **Real-time fees**: Dynamic customer fee based on gas price
3. **Security**: Signature verification, simulation, rate limiting
4. **Multi-chain**: Support mainnet and testnet simultaneously
5. **Observability**: Structured logging, health checks, metrics

### Non-Goals

- Database persistence (MVP uses in-memory + on-chain state)
- User authentication (wallet signatures are auth)
- Webhook notifications (future enhancement)
- GraphQL API (REST only for MVP)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway                             │
│                    (Rate Limiting, CORS)                        │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────────┐
│                      NestJS Application                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Session   │  │    Relay    │  │     Fee     │              │
│  │   Module    │  │   Module    │  │   Module    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                     │
│  ┌──────┴────────────────┴────────────────┴──────┐              │
│  │              Blockchain Module                 │             │
│  │    (Viem Client, Contract Interactions)        │             │
│  └────────────────────────┬──────────────────────┘              │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                      MANTRA Chain                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ SessionRegistry │  │ DelegatedAccount│  │    mantraUSD    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Decisions

### D1: Use NestJS Framework

**Decision**: NestJS with TypeScript for the backend framework.

**Rationale**:

- Strong TypeScript support with decorators
- Built-in dependency injection
- Modular architecture fits domain boundaries
- Rich ecosystem (validation, swagger, etc.)

**Alternatives Considered**:

- **Express.js**: Too low-level, requires more boilerplate
- **Fastify**: Fast but less ecosystem support
- **Hono**: Good for edge, but NestJS better for complex apps

### D2: Viem for Blockchain Interactions

**Decision**: Use Viem library for all chain interactions.

**Rationale**:

- Type-safe contract interactions
- Native EIP-7702 support
- Consistent with webapp (which uses wagmi/viem)
- Smaller bundle than ethers.js

### D3: In-Memory Session Cache + On-Chain Truth

**Decision**: Cache sessions in-memory, use on-chain state as source of truth.

**Rationale**:

- No database dependency for MVP
- SessionRegistry contract holds canonical state
- Cache improves read performance
- Simplifies deployment (stateless backend)

**Trade-offs**:

- Cache invalidation on restarts
- Must sync from chain on boot (or lazy-load)
- Limited query flexibility vs SQL

**Migration Path**: Add PostgreSQL when needed for:

- Historical analytics
- Complex merchant queries
- Webhook delivery tracking

### D4: Quote-Based Customer Fee with TTL

**Decision**: Customer fee calculated at request time with 60-second TTL.

**Rationale**:

- Gas price volatility handled by short TTL
- User signs exact amount (no surprises)
- Relayer profit/loss based on actual gas
- Protects against gas price manipulation

**Flow**:

1. Session created → current gas fee calculated
2. Fee quote has 60s TTL
3. Frontend re-fetches if expired
4. User signs exact `customerPays` amount
5. Relayer pays actual gas, keeps/absorbs difference

### D5: Single-Network Deployment

**Decision**: Each backend instance serves one network, controlled by configuration.

**Rationale**:

- Simpler code (no chainId routing)
- Cleaner separation of environments
- Easier debugging and monitoring
- Deploy separate instances for mainnet vs testnet

## Module Responsibilities

### Session Module

| Responsibility         | Implementation                       |
|------------------------|--------------------------------------|
| Create session         | Call SessionRegistry.createSession() |
| Get session            | Read from cache or chain             |
| List merchant sessions | Query SessionRegistry events + cache |
| Validate session       | Check expiry, fulfillment status     |
| Cancel session         | Call SessionRegistry.cancelSession() |

### Relay Module

| Responsibility             | Implementation                              |
|----------------------------|---------------------------------------------|
| Validate relay request     | Signature, nonce, session state             |
| Build EIP-7702 transaction | Construct Type 4 tx with authorization_list |
| Simulate transaction       | eth_call before broadcast                   |
| Submit transaction         | eth_sendRawTransaction                      |
| Wait for confirmation      | Poll for receipt                            |

### Fee Module

| Responsibility         | Implementation                 |
|------------------------|--------------------------------|
| Get gas price          | eth_gasPrice RPC call          |
| Calculate customer fee | gas × price × buffer → USD     |
| Calculate merchant fee | amount × feeBps / 10000        |
| Validate customer fee  | Check within min/max bounds    |
| Generate fee quote     | Package fee + TTL for frontend |

### Blockchain Module

| Responsibility          | Implementation                     |
|-------------------------|------------------------------------|
| Chain client management | Single Viem public + wallet client |
| Contract instances      | Type-safe contract objects         |
| Transaction submission  | Sign + broadcast + wait            |
| Event listening         | WebSocket subscription (future)    |

## API Design Patterns

### Request Validation

```typescript
// All requests validated with class-validator
class CreateSessionDto {
  @IsEthereumAddress()
  merchantAddress: string;

  @IsNumberString()
  @Min(0.001)
  amount: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsNumber()
  @Min(300) // 5 minutes
  @Max(86400) // 24 hours
  duration?: number;

  @IsNumber()
  @IsIn([5887, 5888])
  chainId: number;
}
```

### Error Responses

```typescript
interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

// Standard error codes
// 400 - Bad Request (validation errors)
// 404 - Session Not Found
// 409 - Session Already Fulfilled
// 410 - Session Expired
// 429 - Rate Limited
// 500 - Internal Server Error
// 503 - Relayer Unavailable
```

### Response Envelope

```typescript
// Success responses include relevant data
interface SessionResponse {
  sessionId: string;
  // ... all session fields
}

// No wrapper object for simple responses
// Pagination via headers when needed
```

## Risks / Trade-offs

### R1: Relayer Wallet Security

**Risk**: Private key compromise leads to fund loss.

**Mitigations**:

- Environment variable for key (not in code)
- Limited balance in relayer wallet
- Separate wallets per chain
- Monitoring for unusual activity

### R2: Gas Price Spike

**Risk**: Gas price spikes between quote and relay cause relayer loss.

**Mitigations**:

- 20% buffer on fee calculation
- 60-second quote TTL limits exposure
- Gas price cap rejects extreme spikes
- Monitoring alerts on unusual gas

### R3: Session State Sync

**Risk**: In-memory cache out of sync with chain.

**Mitigations**:

- Always verify on-chain state before relay
- Cache TTL forces periodic refresh
- Rebuild cache on restart

### R4: DoS via Session Spam

**Risk**: Attackers create many sessions to spam chain.

**Mitigations**:

- Rate limiting on session creation
- Session requires valid merchant signature
- On-chain gas cost deters spam

## Configuration Schema

```typescript
interface BackendConfig {
  // Server
  port: number;
  corsOrigins: string[];

  // Network (single network per deployment)
  network: {
    chainId: number;
    name: string;
    rpcUrl: string;
  };

  // Contracts
  contracts: {
    sessionRegistry: Address;
    delegatedAccount: Address;
    mantraUSD: Address;
  };

  // Relayer
  relayer: {
    privateKey: string;
    // Minimum relayer balance before alerts trigger.
    // Represented as a decimal string in native token units (e.g. "1.5"),
    // consistent with the health check specification. The backend MUST
    // convert this value to a bigint in wei for on-chain operations.
    minBalance: string;
  };

  // Fees
  fees: {
    customerFeeEnabled: boolean;
    merchantFeeEnabled: boolean;
    merchantFeeBps: number;
    gasBufferPercent: number;
    maxCustomerFee: bigint;
    minCustomerFee: bigint;
    quoteTTL: number;
    feeCollector: Address;
  };

  // Security
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };

  gasPriceCap: bigint;
}
```

## Open Questions

1. **Database for MVP?**
    - Leaning toward no-DB for simplicity
    - Revisit if query patterns require persistence

2. **WebSocket for real-time updates?**
    - Could notify frontend of fulfillment
    - Polling may be sufficient for MVP

3. **Separate relayer service?**
    - Currently embedded in API
    - Could extract for scale/security later
