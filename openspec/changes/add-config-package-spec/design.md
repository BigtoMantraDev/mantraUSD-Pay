# Config Package Design

## Context

The mantraUSD-Pay project is a monorepo containing multiple packages (webapp, merchant-portal, backend) that all need access to shared configuration for blockchain networks, smart contracts, tokens, and fees. The config package serves as the single source of truth for this configuration.

**Background:**
- Multiple frontends (customer payment webapp, merchant portal)
- Backend relayer service that sponsors gas
- All need consistent contract addresses, chain details, and fee parameters
- Based on the OMies dApp template structure

**Constraints:**
- Must work with Viem/Wagmi for Web3 interactions
- Must support environment-based configuration (dev vs production)
- Must be type-safe for TypeScript consumers
- Fee model has two independent toggles (customer fee, merchant fee)

**Stakeholders:**
- Frontend developers (webapp, merchant-portal)
- Backend developers (NestJS relayer service)
- Smart contract developers (need consistent addresses)

## Goals / Non-Goals

**Goals:**
- Provide single source of truth for all configuration
- Enable type-safe configuration access across all packages
- Support multiple networks (mainnet, testnet, local dev)
- Make fee calculation logic transparent and reusable
- Simplify contract address management per network

**Non-Goals:**
- Runtime configuration updates (config is static at build time)
- Configuration API server (this is a code package, not a service)
- Validation of on-chain contract code (assumes addresses are correct)
- Gas price oracle implementation (estimateCustomerFee is a helper, actual gas estimation done by backend)

## Decisions

### Decision 1: Monorepo Shared Package Structure

**What:** Place config in `packages/webapp/src/config/` rather than a separate package root

**Why:**
- Follows existing OMies template structure
- Simpler to import from within webapp
- Can be extracted to separate package later if needed for backend/merchant-portal
- Current implementation already exists in this location

**Alternatives considered:**
- Separate `packages/config` - More overhead for current single-frontend use case
- Environment variables only - Not type-safe, harder to maintain

### Decision 2: Chain Configuration per File

**What:** Each network gets its own file (e.g., `networks/mantra-mainnet.ts`, `networks/mantra-dukong.ts`, `networks/local.ts`)

**Why:**
- Easy to find and update network-specific settings
- Clear separation of mainnet vs testnet configuration
- Follows module pattern from existing code

**Alternatives considered:**
- Single chains.ts file with all configs - Would be large and harder to navigate
- JSON configuration files - Less type-safe, no code reuse

### Decision 3: Viem Chain Definitions

**What:** Use Viem's `defineChain()` for custom chains, import from @reown/appkit for known chains

**Why:**
- Viem is the standard for modern Web3 TypeScript apps
- Required for Wagmi and AppKit integration
- Provides RPC client functionality out of the box

**Trade-offs:**
- Couples to Viem (acceptable since that's the project's Web3 library)
- Custom chains require more boilerplate than using chain IDs alone

### Decision 4: Fee Configuration as Static Constants

**What:** Fee parameters (customerFeeEnabled, merchantFeeBps, etc.) are exported as TypeScript constants

**Why:**
- Fee model is defined in PRD and unlikely to change at runtime
- Makes fee logic predictable and auditable
- Backend can read same constants for consistency

**Alternatives considered:**
- Database-driven configuration - Adds complexity, not needed for MVP
- Smart contract configuration - Gas cost to read, harder to update
- Environment variables - Less discoverable, no type safety

**Trade-offs:**
- Requires code deployment to change fees
- **Mitigation:** Fee toggles (customerFeeEnabled, merchantFeeEnabled) are separate from rates, allowing some flexibility

### Decision 5: Helper Functions for Common Operations

**What:** Export functions like `getChainConfig()`, `estimateCustomerFee()`, `calculateMerchantFee()`

**Why:**
- Encapsulates fee calculation logic
- Provides consistent API across consumers
- Makes business logic explicit

**Alternatives considered:**
- Consumers calculate fees directly - Leads to code duplication and inconsistency
- Class-based configuration - More overhead than needed for simple lookups

### Decision 6: TypeScript-First with Strong Typing

**What:** All configuration uses TypeScript interfaces, no `any` types, strict mode enabled

**Why:**
- Catches configuration errors at compile time
- Enables IDE autocomplete for configuration access
- Documents expected shape of configuration objects

**Trade-offs:**
- More verbose than plain JavaScript objects
- **Mitigation:** Type inference reduces boilerplate

## Risks / Trade-offs

### Risk: Contract Address Updates

**Risk:** When contracts are redeployed, addresses must be updated in code
**Mitigation:** Clear documentation of where to update addresses, CI/CD checks for address format validation

### Risk: Fee Parameter Changes Require Deployment

**Risk:** Cannot adjust fees without code deployment
**Mitigation:** 
- Fee toggles (enabled flags) provide some flexibility
- Future enhancement: Move to smart contract governance if needed

### Risk: Unsupported Chain Handling

**Risk:** Application might receive requests for unsupported chain IDs
**Mitigation:** 
- `isChainSupported()` function for validation
- Helper functions throw/return undefined for unsupported chains
- Frontend filters to supported chains in network selector

## Migration Plan

**Current State:**
- Config already exists in `packages/webapp/src/config/`
- Used by webapp components via `useAppConfig()` hook

**Steps:**
1. ✅ Document existing configuration structure (this spec)
2. Add any missing helper functions from PRD Section 4.2
3. Export ABIs for contract interactions
4. Add comprehensive JSDoc comments
5. Update project.md with config package conventions
6. Extract to `packages/config` when backend/merchant-portal need it

**Rollback:**
- Documentation-only change, no rollback needed
- If config is extracted to separate package, can always merge back

## Open Questions

1. **Q:** Should fee configuration come from smart contract state instead of code constants?
   **A:** Start with code constants (per PRD). Consider contract-based config in v2 if governance is needed.

2. **Q:** Do we need different fee configurations per chain (mainnet vs testnet)?
   **A:** Yes, likely different for testnet (could be disabled for testing). Add `fees` property to ChainConfig if needed.

3. **Q:** Should mantraUSD token address be in ContractAddresses or separate TokenConfig?
   **A:** Both - include in ContractAddresses for consistency, provide TokenConfig helper for token-specific properties (decimals, symbol).

4. **Q:** How to handle configuration in backend (NestJS) vs frontend (Vite)?
   **A:** Backend can import from `@mantrausd-pay/config` package once extracted. For now, duplicate minimal config or share via monorepo.
