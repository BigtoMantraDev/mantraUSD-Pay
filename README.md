<!-- prettier-ignore -->
<div align="center">

<img src="./packages/webapp/public/favicon.svg" alt="OMies Logo" align="center" height="64" />

# OMies dApp Template

**Production-ready Web3 monorepo for MANTRA Chain**

[![Dukong Testnet](https://img.shields.io/website?url=https%3A%2F%2Fdapp-template-nonprod.mantra-development.workers.dev&up_message=online&down_message=offline&label=Testnet&style=flat-square)](https://dapp-template-nonprod.mantra-development.workers.dev)
[![Mainnet](https://img.shields.io/website?url=https%3A%2F%2Fdapp-template-prod.mantra-chain-new-account.workers.dev&up_message=online&down_message=offline&label=Mainnet&style=flat-square)](https://dapp-template-prod.mantra-chain-new-account.workers.dev)
![Node](https://img.shields.io/badge/Node.js-≥22-3c873a?style=flat-square&logo=node.js&logoColor=white)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-087ea4?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Foundry](https://img.shields.io/badge/Foundry-1.0-14191e?style=flat-square)](https://book.getfoundry.sh)

[Quick Start](#-quick-start) · [Features](#-features) · [Commands](#-commands) · [Stack](#-tech-stack) · [Docs](#-documentation)

</div>

---

## ⚡ Quick Start

```bash
# Clone and enter the project
git clone https://github.com/mantramatt/omies-dapp-spa-template.git
cd omies-dapp-spa-template

# Install dependencies
yarn install

# Start the development server
yarn dev
```

**That's it!** Open [http://localhost:5173](http://localhost:5173) to see your dApp.

> [!TIP]
> **New to the project?** Run the setup wizard to personalize the template:
> ```bash
> ./setup.sh
> ```

---

## ✨ Features

| Category              | What You Get                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **🔗 Smart Contracts** | Solidity + [Foundry](https://book.getfoundry.sh) with deployment scripts, auto-verification                               |
| **⚛️ Frontend**        | React 19, TypeScript, Vite, TanStack Router (file-based)                                                                  |
| **🎨 Design System**   | [ShadCN UI](https://ui.shadcn.com) + OMies visual identity (teal cartoon aesthetic)                                       |
| **👛 Web3**            | [Wagmi](https://wagmi.sh) + [Viem](https://viem.sh) + [AppKit](https://reown.com/appkit) (MetaMask, WalletConnect, Keplr) |
| **📦 Monorepo**        | Yarn workspaces with shared configs and independent packages                                                              |
| **🚀 Deployment**      | Cloudflare Workers edge deployment, automatic contract verification                                                       |
| **🛠 DX**              | Storybook, DevTools page, Kitchen Sink, hot reload                                                                        |

### Pre-built Components

15+ Web3 components ready to use:

- `WalletConnectPill` — Custom wallet button with balance + address
- `TransactionDialog` — Review → Sign → Pending → Success flow
- `TokenInput` — Amount input with max button + balance
- `AddressDisplay` — Shortened address with copy + explorer link
- `NetworkBanner` — Testnet/unsupported network warnings
- `ConnectGuard` — Protect routes for connected users only

**[See all components →](./packages/webapp/README.md#whats-included)**

---

## 🏗 Project Structure

```
omies-dapp-spa-template/
├── packages/
│   ├── contracts/          # 🔗 Foundry smart contracts
│   │   ├── src/            # Solidity source files
│   │   ├── script/         # Deployment scripts
│   │   └── test/           # Contract tests
│   │
│   └── webapp/             # ⚛️ React SPA (your main workspace)
│       ├── src/
│       │   ├── components/ # UI + Web3 components
│       │   ├── config/     # Chain configs (file-per-network)
│       │   ├── hooks/      # Custom React hooks
│       │   └── routes/     # TanStack file-based routes
│       └── public/         # Static assets
│
├── docs/
│   ├── dev/                # 📖 Developer documentation
│   └── agents/             # 🤖 AI assistant instructions
│
└── openspec/               # 📋 Project specifications
```

---

## 📋 Commands

All commands run from the **repository root**.

### Development

| Command          | Description                                                       |
| ---------------- | ----------------------------------------------------------------- |
| `yarn dev`       | Start webapp dev server ([localhost:5173](http://localhost:5173)) |
| `yarn build`     | Build webapp for production                                       |
| `yarn storybook` | Component development ([localhost:6006](http://localhost:6006))   |

### Smart Contracts

| Command                         | Description              |
| ------------------------------- | ------------------------ |
| `yarn contracts:test`           | Run Foundry tests        |
| `yarn contracts:test:watch`     | Tests in watch mode      |
| `yarn contracts:deploy:local`   | Deploy to local Anvil    |
| `yarn contracts:deploy:dukong`  | Deploy to Dukong testnet |
| `yarn contracts:deploy:mainnet` | Deploy to mainnet        |

### Dependencies

```bash
# Add package to webapp
yarn workspace @dapp-evm/webapp add [package]

# Add dev dependency
yarn workspace @dapp-evm/webapp add -D [package]
```

---

## 🔧 Configuration

### Environment Variables

Create `packages/webapp/.env`:

```env
# Required for wallet connections
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

Get your Project ID at [WalletConnect Cloud](https://cloud.walletconnect.com/).

For contracts, copy and configure:
```bash
cp packages/contracts/.env.example packages/contracts/.env
```

### Supported Networks

| Network            | Chain ID | RPC Endpoint                        | Explorer                                                     |
| ------------------ | -------- | ----------------------------------- | ------------------------------------------------------------ |
| **Mainnet**        | `5888`   | `https://evm.mantrachain.io`        | [blockscout.mantrascan.io](https://blockscout.mantrascan.io) |
| **Dukong Testnet** | `5887`   | `https://evm.dukong.mantrachain.io` | [explorer.dukong.io](https://explorer.dukong.io)             |
| **Local (Anvil)**  | `1337`   | `http://localhost:8545`             | —                                                            |

### Adding a New Network

1. Create config file: `packages/webapp/src/config/networks/[network].ts`
2. Export chain definition and config object
3. Register in `packages/webapp/src/config/chains.ts`

**[Step-by-step guide →](./docs/dev/WORKFLOWS.md#how-to-add-a-new-network)**

---

## 🛠 Tech Stack

| Layer          | Technology                                                                | Purpose                             |
| -------------- | ------------------------------------------------------------------------- | ----------------------------------- |
| **Framework**  | [React 19](https://react.dev)                                             | UI library with latest features     |
| **Build**      | [Vite](https://vite.dev)                                                  | Lightning-fast dev server & bundler |
| **Routing**    | [TanStack Router](https://tanstack.com/router)                            | Type-safe file-based routing        |
| **Styling**    | [Tailwind CSS v4](https://tailwindcss.com)                                | Utility-first CSS                   |
| **Components** | [ShadCN/UI](https://ui.shadcn.com)                                        | Accessible primitives               |
| **Web3**       | [Wagmi](https://wagmi.sh) + [Viem](https://viem.sh)                       | Ethereum interactions               |
| **Wallets**    | [AppKit](https://reown.com/appkit)                                        | Multi-wallet connections            |
| **State**      | [TanStack Query](https://tanstack.com/query) + [Jotai](https://jotai.org) | Server & client state               |
| **Contracts**  | [Foundry](https://book.getfoundry.sh)                                     | Solidity development toolkit        |
| **Deployment** | [Cloudflare Workers](https://workers.cloudflare.com)                      | Edge hosting                        |

---

## 📖 Documentation

### For Developers

| Document                                               | Description                                  |
| ------------------------------------------------------ | -------------------------------------------- |
| **[Getting Started](./docs/dev/GETTING_STARTED.md)**   | Quick start, key concepts, project structure |
| **[Architecture Guide](./docs/dev/ARCHITECTURE.md)**   | Config system, state management, patterns    |
| **[Workflows](./docs/dev/WORKFLOWS.md)**               | Step-by-step guides for common tasks         |
| **[Webapp README](./packages/webapp/README.md)**       | Component reference, hooks, usage examples   |
| **[Contracts README](./packages/contracts/README.md)** | Contract addresses, deployment, testing      |

### For AI Assistants

| Document                                                        | Description                               |
| --------------------------------------------------------------- | ----------------------------------------- |
| **[Master Instructions](./docs/agents/MASTER_INSTRUCTIONS.md)** | Complete system prompt for LLM agents     |
| **[Design Tokens](./docs/agents/DESIGN_TOKENS.md)**             | Colors, fonts, animations reference       |
| **[Component API](./docs/agents/COMPONENT_API.md)**             | Component specifications & state machines |

---

## 🌐 Networks & Resources

### Contract Addresses

<details>
<summary><strong>MANTRA Mainnet (5888)</strong></summary>

| Contract   | Address                                      |
| ---------- | -------------------------------------------- |
| Multicall3 | `0xcA11bde05977b3631167028862bE2a173976CA11` |
| Wrapped OM | `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598` |
| Create2    | `0x4e59b44847b379578588920cA78FbF26c0B4956C` |
| Createx    | `0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed` |

</details>

<details>
<summary><strong>MANTRA Dukong Testnet (5887)</strong></summary>

| Contract   | Address                                      |
| ---------- | -------------------------------------------- |
| Multicall3 | `0xcA11bde05977b3631167028862bE2a173976CA11` |
| Wrapped OM | `0x10d26F0491fA11c5853ED7C1f9817b098317DC46` |
| Create2    | `0x4e59b44847b379578588920cA78FbF26c0B4956C` |
| Createx    | `0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed` |

</details>

### Supported Wallets

| Type       | Wallets                                   |
| ---------- | ----------------------------------------- |
| **EVM**    | MetaMask, Rabby, WalletConnect-compatible |
| **Cosmos** | Keplr, Leap                               |

### Useful Links

| Resource         | Link                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| 📚 MANTRA Docs    | [docs.mantrachain.io](https://docs.mantrachain.io)                   |
| 🔍 Block Explorer | [blockscout.mantrascan.io](https://blockscout.mantrascan.io)         |
| 💧 Testnet Faucet | [faucet.dukong.mantrachain.io](https://faucet.dukong.mantrachain.io) |
| 🔨 Foundry Book   | [book.getfoundry.sh](https://book.getfoundry.sh)                     |
| ⚙️ Wagmi Docs     | [wagmi.sh](https://wagmi.sh)                                         |
| 🎨 ShadCN UI      | [ui.shadcn.com](https://ui.shadcn.com)                               |

---

## 🚀 Deployment

### Smart Contracts

```bash
# Deploy to testnet (auto-verifies on Blockscout)
yarn contracts:deploy:dukong

# Deploy to mainnet
yarn contracts:deploy:mainnet
```

### Frontend

The webapp deploys automatically via CI/CD to Cloudflare Workers:

| Environment | URL                                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Testnet** | [dapp-template-nonprod.mantra-development.workers.dev](https://dapp-template-nonprod.mantra-development.workers.dev)       |
| **Mainnet** | [dapp-template-prod.mantra-chain-new-account.workers.dev](https://dapp-template-prod.mantra-chain-new-account.workers.dev) |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ for the MANTRA ecosystem**

[MANTRA Chain](https://mantra.zone) · [Documentation](https://docs.mantrachain.io) · [Discord](https://discord.gg/mantra)

</div>