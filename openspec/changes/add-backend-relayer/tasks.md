# Implementation Tasks

## 1. Project Setup

- [ ] 1.1 Initialize NestJS 11 project in `packages/backend`
- [ ] 1.2 Configure TypeScript strict mode and ESLint
- [ ] 1.3 Add Viem 2.x for blockchain interactions
- [ ] 1.4 Configure environment variables (.env schema)
- [ ] 1.5 Add to workspace root package.json scripts

## 2. Blockchain Module

- [ ] 2.1 Create BlockchainModule with Viem client provider
- [ ] 2.2 Implement chain configuration (mainnet 5888, testnet 5887)
- [ ] 2.3 Create RelayerWalletService for transaction signing
- [ ] 2.4 Add gas price oracle service
- [ ] 2.5 Write unit tests for blockchain services

## 3. Fee Module

- [ ] 3.1 Create FeeModule with FeeService
- [ ] 3.2 Implement `GET /fees/quote` endpoint
- [ ] 3.3 Add fee calculation logic (gas × price × buffer)
- [ ] 3.4 Implement fee caps (min 0.01, max 1.00)
- [ ] 3.5 Add quote TTL (60 seconds expiration)
- [ ] 3.6 Write unit tests for fee calculation
- [ ] 3.7 Write e2e tests for fee endpoint

## 4. Nonce Module

- [ ] 4.1 Create NonceModule with NonceService
- [ ] 4.2 Implement `GET /nonce/:address` endpoint
- [ ] 4.3 Query DelegatedAccount.getNonce() on-chain
- [ ] 4.4 Add chainId query parameter validation
- [ ] 4.5 Write unit tests for nonce service
- [ ] 4.6 Write e2e tests for nonce endpoint

## 5. Relay Module

- [ ] 5.1 Create RelayModule with RelayService
- [ ] 5.2 Implement `POST /relay` endpoint with request validation
- [ ] 5.3 Add EIP-712 signature recovery and verification
- [ ] 5.4 Implement transaction simulation before broadcast
- [ ] 5.5 Build and send EIP-7702 Type 4 transaction
- [ ] 5.6 Implement `GET /relay/status` for relayer health
- [ ] 5.7 Add rate limiting (10 req/min/IP)
- [ ] 5.8 Write unit tests for relay service
- [ ] 5.9 Write e2e tests for relay endpoints

## 6. Health & Monitoring

- [ ] 6.1 Add NestJS Terminus health checks
- [ ] 6.2 Implement relayer balance monitoring
- [ ] 6.3 Add structured logging (JSON format)
- [ ] 6.4 Configure Swagger/OpenAPI documentation

## 7. Integration Testing

- [ ] 7.1 Create test fixtures (mock wallets, signatures)
- [ ] 7.2 Write end-to-end relay flow test (local anvil)
- [ ] 7.3 Test error handling paths
- [ ] 7.4 Test rate limiting behavior

## 8. Documentation

- [ ] 8.1 Write API documentation in README
- [ ] 8.2 Document environment variables
- [ ] 8.3 Add deployment guide
