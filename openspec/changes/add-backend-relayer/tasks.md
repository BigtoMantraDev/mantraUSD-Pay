# Implementation Tasks

## 1. Project Setup

- [x] 1.1 Initialize NestJS 11 project in `packages/backend`
- [x] 1.2 Configure TypeScript strict mode and ESLint
- [x] 1.3 Add Viem 2.x for blockchain interactions
- [x] 1.4 Configure environment variables (.env schema)
- [x] 1.5 Add to workspace root package.json scripts

## 2. Blockchain Module

- [x] 2.1 Create BlockchainModule with Viem client provider
- [x] 2.2 Implement chain configuration (mainnet 5888, testnet 5887)
- [x] 2.3 Create RelayerWalletService for transaction signing
- [x] 2.4 Add gas price oracle service
- [x] 2.5 Write unit tests for blockchain services (blockchain.service, relayer-wallet.service, gas-oracle.service)

## 3. Fee Module

- [x] 3.1 Create FeeModule with FeeService
- [x] 3.2 Implement `GET /fees/quote` endpoint
- [x] 3.3 Add fee calculation logic (gas × price × buffer)
- [x] 3.4 Implement fee caps (min 0.01, max 1.00)
- [x] 3.5 Add quote TTL (60 seconds expiration)
- [x] 3.6 Write unit tests for fee calculation (comprehensive fee.service.spec.ts)
- [ ] 3.7 Write e2e tests for fee endpoint

## 4. Nonce Module

- [x] 4.1 Create NonceModule with NonceService
- [x] 4.2 Implement `GET /nonce/:address` endpoint
- [x] 4.3 Query DelegatedAccount.getNonce() on-chain
- [x] 4.4 Add chainId query parameter validation
- [x] 4.5 Write unit tests for nonce service (nonce.service.spec.ts)
- [ ] 4.6 Write e2e tests for nonce endpoint

## 5. Relay Module

- [x] 5.1 Create RelayModule with RelayService
- [x] 5.2 Implement `POST /relay` endpoint with request validation
- [x] 5.3 Add EIP-712 signature recovery and verification
- [x] 5.4 Implement transaction simulation before broadcast
- [x] 5.5 Build and send EIP-7702 Type 4 transaction
- [x] 5.6 Implement `GET /relay/status` for relayer health
- [x] 5.7 Add rate limiting (10 req/min/IP)
- [x] 5.8 Write unit tests for relay service (relay.service.spec.ts with EIP-712 verification)
- [ ] 5.9 Write e2e tests for relay endpoints

## 6. Health & Monitoring

- [x] 6.1 Add NestJS Terminus health checks
- [x] 6.2 Implement relayer balance monitoring
- [x] 6.3 Add structured logging (JSON format)
- [x] 6.4 Configure Swagger/OpenAPI documentation (Scalar integration at /scalar)

## 7. Integration Testing

- [ ] 7.1 Create test fixtures (mock wallets, signatures)
- [ ] 7.2 Write end-to-end relay flow test (local anvil)
- [ ] 7.3 Test error handling paths
- [ ] 7.4 Test rate limiting behavior

## 8. Documentation

- [x] 8.1 Write API documentation in README
- [x] 8.2 Document environment variables
- [x] 8.3 Add deployment guide
