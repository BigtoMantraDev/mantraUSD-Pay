# Local Development Chain

When running the application in development mode (`yarn dev`), a local development chain option becomes available in the network selector. This allows you to test your dApp against a local MANTRA chain instance.

## Setup

1. **Start your local MANTRA chain** in a Docker container:
   ```bash
   # Example docker command (adjust based on your setup)
   docker run -p 8545:8545 your-mantra-local-image
   ```

2. **Chain Configuration**:
   - **RPC Endpoint**: `http://localhost:8545`
   - **EVM Chain ID**: `1337`
   - **Cosmos Chain ID**: `mantra-local-1`
   - **Native Token**: OM

3. **Connect to Local Chain**:
   - Start the development server: `yarn dev`
   - Open the application in your browser
   - In the network selector, choose "Local Development"
   - Connect your wallet and switch to chain ID 1337

## Features

- **Available in development only**: The local chain option is automatically hidden in production builds
- **Pre-funded accounts**: Use test accounts with pre-funded OM tokens for testing
- **Standard EVM operations**: Send tokens, interact with smart contracts using the same methods as mainnet
- **No faucet needed**: The faucet button is disabled for local chain since you should have pre-funded test accounts

## Testing Token Transfers

1. Connect your wallet to the local development chain
2. Use the "Send Tokens" form to transfer OM between accounts
3. Transactions will be processed instantly on your local chain
4. Monitor the local chain logs to see transaction details

## Troubleshooting

- **Chain not appearing**: Make sure you're running in development mode (`yarn dev`)
- **Connection issues**: Verify your local chain is running on `http://localhost:8545`
- **MetaMask issues**: You may need to manually add the local network to MetaMask:
  - Network Name: MANTRA Local
  - RPC URL: http://localhost:8545
  - Chain ID: 1337
  - Currency Symbol: OM