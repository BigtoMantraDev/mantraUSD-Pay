# Backend Relayer Service

NestJS backend service that relays gasless EIP-7702 transactions for mantraUSD-Pay. Users sign EIP-712 typed data off-chain, and this service broadcasts transactions to MANTRA Chain while paying gas fees on their behalf.

## Features

- **Fee API**: Calculate and quote relay fees based on current gas prices
- **Nonce API**: Query on-chain nonces for user accounts
- **Relay API**: Accept signed intents and broadcast EIP-7702 transactions
- **Health Checks**: Monitor relayer status and balance
- **Rate Limiting**: Prevent abuse (10 requests/min per IP)
- **Gas Price Protection**: Reject during extreme volatility

## Tech Stack

- **Framework**: NestJS 11
- **Blockchain**: Viem 2.x (EIP-7702 support)
- **Validation**: class-validator + class-transformer
- **Health**: @nestjs/terminus
- **Rate Limiting**: @nestjs/throttler

## Prerequisites

- Node.js 18+
- Yarn 4 (Berry)
- Access to MANTRA Chain RPC
- Relayer wallet with native tokens for gas

## Installation

```bash
# From workspace root
yarn install

# Or from packages/backend
cd packages/backend
yarn install
```

## Configuration

Copy `.env.example` to `.env` and configure.

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `CHAIN_ID` | MANTRA Chain ID | `5888` (mainnet) or `5887` (testnet) |
| `RPC_URL` | JSON-RPC endpoint | `https://rpc.mantrachain.io` |
| `RELAYER_PRIVATE_KEY` | Relayer wallet private key | `0x...` |
| `DELEGATED_ACCOUNT_ADDRESS` | Deployed DelegatedAccount contract | `0x...` |
| `TOKEN_ADDRESS` | mantraUSD token address | `0xd2b95283011E47257917770D28Bb3EE44c849f6F` |

## Running the Service

```bash
# Development
yarn workspace backend start:dev

# Production
yarn workspace backend build
yarn workspace backend start:prod
```

## API Endpoints

See implementation files for complete API documentation:
- Fee API: `GET /fees/quote`
- Nonce API: `GET /nonce/:address`
- Relay API: `POST /relay`, `GET /relay/status`
- Health: `GET /health`

## Security

- EIP-712 signature verification
- Rate limiting (10 req/min per IP)
- Gas price protection
- Chain ID validation

## Architecture

```
src/
├── main.ts
├── app.module.ts
├── config/
│   ├── configuration.ts
│   └── validation.ts
└── modules/
    ├── blockchain/
    ├── fee/
    ├── nonce/
    ├── relay/
    └── health/
```

## License

See root LICENSE file.
