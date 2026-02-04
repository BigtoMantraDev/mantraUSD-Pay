# Change: Add Backend Relayer Service

## Why

The mantraUSD-Pay system requires a backend service to relay gasless transactions. Users sign EIP-712 typed data off-chain, and the relayer broadcasts EIP-7702 Type 4 transactions to MANTRA Chain while paying gas on behalf of users. Without this service, users cannot execute gasless transactions.

## What Changes

- **NEW**: Create `packages/backend` NestJS application
- **NEW**: Fee Module - Calculate relay fees based on gas prices
- **NEW**: Relay Module - Accept signed intents and broadcast EIP-7702 transactions
- **NEW**: Nonce Module - Query on-chain nonces for accounts
- **NEW**: Blockchain Module - Shared Viem client and chain configuration
- **NEW**: Health Module - Service health and relayer status checks

## Impact

- Affected specs: Creates new `relay-api`, `fee-api`, `nonce-api` capabilities
- Affected code: Creates `packages/backend/` directory structure
- Dependencies: NestJS 11, Viem 2.x, class-validator, class-transformer
- Infrastructure: Requires relayer wallet with native tokens for gas
