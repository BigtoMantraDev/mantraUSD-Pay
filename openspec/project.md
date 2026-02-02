# Project Context

## Purpose

**mantraUSD-Pay** is an EIP-7702 Gasless Scan-to-Pay system for MANTRA Chain. It enables merchants to accept mantraUSD payments via QR codes, where customers pay without needing native tokens for gas (gasless UX).

### Key Goals
- Gasless payments: Users sign, relayer pays gas
- QR-based merchant payments with session management
- Dynamic fee calculation based on real-time gas prices
- Support for MANTRA Mainnet (5888) and Dukong Testnet (5887)

## Tech Stack

### Frontend (packages/webapp)
- React 19, Vite, TypeScript
- TanStack Router (file-based routing)
- Wagmi + Viem for Web3
- AppKit (WalletConnect)
- Tailwind CSS v4, ShadCN UI

### Backend (packages/backend)
- NestJS with TypeScript
- Viem for blockchain interactions
- class-validator for request validation

### Smart Contracts (packages/contracts)
- Foundry (Solidity)
- DelegatedAccount.sol - EIP-7702 implementation
- SessionRegistry.sol - Payment session management

### Shared
- Yarn workspaces (monorepo)
- ESLint, Prettier

## Project Conventions

### Code Style
- TypeScript strict mode
- Functional components with hooks (React)
- No `useMemo`/`useCallback` unless strictly necessary
- Use `cn()` utility for Tailwind class merging

### Architecture Patterns
- **Frontend**: File-based routing with TanStack Router
- **Backend**: NestJS modules (Session, Relay, Fee, Blockchain)
- **Contracts**: Stateless delegation pattern (EIP-7702)
- Single network per backend deployment, chainId validated in requests

### Testing Strategy
- Unit tests for services and utilities
- Integration tests for API endpoints
- E2E tests for complete payment flows
- Contract tests with Foundry

### Git Workflow
- Feature branches from `main`
- PR reviews required
- Conventional commits preferred

## Domain Context

### Payment Flow
1. Merchant creates session (amount, reference, duration)
2. QR code generated with payment URL
3. Customer scans, connects wallet, reviews payment
4. Customer signs EIP-712 typed data (no gas needed)
5. Backend relays EIP-7702 transaction (pays gas)
6. Session marked fulfilled on-chain

### Fee Model
| Fee Type     | Calculation                  | Recipient      |
|--------------|------------------------------|----------------|
| Customer Fee | Dynamic (gas × buffer)       | Relayer        |
| Merchant Fee | Fixed percentage (bps)       | Fee Collector  |

### Token Information
| Network        | Address                                      | Symbol    | Decimals |
|----------------|----------------------------------------------|-----------|----------|
| Mainnet (5888) | `0xd2b95283011E47257917770D28Bb3EE44c849f6F` | mantraUSD | 6        |
| Testnet (5887) | `0x4B545d0758eda6601B051259bD977125fbdA7ba2` | mmUSD     | 6        |

### Key Contracts
- **SessionRegistry**: Payment session CRUD, fee config, fulfillment
- **DelegatedAccount**: EIP-7702 execution target for gasless txs

## Important Constraints

- **EIP-7702 Support**: MANTRA Chain must support Type 4 transactions
- **Fee Quote TTL**: 60 seconds to limit gas price volatility exposure
- **Max Fees**: Customer fee capped at 1.00 mantraUSD, merchant fee at 5%
- **Session Duration**: Min 5 minutes, max 24 hours
- **Rate Limiting**: 10 requests/minute/IP on relay endpoint

## External Dependencies

| Dependency       | Purpose                          |
|------------------|----------------------------------|
| MANTRA Chain RPC | Blockchain interactions          |
| WalletConnect    | Mobile wallet connections        |
| Block Explorer   | Transaction verification links   |

## Repository Structure

```
packages/
├── contracts/     # Foundry smart contracts
├── webapp/        # Customer payment PWA
├── backend/       # NestJS API + Relayer
└── config/        # Shared configuration (future)
```
