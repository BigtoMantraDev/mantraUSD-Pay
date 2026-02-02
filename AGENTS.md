# OMies dApp Template (SPA) - Agent Instructions

> **⚠️ IMPORTANT:** This file has been restructured. For complete instructions, see:
> - **`/docs/agents/MASTER_INSTRUCTIONS.md`** - Complete system prompt
> - **`/docs/agents/DESIGN_TOKENS.md`** - Exact colors, fonts, animations
> - **`/docs/agents/COMPONENT_API.md`** - Detailed component specifications

---

## Quick Start for Agents

**Context:** You are an expert Full-Stack Web3 Engineer working in a Yarn Monorepo.
**Active Workspace:** `packages/webapp` (The SPA Client).
**Stack:** React 19, Vite, Tailwind CSS v4, TanStack Router, AppKit, ShadCN.

---

## 1. Monorepo Architecture

* **Root:** Contains `packages/contracts` (Foundry) and `packages/webapp` (Vite).
* **Focus:** You are primarily working in `packages/webapp`.
* **Package Manager:** Yarn (Berry/Modern).
* **Commands:**
    * Run dev: `yarn workspace @dapp-evm/webapp dev`
    * Install deps: `yarn workspace @dapp-evm/webapp add [package]`

## 2. Visual Identity (Strict Enforcement)

**Adhere to the OMies Design System.**

### The "Stage" Concept
Every page in the webapp MUST use the `MainLayout` (in `__root.tsx`) which renders the fixed Cartoon Background.
* **Z-Index Strategy:**
    * `z-[-1]`: `<CartoonBackground />` (Fixed, Teal + Sun Rays + Hills).
    * `z-10`: Page Content (Relative).

### Styling (Tailwind v4)
* **Configuration:** We use Tailwind v4. CSS variables are defined in `src/index.css`.
* **Fonts:** `Outfit` (Google Font).
* **Colors:**
    * BG: `bg-[hsl(var(--background))]` (Teal #7CAEBC).
    * Card: `bg-white` rounded-lg.
    * Text: `text-primary` (Dark Blue #3B506C).

## 3. Mandatory File Structure

All work inside `packages/webapp/src` must follow this structure:

```text
/src
  ├── /assets
  │   ├── /fonts             # Local Outfit fonts (optional, prefer Google Fonts import)
  │   └── /images            # SVGs (OM logo, Network icons, etc.)
  │
  ├── /components
  │   ├── /ui                # ShadCN Primitives (Button, Card, etc.)
  │   ├── /common            # Shared (Navbar, Footer, WalletPill, TransactionDialog)
  │   ├── /scene             # CartoonBackground.tsx (CRITICAL Visual Anchor)
  │   └── /features          # Domain specific (Migration, Staking, Faucet)
  │
  ├── /routes                # TanStack Router (File-based routing)
  │   ├── __root.tsx         # The Layout Wrapper (Navbar + Background)
  │   └── index.tsx          # Homepage
  │
  ├── /lib
  │   ├── utils.ts           # cn() utility
  │   └── wagmi.ts           # AppKit/Wagmi config
  │
  └── index.css              # Tailwind v4 Directives & CSS Variables
```

## 4. Renovation Tasks (Setup Phase)

If initializing the project, perform this "Gut Renovation":

1.  **Preserve:** `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js` (only if used for v4 plugin compat).
2.  **Purge:** Delete `src/App.tsx`, `src/main.tsx`, and all default Vite assets.
3.  **Rebuild:**
    * Create `omies-preset.js` in `packages/webapp/` root.
    * Create `src/index.css` with the Tailwind v4 setup:
        ```css
        @import "tailwindcss";
        @plugin "tailwindcss-animate";
        @config "../omies-preset.js";
        
        @theme {
           --font-sans: "Outfit", system-ui, sans-serif;
        }
        ```
    * Create `src/components/scene/CartoonBackground.tsx`.

## 5. Coding Standards

* **React 19:** Use functional components. Avoid `useMemo`/`useCallback` unless strictly necessary for performance.
* **TanStack Router:** Use `createFileRoute` for type safety.
* **Wagmi:** Use hooks `useAccount`, `useReadContract`, `useWriteContract`.
* **Transactions:** All blockchain interactions must use the `TransactionDialog` flow (Review -> Sign -> Wait -> Success). Do not use raw `window.alert`.

## 6. Component Blueprints

* **Navbar:** Glassmorphism (`bg-white/10 backdrop-blur-md`). Contains the `WalletConnectPill`.
* **WalletConnectPill:**
    * Disconnected: Button "Connect Wallet".
    * Connected: White Pill showing Network Icon + Balance + Address.
* **CartoonBackground:**
    * Must use the specific hex codes: Sky `#4FA3DC`, Hills `#48BB78`/`#68D391`.
    * Must include the rotating sunburst animation (60s loop).

## 7. Component Usage Rules (Strict)

**ALWAYS use these components—never implement alternatives:**

### Configuration & Data
* **`useAppConfig()`** — Get current chain config, contract addresses, and explorer URL helpers.
* **`CHAIN_CONFIGS`** — Access all supported chain configurations.
* **`AddressDisplay`** — Display blockchain addresses (never use raw `shortenAddress()`).
* **`BalanceDisplay`** — Display token balances with proper formatting and loading states.
* **`CopyButton`** — Copy-to-clipboard with tooltip feedback.

### Wallet & Network
* **`WalletConnectPill`** — ALWAYS use this instead of `<appkit-button />`.
* **`NetworkSelector`** — Chain switching dropdown.
* **`NetworkBanner`** — Testnet/unsupported network warnings.

### Transactions
* **`TransactionDialog`** — ALL single-step blockchain writes MUST use this.
* **`MultiStepTransactionDialog`** — Multi-step flows (e.g., approve + execute).
* **`useTransactionFlow`** — Hook for managing transaction state.

### Error Handling
* **`PageError`** — Full-page error display.
* **`ErrorBoundary`** — Wrap components to catch render errors.

### Development
* **`/devtools`** — Route for debugging chain config, wallet status, and testing errors (dev only).
* **`/kitchen-sink`** — Component showcase. **ALWAYS update when adding shared components.**

<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

