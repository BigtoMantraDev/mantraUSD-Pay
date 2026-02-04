# Project Context

## Purpose

**mantraUSD-Pay** is an EIP-7702 Gasless Transaction Relay for MANTRA Chain. It enables users to transfer ERC20 tokens and execute arbitrary contract calls without needing native tokens for gas (gasless UX).

### Key Goals
- Gasless transactions: Users sign, relayer pays gas
- Support ERC20 transfers and any contract calls
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
- **Backend**: NestJS modules (Relay, Fee, Blockchain)
- **Contracts**: Stateless delegation pattern (EIP-7702)
- Single network per backend deployment, chainId validated in requests

### Testing Strategy
- Unit tests for services and utilities
- Integration tests for API endpoints
- Contract tests with Foundry

### Git Workflow
- Feature branches from `main`
- PR reviews required
- Conventional commits preferred

## Domain Context

### Transaction Flow
1. User enters transfer details (recipient, amount) or builds contract call
2. Frontend fetches current fee quote from backend
3. User reviews total cost and confirms
4. User signs EIP-712 typed data (no gas needed)
5. Backend relays EIP-7702 transaction (pays gas)
6. Transaction confirmed on-chain

### Fee Model
| Parameter       | Value          | Description                         |
|-----------------|----------------|-------------------------------------|
| Estimated Gas   | 150,000        | Conservative estimate for EIP-7702  |
| Buffer          | 20%            | Covers gas price volatility         |
| Max Fee         | 1.00 mantraUSD | Hard cap to protect users           |
| Min Fee         | 0.01 mantraUSD | Minimum charge when enabled         |

### Token Information
| Network        | Address                                      | Symbol    | Decimals |
|----------------|----------------------------------------------|-----------|----------|
| Mainnet (5888) | `0xd2b95283011E47257917770D28Bb3EE44c849f6F` | mantraUSD | 6        |
| Testnet (5887) | `0x4B545d0758eda6601B051259bD977125fbdA7ba2` | mmUSD     | 6        |

### Key Contracts
- **DelegatedAccount**: EIP-7702 execution target for gasless txs

## Important Constraints

- **EIP-7702 Support**: MANTRA Chain must support Type 4 transactions
- **Fee Quote TTL**: 60 seconds to limit gas price volatility exposure
- **Max Fee**: 1.00 mantraUSD hard cap
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
├── contracts/     # Foundry smart contracts (DelegatedAccount.sol)
├── webapp/        # React frontend
└── backend/       # NestJS API + Relayer
```
