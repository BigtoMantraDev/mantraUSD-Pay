# Config Package Specification

## ADDED Requirements

### Requirement: Chain Configuration Types

The config package SHALL provide type-safe chain configuration interfaces that include chain ID, name, network type, RPC URLs, block explorers, and native currency details.

#### Scenario: Access chain configuration by ID
- **WHEN** a consumer requests chain configuration for a supported chain ID
- **THEN** the system SHALL return a complete ChainConfig object with all required properties

#### Scenario: Identify testnet vs mainnet
- **WHEN** a consumer checks the isTestnet flag on a chain configuration
- **THEN** the system SHALL accurately reflect whether the chain is a testnet or production network

#### Scenario: Access RPC and explorer URLs
- **WHEN** a consumer needs to connect to a chain or view transactions
- **THEN** the system SHALL provide valid RPC URLs and block explorer base URLs

### Requirement: Contract Address Management

The config package SHALL provide contract addresses for each supported chain, including delegatedAccount, sessionRegistry, and mantraUSD token contracts.

#### Scenario: Get contract address for specific chain
- **WHEN** a consumer requests a contract address for a supported chain ID
- **THEN** the system SHALL return the correct contract address for that chain

#### Scenario: Access mantraUSD token address
- **WHEN** a consumer needs the mantraUSD token address for payment operations
- **THEN** the system SHALL provide the correct token contract address for the active chain

#### Scenario: Get DelegatedAccount contract address
- **WHEN** a consumer needs to interact with the EIP-7702 delegation contract
- **THEN** the system SHALL provide the correct DelegatedAccount contract address

#### Scenario: Get SessionRegistry contract address
- **WHEN** a consumer needs to interact with the payment session registry
- **THEN** the system SHALL provide the correct SessionRegistry contract address

### Requirement: Token Configuration

The config package SHALL provide token configuration for mantraUSD including address, symbol, name, and decimals for each supported chain.

#### Scenario: Get token decimals for amount formatting
- **WHEN** a consumer needs to format or parse mantraUSD amounts
- **THEN** the system SHALL provide the correct decimal precision (6 for mantraUSD)

#### Scenario: Get token symbol for UI display
- **WHEN** a consumer displays token amounts in the UI
- **THEN** the system SHALL provide the correct symbol ("mantraUSD" for mainnet, "mmUSD" for testnet)

#### Scenario: Validate token configuration completeness
- **WHEN** a consumer accesses token configuration
- **THEN** the system SHALL provide all required fields: address, symbol, name, and decimals

### Requirement: Fee Configuration

The config package SHALL provide fee configuration including customer fee settings (dynamic, gas-based) and merchant fee settings (fixed percentage).

#### Scenario: Access customer fee parameters
- **WHEN** a consumer needs to calculate dynamic customer fees
- **THEN** the system SHALL provide customerFeeEnabled flag, gasBufferPercent, maxCustomerFee, minCustomerFee, and quoteTTL

#### Scenario: Access merchant fee parameters
- **WHEN** a consumer needs to calculate merchant service fees
- **THEN** the system SHALL provide merchantFeeEnabled flag, merchantFeeBps, and maxMerchantFeeBps

#### Scenario: Get fee collector address
- **WHEN** fees need to be transferred to the treasury
- **THEN** the system SHALL provide the feeCollector address for merchant fees

#### Scenario: Check if customer fees are enabled
- **WHEN** determining whether to add customer gas fees to payment amount
- **THEN** the system SHALL provide the customerFeeEnabled boolean flag

#### Scenario: Check if merchant fees are enabled
- **WHEN** determining whether to deduct merchant service fees
- **THEN** the system SHALL provide the merchantFeeEnabled boolean flag

### Requirement: Helper Function - Get Chain Config

The config package SHALL export a function `getChainConfig(chainId: number)` that returns the complete chain configuration for a given chain ID.

#### Scenario: Retrieve configuration for MANTRA Mainnet
- **WHEN** `getChainConfig(5888)` is called
- **THEN** the system SHALL return the MANTRA Mainnet configuration object

#### Scenario: Retrieve configuration for MANTRA Dukong Testnet
- **WHEN** `getChainConfig(5887)` is called
- **THEN** the system SHALL return the MANTRA Dukong Testnet configuration object

#### Scenario: Handle unsupported chain ID
- **WHEN** `getChainConfig()` is called with an unsupported chain ID
- **THEN** the system SHALL throw an error or return undefined

### Requirement: Helper Function - Get Contract Address

The config package SHALL export a function `getContractAddress(chainId: number, contract: string)` that returns the address of a specific contract on a given chain.

#### Scenario: Get DelegatedAccount address for mainnet
- **WHEN** `getContractAddress(5888, 'delegatedAccount')` is called
- **THEN** the system SHALL return the correct DelegatedAccount address for MANTRA Mainnet

#### Scenario: Get SessionRegistry address for testnet
- **WHEN** `getContractAddress(5887, 'sessionRegistry')` is called
- **THEN** the system SHALL return the correct SessionRegistry address for MANTRA Dukong

#### Scenario: Get mantraUSD token address
- **WHEN** `getContractAddress(chainId, 'mantraUSD')` is called
- **THEN** the system SHALL return the correct token address for the specified chain

### Requirement: Helper Function - Get Token Config

The config package SHALL export a function `getTokenConfig(chainId: number)` that returns the mantraUSD token configuration for a given chain.

#### Scenario: Get token config for mainnet
- **WHEN** `getTokenConfig(5888)` is called
- **THEN** the system SHALL return token config with address, symbol "mantraUSD", name, and decimals 6

#### Scenario: Get token config for testnet
- **WHEN** `getTokenConfig(5887)` is called
- **THEN** the system SHALL return token config with address, symbol "mmUSD", name, and decimals 6

### Requirement: Helper Function - Get Fee Config

The config package SHALL export a function `getFeeConfig(chainId: number)` that returns the fee configuration for a given chain.

#### Scenario: Get fee configuration
- **WHEN** `getFeeConfig(chainId)` is called
- **THEN** the system SHALL return complete fee configuration including customer and merchant fee settings

#### Scenario: Access independent fee toggles
- **WHEN** fee configuration is retrieved
- **THEN** the system SHALL provide separate customerFeeEnabled and merchantFeeEnabled flags

### Requirement: Helper Function - Estimate Customer Fee

The config package SHALL export a function `estimateCustomerFee(chainId: number)` that calculates the current customer fee based on real-time gas prices.

#### Scenario: Calculate customer fee with buffer
- **WHEN** `estimateCustomerFee(chainId)` is called
- **THEN** the system SHALL return estimated gas cost multiplied by (1 + gasBufferPercent/100)

#### Scenario: Respect maximum customer fee cap
- **WHEN** calculated customer fee exceeds maxCustomerFee
- **THEN** the system SHALL return maxCustomerFee as the result

#### Scenario: Respect minimum customer fee
- **WHEN** calculated customer fee is below minCustomerFee
- **THEN** the system SHALL return minCustomerFee as the result

#### Scenario: Return zero when customer fees disabled
- **WHEN** customerFeeEnabled is false
- **THEN** the system SHALL return 0 regardless of gas price

### Requirement: Helper Function - Calculate Merchant Fee

The config package SHALL export a function `calculateMerchantFee(chainId: number, amount: bigint)` that computes the merchant service fee for a given payment amount.

#### Scenario: Calculate percentage-based merchant fee
- **WHEN** `calculateMerchantFee(chainId, amount)` is called with merchantFeeEnabled true
- **THEN** the system SHALL return amount * merchantFeeBps / 10000

#### Scenario: Respect maximum merchant fee basis points
- **WHEN** configured merchantFeeBps exceeds maxMerchantFeeBps
- **THEN** the system SHALL use maxMerchantFeeBps for calculations

#### Scenario: Return zero when merchant fees disabled
- **WHEN** merchantFeeEnabled is false
- **THEN** the system SHALL return 0 regardless of amount

### Requirement: Helper Function - Check Chain Support

The config package SHALL export a function `isChainSupported(chainId: number)` that checks if a chain ID is supported by the application.

#### Scenario: Verify supported chain
- **WHEN** `isChainSupported(5888)` or `isChainSupported(5887)` is called
- **THEN** the system SHALL return true

#### Scenario: Reject unsupported chain
- **WHEN** `isChainSupported()` is called with an unknown chain ID
- **THEN** the system SHALL return false

### Requirement: Supported Networks

The config package SHALL support MANTRA Mainnet (chain ID 5888) and MANTRA Dukong Testnet (chain ID 5887) with complete configuration for each.

#### Scenario: MANTRA Mainnet configuration
- **WHEN** accessing mainnet configuration
- **THEN** the system SHALL provide chain ID 5888, RPC URL https://evm.mantrachain.io, and production contract addresses

#### Scenario: MANTRA Dukong Testnet configuration
- **WHEN** accessing testnet configuration
- **THEN** the system SHALL provide chain ID 5887, RPC URL https://evm.dukong.mantrachain.io, and testnet contract addresses

#### Scenario: Local development configuration
- **WHEN** running in development environment
- **THEN** the system SHALL support local Anvil chain (ID 1337) with localhost RPC endpoints

### Requirement: Type Safety

The config package SHALL export TypeScript interfaces and types for all configuration objects to ensure type safety across the application.

#### Scenario: ChainConfig type export
- **WHEN** a consumer imports configuration types
- **THEN** the system SHALL provide the ChainConfig interface with all required properties

#### Scenario: ContractAddresses type export
- **WHEN** a consumer needs to type contract addresses
- **THEN** the system SHALL provide the ContractAddresses interface

#### Scenario: TokenConfig type export
- **WHEN** a consumer needs to type token configuration
- **THEN** the system SHALL provide the TokenConfig interface

#### Scenario: FeeConfig type export
- **WHEN** a consumer needs to type fee configuration
- **THEN** the system SHALL provide the FeeConfig interface with customer and merchant fee properties

### Requirement: Environment-Based Configuration

The config package SHALL support environment-based configuration selection, defaulting to local chain in development and testnet/mainnet in production.

#### Scenario: Development environment defaults
- **WHEN** running in development mode (import.meta.env.DEV === true)
- **THEN** the system SHALL default to local Anvil chain configuration

#### Scenario: Production environment defaults
- **WHEN** running in production mode
- **THEN** the system SHALL default to MANTRA Dukong Testnet or Mainnet based on deployment settings

#### Scenario: Override default chain via environment variable
- **WHEN** a specific chain is configured via environment variables
- **THEN** the system SHALL use the specified chain as the default

### Requirement: Wagmi Integration

The config package SHALL provide Viem chain definitions compatible with Wagmi and AppKit for wallet connection and transaction handling.

#### Scenario: Export Viem chain definitions
- **WHEN** Wagmi/AppKit needs chain configurations
- **THEN** the system SHALL provide properly formatted Viem Chain objects

#### Scenario: Support WalletConnect integration
- **WHEN** integrating with WalletConnect via AppKit
- **THEN** the system SHALL provide compatible network configurations

### Requirement: ABI Exports

The config package SHALL export contract ABIs for DelegatedAccount and SessionRegistry to enable typed contract interactions.

#### Scenario: Access DelegatedAccount ABI
- **WHEN** a consumer needs to interact with the DelegatedAccount contract
- **THEN** the system SHALL provide the complete contract ABI

#### Scenario: Access SessionRegistry ABI
- **WHEN** a consumer needs to interact with the SessionRegistry contract
- **THEN** the system SHALL provide the complete contract ABI

#### Scenario: Type-safe contract calls
- **WHEN** using ABIs with Wagmi hooks
- **THEN** the system SHALL enable TypeScript type inference for contract methods

### Requirement: Configuration Immutability

The config package SHALL export configuration objects as immutable constants to prevent accidental modification at runtime.

#### Scenario: Prevent configuration mutation
- **WHEN** configuration objects are exported
- **THEN** the system SHALL use TypeScript const assertions or readonly modifiers

#### Scenario: Centralized configuration source
- **WHEN** multiple consumers import configuration
- **THEN** the system SHALL ensure all consumers receive the same immutable configuration objects

### Requirement: Documentation and Examples

The config package SHALL include comprehensive inline documentation and usage examples for all exported types and functions.

#### Scenario: JSDoc comments for types
- **WHEN** developers inspect configuration types in their IDE
- **THEN** the system SHALL display helpful JSDoc comments explaining each property

#### Scenario: Usage examples in comments
- **WHEN** developers use helper functions
- **THEN** the system SHALL provide code examples in JSDoc comments

#### Scenario: README with integration guide
- **WHEN** developers integrate the config package
- **THEN** the system SHALL provide a README with installation and usage instructions
