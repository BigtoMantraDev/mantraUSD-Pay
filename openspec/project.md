# Project Context

## Purpose

mantraUSD-Pay is an EIP-7702 gasless scan-to-pay payment system built for MANTRA Chain. It enables customers to make mantraUSD payments by scanning QR codes, with gas sponsored by a backend relayer service using temporary EOA delegation.

## Tech Stack

**Frontend:**
- React 19 with TypeScript (strict mode)
- Vite build system
- TanStack Router (file-based routing)
- Wagmi + Viem (Web3 interactions)
- AppKit (WalletConnect integration)
- Tailwind CSS v4
- ShadCN UI components

**Smart Contracts:**
- Foundry (Solidity development)
- EIP-7702 DelegatedAccount implementation
- SessionRegistry for payment sessions

**Backend:**
- NestJS (planned)
- Transaction relayer/paymaster service

**Monorepo:**
- Yarn Berry (Modern)
- packages/webapp (customer payment PWA)
- packages/contracts (Foundry)
- packages/config (shared configuration)

## Project Conventions

### Code Style
- TypeScript strict mode, no `any` types
- Functional React components with hooks
- Use `createFileRoute` for TanStack Router type safety
- ESLint + Prettier for code formatting
- Kebab-case for file names, PascalCase for components

### Architecture Patterns
- Monorepo with shared configuration package
- Config package as single source of truth for chains, contracts, tokens, fees
- File-based routing in webapp
- EIP-712 typed signatures for user authorization
- EIP-7702 temporary delegation for gasless transactions

### Configuration Package
The `packages/webapp/src/config/` directory contains:
- **chains.ts** - Supported chain definitions and default chain logic
- **types.ts** - TypeScript interfaces for ChainConfig
- **wagmi.ts** - Wagmi/AppKit setup using chain configs
- **networks/** - Per-network configuration files (mantra-mainnet.ts, mantra-dukong.ts, local.ts)

All applications must import configuration from this package to ensure consistency.

### Testing Strategy
- Use existing test infrastructure in repository
- Minimal modifications unless tests are broken by changes
- Test contract interactions with Foundry
- Frontend testing with React Testing Library (when added)

### Git Workflow
- Feature branches from main
- Descriptive commit messages
- Use report_progress tool for commits (do not use git directly)
- Small, incremental changes

## Domain Context

**EIP-7702 Delegation:**
- Temporary EOA delegation allowing smart contract logic without wallet migration
- Type 4 transactions with authorization_list
- User signs EIP-712 typed data for execution intent
- Relayer sponsors gas and submits transaction

**Fee Model:**
- **Customer Fee**: Dynamic gas-based fee (can be enabled/disabled)
- **Merchant Fee**: Fixed percentage service fee (can be enabled/disabled)
- Independent toggles allow flexible business models

**mantraUSD Token:**
- Mainnet (5888): `0xd2b95283011E47257917770D28Bb3EE44c849f6F` (symbol: mantraUSD, 6 decimals)
- Testnet (5887): `0x4B545d0758eda6601B051259bD977125fbdA7ba2` (symbol: mmUSD, 6 decimals)

## Important Constraints

- Must support MANTRA Mainnet (5888) and Dukong Testnet (5887)
- Configuration is static at build time (no runtime config updates)
- Fee parameters defined in code (requires deployment to change)
- Must be compatible with Viem/Wagmi for Web3 interactions
- Type safety required for all configuration access

## External Dependencies

- **WalletConnect** (via AppKit) - Wallet connection
- **MANTRA Chain RPC** - Blockchain interaction
- **Goldsky Subgraph** - Event indexing (planned)
- **Block Explorers** - Transaction viewing
  - Mainnet: https://blockscout.mantrascan.io
  - Testnet: https://explorer.dukong.io
