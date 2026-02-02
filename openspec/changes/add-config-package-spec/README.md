# Config Package OpenSpec Documentation

This change proposal documents the shared configuration package for the mantraUSD-Pay project.

## Summary

- **Change ID:** `add-config-package-spec`
- **Type:** New capability specification
- **Status:** Proposed
- **Based on:** mantraUSD-Pay PRD Section 4 (Shared Configuration Package)

## What's Included

### 1. proposal.md
Explains why we need this specification and what it documents.

### 2. tasks.md
Checklist of specification creation tasks (all completed ✓).

### 3. design.md
Technical design decisions including:
- Monorepo structure rationale
- Per-network configuration files
- Viem chain integration
- Fee configuration as static constants
- Helper function design
- Risk analysis and mitigation

### 4. specs/config-package/spec.md
Complete specification with **18 requirements** and **54 scenarios** covering:

#### Core Configuration Types
- Chain Configuration Types (3 scenarios)
- Contract Address Management (4 scenarios)
- Token Configuration (3 scenarios)
- Fee Configuration (5 scenarios)

#### Helper Functions
- Get Chain Config (3 scenarios)
- Get Contract Address (3 scenarios)
- Get Token Config (2 scenarios)
- Get Fee Config (2 scenarios)
- Estimate Customer Fee (4 scenarios)
- Calculate Merchant Fee (3 scenarios)
- Check Chain Support (2 scenarios)

#### Platform Features
- Supported Networks (3 scenarios)
- Type Safety (4 scenarios)
- Environment-Based Configuration (3 scenarios)
- Wagmi Integration (2 scenarios)
- ABI Exports (3 scenarios)
- Configuration Immutability (2 scenarios)
- Documentation and Examples (3 scenarios)

## Key Features Documented

### Chain Configuration
- MANTRA Mainnet (5888)
- MANTRA Dukong Testnet (5887)
- Local Anvil (1337) for development
- RPC URLs, block explorers, native currency

### Contract Addresses
- DelegatedAccount (EIP-7702 implementation)
- SessionRegistry (payment sessions)
- mantraUSD token

### Token Configuration
- Address per chain
- Symbol (mantraUSD for mainnet, mmUSD for testnet)
- Decimals (6)

### Fee Configuration
- Customer Fee: Dynamic, gas-based (toggleable)
  - gasBufferPercent, maxCustomerFee, minCustomerFee, quoteTTL
- Merchant Fee: Fixed percentage (toggleable)
  - merchantFeeBps, maxMerchantFeeBps
- Independent enable/disable flags
- feeCollector address for treasury

### Helper Functions
```typescript
getChainConfig(chainId: number): ChainConfig
getContractAddress(chainId: number, contract: string): Address
getTokenConfig(chainId: number): TokenConfig
getFeeConfig(chainId: number): FeeConfig
estimateCustomerFee(chainId: number): bigint
calculateMerchantFee(chainId: number, amount: bigint): bigint
isChainSupported(chainId: number): boolean
```

## Usage

This specification can be used by:
- **Frontend developers** implementing payment UIs
- **Backend developers** building the relayer service
- **Contract developers** ensuring consistent addresses
- **QA teams** validating configuration behavior

## Next Steps

1. Review and approve this specification
2. Implement any missing helper functions from the spec
3. Add comprehensive JSDoc comments to existing code
4. Extract config to separate package when backend/merchant-portal need it
5. Archive this change once implementation is complete

## Validation

All requirements follow OpenSpec format:
- ✓ Each requirement has at least one scenario
- ✓ Scenarios use `#### Scenario:` format
- ✓ Requirements use SHALL/MUST language
- ✓ Scenarios follow WHEN/THEN structure
- ✓ All interfaces match PRD Section 4.1
- ✓ Helper functions match PRD Section 4.2
