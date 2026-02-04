# Backend Relayer Design

## Context

The backend relayer is the critical infrastructure that enables gasless transactions. It receives signed intents from users, constructs EIP-7702 Type 4 transactions, and broadcasts them to MANTRA Chain while paying gas fees. The relayer must be secure, reliable, and cost-efficient.

**Stakeholders:**
- End users (want gasless UX)
- Relayer operator (pays gas, needs fee recovery)
- Frontend webapp (integrates with API)

**Constraints:**
- MANTRA Chain must support EIP-7702 Type 4 transactions
- Relayer wallet must maintain native token balance
- Fee quotes must be valid long enough for user to sign (~60s)
- Must handle gas price volatility

## Goals / Non-Goals

**Goals:**
- Provide REST API for fee quotes, nonce queries, and transaction relay
- Secure signature verification before broadcasting
- Transaction simulation to prevent wasted gas
- Rate limiting to prevent abuse
- Clear error messages for debugging

**Non-Goals:**
- Multi-chain support (single chain per deployment)
- Transaction batching (future enhancement)
- Fee payment in multiple tokens (future enhancement)
- WebSocket real-time updates (use polling)

## Architecture Decisions

### Decision: NestJS 11 Framework

**Choice:** Use NestJS 11 with TypeScript strict mode

**Rationale:**
- Mature, well-documented framework with strong typing
- Built-in dependency injection for testability
- Native support for validation, Swagger, health checks
- Modular architecture fits our domain separation

**Alternatives considered:**
- Express + custom DI: More setup, less structure
- Fastify: Faster but less ecosystem support
- Hono: Too lightweight for backend service needs

### Decision: Viem for Blockchain Interactions

**Choice:** Use Viem 2.x instead of ethers.js

**Rationale:**
- First-class TypeScript support with strict types
- Native EIP-7702 support for Type 4 transactions
- Smaller bundle, better tree-shaking
- Active development and modern API

### Decision: Single Chain Per Deployment

**Choice:** Deploy separate backend instances per chain

**Rationale:**
- Simpler configuration and monitoring
- Chain-specific relayer wallets
- Clearer error isolation
- Can scale chains independently

**Trade-off:** More infrastructure for multi-chain, but cleaner separation.

### Decision: Stateless Relay Service

**Choice:** No database, query on-chain state directly

**Rationale:**
- Nonces are authoritative on-chain
- Fee quotes are ephemeral (60s TTL)
- No transaction history needed (use explorer)
- Simpler deployment and operation

**Trade-off:** Higher RPC load, but avoids state sync issues.

## Module Structure

```
packages/backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── modules/
│   │   ├── blockchain/
│   │   │   ├── blockchain.module.ts
│   │   │   ├── blockchain.service.ts      # Viem client
│   │   │   ├── relayer-wallet.service.ts  # TX signing
│   │   │   └── gas-oracle.service.ts      # Gas price
│   │   ├── fee/
│   │   │   ├── fee.module.ts
│   │   │   ├── fee.controller.ts
│   │   │   ├── fee.service.ts
│   │   │   └── dto/fee-quote.dto.ts
│   │   ├── nonce/
│   │   │   ├── nonce.module.ts
│   │   │   ├── nonce.controller.ts
│   │   │   └── nonce.service.ts
│   │   ├── relay/
│   │   │   ├── relay.module.ts
│   │   │   ├── relay.controller.ts
│   │   │   ├── relay.service.ts
│   │   │   ├── dto/relay-request.dto.ts
│   │   │   └── dto/relay-response.dto.ts
│   │   └── health/
│   │       ├── health.module.ts
│   │       └── health.controller.ts
│   └── config/
│       ├── configuration.ts
│       └── validation.ts
├── test/
│   ├── fee.e2e-spec.ts
│   ├── nonce.e2e-spec.ts
│   └── relay.e2e-spec.ts
└── package.json
```

## API Design

### Fee Quote Response

```typescript
interface FeeQuote {
  fee: string;            // "0.05" - token amount
  feeFormatted: string;   // "0.05 mantraUSD"
  gasPrice: string;       // Wei string
  gasPriceGwei: string;   // Human readable
  estimatedGas: number;   // 150000
  bufferPercent: number;  // 20
  expiresAt: number;      // Unix timestamp
  enabled: boolean;       // Fee toggle
}
```

### Relay Request

```typescript
interface RelayRequest {
  userAddress: string;      // Signer address
  signature: string;        // EIP-712 signature (hex)
  intent: {
    destination: string;    // Target contract
    value: string;          // Native value (wei)
    data: string;           // Encoded call (hex)
    nonce: string;          // User nonce
    deadline: string;       // Unix timestamp
  };
  chainId: number;          // For validation
}
```

## Security Design

### Signature Verification Flow

```
1. Parse request body
2. Validate all fields (class-validator)
3. Verify chainId matches backend's chain
4. Compute EIP-712 digest from intent
5. Recover signer from signature
6. Verify recovered address === userAddress
7. Verify nonce matches on-chain
8. Verify deadline > now
9. Simulate transaction
10. Broadcast if simulation succeeds
```

### Rate Limiting

- 10 requests per minute per IP address
- Use NestJS ThrottlerGuard
- Return 429 with retry-after header

### Gas Price Protection

- Reject if gas price > configured maximum
- Prevents relay during extreme volatility
- Configurable via environment variable

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Relayer runs out of gas | Monitor balance, alert at threshold |
| Gas price spikes | Fee buffer (20%), max gas price cap |
| Signature replay | Nonce verification, on-chain state is truth |
| DoS via many requests | Rate limiting, signature verification early |
| Failed transactions waste gas | Simulation before broadcast |

## Environment Variables

```bash
# Required
CHAIN_ID=5888
RPC_URL=https://rpc.mantrachain.io
RELAYER_PRIVATE_KEY=0x...
DELEGATED_ACCOUNT_ADDRESS=0x...

# Fee Configuration
FEE_ENABLED=true
FEE_ESTIMATED_GAS=150000
FEE_BUFFER_PERCENT=20
FEE_MIN=0.01
FEE_MAX=1.00
FEE_QUOTE_TTL_SECONDS=60

# Token Configuration
TOKEN_ADDRESS=0xd2b95283011E47257917770D28Bb3EE44c849f6F
TOKEN_DECIMALS=6
TOKEN_SYMBOL=mantraUSD

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=10

# Optional
MAX_GAS_PRICE_GWEI=100
PORT=3000
```

## Open Questions

1. **Transaction history**: Should we add optional database for tx history, or rely entirely on block explorer?
2. **Multi-token fees**: Accept fees in tokens other than mantraUSD? (Future scope)
3. **Webhooks**: Notify external services of transaction status? (Future scope)
