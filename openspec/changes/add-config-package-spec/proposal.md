# Change: Add Config Package Specification

## Why

The mantraUSD-Pay project needs a centralized, type-safe configuration package that provides chain configurations, contract addresses, token details, and fee parameters for all applications (webapp, merchant-portal, backend). This specification documents the `@mantrausd-pay/config` package as defined in Section 4 of the PRD.

## What Changes

- Add specification for shared configuration package
- Document chain configuration types and supported networks
- Document contract address management per chain
- Document token configuration for mantraUSD
- Document fee configuration for customer and merchant fees
- Define helper functions for configuration access
- Add usage scenarios for configuration consumers

## Impact

- Affected specs: Creates new `config-package` capability
- Affected code: Documents existing configuration in `packages/webapp/src/config/`
- Provides foundation for backend and merchant-portal to use same configuration
- Enables type-safe configuration sharing across the monorepo
