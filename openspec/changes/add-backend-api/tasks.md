# Tasks: Add Backend API

## 1. Project Setup

- [ ] 1.1 Initialize NestJS project in `packages/backend`
- [ ] 1.2 Configure TypeScript with strict mode
- [ ] 1.3 Set up ESLint and Prettier matching workspace config
- [ ] 1.4 Configure environment variables (.env.example, validation)
- [ ] 1.5 Add Docker and docker-compose configuration
- [ ] 1.6 Set up health check endpoint (`/health`)

## 2. Blockchain Module

- [ ] 2.1 Create `BlockchainModule` with Viem integration
- [ ] 2.2 Implement chain configuration loading from env
- [ ] 2.3 Create public client factory for read operations
- [ ] 2.4 Create wallet client factory for write operations
- [ ] 2.5 Add contract type definitions (SessionRegistry, DelegatedAccount, ERC20)
- [ ] 2.6 Implement gas price fetching service
- [ ] 2.7 Add transaction submission with receipt waiting
- [ ] 2.8 Write unit tests for blockchain service

## 3. Fee Module

- [ ] 3.1 Create `FeeModule` with fee calculation service
- [ ] 3.2 Implement dynamic customer fee calculation
  - Fetch gas price
  - Apply validated conservative gas estimate for EIP-7702 on MANTRA Chain (default 150,000 from fee-calculation spec; confirm via testing)
  - Apply buffer percent (20%)
  - Convert to mantraUSD
  - Apply min/max caps
- [ ] 3.3 Implement merchant fee calculation (basis points)
- [ ] 3.4 Create fee quote endpoint (`GET /fees/quote`)
- [ ] 3.5 Implement quote TTL and expiration logic
- [ ] 3.6 Write unit tests for fee calculation
- [ ] 3.7 Write integration tests for fee endpoint

## 4. Session Module

- [ ] 4.1 Create `SessionModule` with session service
- [ ] 4.2 Define DTOs with validation (CreateSessionDto, etc.)
- [ ] 4.3 Implement session creation endpoint (`POST /sessions`)
  - Validate merchant address
  - Calculate fees
  - Call SessionRegistry.createSession()
  - Generate QR code URL
- [ ] 4.4 Implement session retrieval endpoint (`GET /sessions/{id}`)
- [ ] 4.5 Implement session validity check (`GET /sessions/{id}/valid`)
- [ ] 4.6 Implement merchant sessions list (`GET /sessions/merchant/{address}`)
- [ ] 4.7 Add in-memory session cache with TTL
- [ ] 4.8 Write unit tests for session service
- [ ] 4.9 Write integration tests for session endpoints

## 5. Relay Module

- [ ] 5.1 Create `RelayModule` with relay service
- [ ] 5.2 Define RelayRequestDto with validation
- [ ] 5.3 Implement signature verification (EIP-712 recovery)
- [ ] 5.4 Implement nonce validation against chain
- [ ] 5.5 Implement session state validation
- [ ] 5.6 Implement transaction simulation (`eth_call`)
- [ ] 5.7 Build EIP-7702 Type 4 transaction
- [ ] 5.8 Implement relay endpoint (`POST /relay`)
- [ ] 5.9 Implement relayer status endpoint (`GET /relay/status`)
- [ ] 5.10 Add rate limiting (10 req/min/IP)
- [ ] 5.11 Write unit tests for relay service
- [ ] 5.12 Write integration tests for relay endpoints

## 6. Security & Middleware

- [ ] 6.1 Configure CORS for allowed origins
- [ ] 6.2 Add request validation pipe globally
- [ ] 6.3 Implement rate limiting middleware
- [ ] 6.4 Add structured logging (pino or winston)
- [ ] 6.5 Configure Swagger/OpenAPI documentation
- [ ] 6.6 Add request ID tracking for tracing

## 7. Testing & Documentation

- [ ] 7.1 Write E2E tests for complete payment flow
- [ ] 7.2 Add test fixtures for chain interactions (mock provider)
- [ ] 7.3 Update API documentation in openspec for Scan to Pay
- [ ] 7.4 Create Postman/Insomnia collection
- [ ] 7.5 Write deployment guide

## 8. DevOps & Deployment

- [ ] 8.1 Create Dockerfile for production build
- [ ] 8.2 Configure docker-compose for local development
- [ ] 8.3 Add GitHub Actions CI workflow
- [ ] 8.4 Create deployment configuration (Railway/Render/etc.)
- [ ] 8.5 Set up monitoring and alerting basics

## Dependencies

```
Task 2 (Blockchain) ─┬─► Task 3 (Fee)
                     │
                     ├─► Task 4 (Session)
                     │
                     └─► Task 5 (Relay)

Task 3 (Fee) ────────► Task 4 (Session)
Task 4 (Session) ────► Task 5 (Relay)

Task 6 (Security) runs parallel after Task 1
Task 7 (Testing) runs after Tasks 2-5
Task 8 (DevOps) runs parallel after Task 1
```

## Parallelizable Work

| Phase | Tasks                                    |
|-------|------------------------------------------|
| 1     | 1.1-1.6, 6.1-6.3, 8.1-8.2 (Setup)        |
| 2     | 2.1-2.8 (Blockchain)                     |
| 3     | 3.1-3.7, 4.1-4.2 (Fee + Session DTOs)    |
| 4     | 4.3-4.9, 5.1-5.2 (Session + Relay DTOs)  |
| 5     | 5.3-5.12 (Relay implementation)          |
| 6     | 6.4-6.6, 7.1-7.5, 8.3-8.5 (Polish)       |

## Validation Criteria

- [ ] All endpoints respond correctly per API spec
- [ ] Rate limiting blocks excessive requests
- [ ] Invalid signatures are rejected with 401
- [ ] Expired sessions return 410
- [ ] Fulfilled sessions return 409
- [ ] Fee calculation matches expected values
- [ ] E2E test completes full payment flow
- [ ] Docker container runs successfully
- [ ] Health check returns 200
