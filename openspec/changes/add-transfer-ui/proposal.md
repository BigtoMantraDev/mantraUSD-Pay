# Change: Add Gasless Transfer UI

## Why

The mantraUSD-Pay system requires a user interface for gasless ERC20 transfers. Users need to:
1. Enter recipient and amount
2. See fee quotes before signing
3. Sign EIP-712 typed data (no gas needed)
4. Track transaction status through the relay process

The existing webapp provides foundational components (TokenInput, TransactionDialog, useAppConfig) that we can extend for the gasless relay flow.

## What Changes

- **NEW**: Route `/` - Gasless transfer home page (replaces template placeholder)
- **NEW**: Route `/transfer` - Dedicated transfer page with full UI
- **NEW**: `useEIP712Sign` hook - Build and sign EIP-712 typed data for DelegatedAccount
- **NEW**: `useRelayTransaction` hook - Submit signed intent to backend relay
- **NEW**: `useFeeQuote` hook - Fetch current fee quote from backend
- **NEW**: `useNonce` hook - Query user's current nonce
- **NEW**: `TransferForm` component - Main transfer form with validation
- **NEW**: `FeeDisplay` component - Show relay fee and expiration
- **NEW**: `RelayStatus` component - Show transaction relay progress
- **MODIFIED**: `ChainConfig` type - Add `delegatedAccount` and `backendUrl` fields
- **MODIFIED**: Network configs - Add new contract addresses and backend URLs

## Impact

- Affected specs: Creates new `transfer-ui` capability
- Affected code: `packages/webapp/src/routes/`, `packages/webapp/src/hooks/`, `packages/webapp/src/components/features/`
- Dependencies: Backend relayer must be running (see add-backend-relayer proposal)
- User-facing: Complete gasless transfer flow
