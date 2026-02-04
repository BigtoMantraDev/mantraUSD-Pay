# MANTRA Smart Contracts

Smart contracts for deployment on MANTRA Chain using Foundry.

## Supported Networks

- **Local Development**: Chain ID `1337` (Anvil/Hardhat)
- **MANTRA Dukong Testnet**: Chain ID `5887`
- **MANTRA Mainnet**: Chain ID `5888`

## Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your private key:
   - For local development, the default Anvil private key is already set
   - For testnet/mainnet, replace with your actual private key
   - **NEVER commit the `.env` file to version control**

## Configuration

The project uses two configuration files:

- **`foundry.toml`**: Foundry project settings and RPC endpoints
- **`config/chains.toml`**: Chain-specific configuration (addresses, explorers, etc.)

## Important Contract Addresses

### MANTRA Mainnet (Chain ID: 5888)
- **HSC**: `0x0000F90827F1C53a10cb7A02335B175320002935`
- **Create2**: `0x4e59b44847b379578588920cA78FbF26c0B4956C`
- **Createx**: `0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed`
- **Multicall3**: `0xcA11bde05977b3631167028862bE2a173976CA11`
- **Wrapped OM**: `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598`

### MANTRA Dukong Testnet (Chain ID: 5887)
- **HSC**: `0x0000F90827F1C53a10cb7A02335B175320002935`
- **Create2**: `0x4e59b44847b379578588920cA78FbF26c0B4956C`
- **Createx**: `0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed`
- **Multicall3**: `0xcA11bde05977b3631167028862bE2a173976CA11`
- **Wrapped OM**: `0x10d26F0491fA11c5853ED7C1f9817b098317DC46`

## Usage

### Testing

```bash
# Run tests
forge test

# Run tests with gas report
forge test --gas-report

# Run tests with coverage
forge coverage

# Watch mode
forge test --watch
```

### Deployment

#### Local Development (Anvil)

1. Start Anvil in a separate terminal:
```bash
anvil
```

2. Deploy contracts:
```bash
# From project root
yarn contracts:deploy:local

# Or from contracts directory
forge script script/Counter.s.sol:CounterScript --rpc-url local --broadcast
```

#### Testnet (Dukong)

```bash
# From project root
yarn contracts:deploy:dukong

# Or from contracts directory
forge script script/Counter.s.sol:CounterScript --rpc-url mantra_dukong --broadcast --verify
```

#### Mainnet

```bash
# From project root
yarn contracts:deploy:mainnet

# Or from contracts directory
forge script script/Counter.s.sol:CounterScript --rpc-url mantra_mainnet --broadcast --verify
```

### Contract Verification

Contracts are automatically verified on Blockscout when using the `--verify` flag. Make sure you have:
1. Set `BLOCKSCOUT_API_KEY` in your `.env` file (if required)
2. The correct Blockscout API URL configured in `foundry.toml`

To verify manually:
```bash
forge verify-contract <contract_address> <contract_name> --chain-id <chain_id>
```

## Block Explorers

- **Mainnet**: https://blockscout.mantrascan.io
- **Dukong Testnet**: https://explorer.dukong.io
- **Faucet** (Testnet): https://faucet.dukong.mantrachain.io

## Additional Resources

- [MANTRA Chain Documentation](https://docs.mantrachain.io)
- [Foundry Book](https://book.getfoundry.sh)
- [Foundry GitHub](https://github.com/foundry-rs/foundry)
