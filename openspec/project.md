# Project Context

## Purpose

mantraUSD-Pay is an EIP-7702 powered gasless scan-to-pay payment system for MANTRA Chain. It enables merchants to create payment requests as QR codes and customers to pay with mantraUSD tokens without needing to hold native OM for gas fees.

## Tech Stack

### Frontend
- React 19 with Vite
- TanStack Router (file-based routing)
- Tailwind CSS v4
- Wagmi + Viem (Ethereum interactions)
- AppKit (WalletConnect)

### Smart Contracts
- Solidity 0.8.x
- Foundry (development framework)
- EIP-7702 (Temporary EOA delegation)
- EIP-712 (Typed structured data signing)

### Backend
- NestJS (TypeScript)
- Transaction relay service
- Session management

### Infrastructure
- MANTRA Chain Mainnet (Chain ID: 5888)
- MANTRA Dukong Testnet (Chain ID: 5887)
- mantraUSD Token (payment currency)

## Project Conventions

### Code Style
- TypeScript strict mode for all frontend and backend code
- Solidity style guide following OpenZeppelin conventions
- Functional React components with hooks (no class components)
- File-based routing with TanStack Router

### Architecture Patterns
- Monorepo structure with Yarn workspaces
- Shared configuration package (@mantrausd-pay/config)
- Smart contracts are stateless delegation targets
- Frontend uses glassmorphism design with OMies brand identity
- All transactions use TransactionDialog flow for user feedback

### Testing Strategy
- Foundry tests for smart contracts
- Unit tests for frontend components
- Integration tests for contract interactions
- Simulation before transaction broadcast

### Git Workflow
- Feature branches from main
- PR-based reviews
- Conventional commits

## Domain Context

### EIP-7702 Background
EIP-7702 enables temporary EOA (Externally Owned Account) delegation via Type 4 transactions. This allows EOAs to execute smart contract logic without permanent migration, enabling:
- Gasless transactions (relayer sponsors gas)
- Atomic authorization + execution
- Revocable delegation controlled by EOA owner

### Payment Flow
1. Merchant creates payment session via backend API
2. Backend generates QR code with session ID
3. Customer scans QR code, opens payment webapp
4. Customer connects wallet and signs EIP-712 typed data (no gas needed)
5. Backend relays Type 4 transaction (pays gas on behalf of user)
6. Smart contract executes payment and marks session complete

### Fee Model
- **Customer Fee**: Dynamic gas-based fee calculated from current gas prices (optional)
- **Merchant Fee**: Fixed percentage-based service fee (optional)
- Both fees can be independently enabled/disabled
- Fees are capped at contract level for security

## Important Constraints

- Sessions have minimum 5 minutes and maximum 24 hours duration
- Maximum fee per type is 5% (500 basis points)
- Only whitelisted tokens can be used (initially mantraUSD only)
- Nonce management prevents replay attacks
- All signatures have expiration deadlines

## External Dependencies

- MANTRA Chain RPC endpoints
- mantraUSD ERC-20 token contract
- WalletConnect AppKit for wallet connections
- Block explorers for transaction links
