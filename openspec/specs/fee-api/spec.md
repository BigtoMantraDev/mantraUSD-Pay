# fee-api Specification

## Purpose
TBD - created by archiving change add-backend-relayer. Update Purpose after archive.
## Requirements
### Requirement: Fee Quote Endpoint

The system SHALL provide a GET endpoint to retrieve current fee quotes for transaction relay.

#### Scenario: Successful fee quote retrieval
- **WHEN** GET /fees/quote is called with valid chainId
- **THEN** the system SHALL return a fee quote
- **AND** the quote SHALL include the fee amount in token units
- **AND** the quote SHALL include the formatted fee string
- **AND** the quote SHALL include an expiration timestamp

#### Scenario: Fee quote with gas price details
- **WHEN** a fee quote is generated
- **THEN** the response SHALL include the current gas price in wei
- **AND** the response SHALL include the gas price in Gwei
- **AND** the response SHALL include the estimated gas units
- **AND** the response SHALL include the buffer percentage applied

#### Scenario: Invalid chain ID rejection
- **WHEN** GET /fees/quote is called with unsupported chainId
- **THEN** the system SHALL return HTTP 400
- **AND** return error code `UNSUPPORTED_CHAIN`

### Requirement: Fee Calculation

The system SHALL calculate fees based on real-time gas prices with configurable parameters.

#### Scenario: Standard fee calculation
- **WHEN** calculating a fee quote
- **THEN** the fee SHALL equal (estimatedGas × gasPrice × (1 + bufferPercent/100))
- **AND** be converted to token value using current OM/USD rate

#### Scenario: Minimum fee enforcement
- **WHEN** the calculated fee is below the minimum (0.01 mantraUSD)
- **THEN** the fee SHALL be set to the minimum value
- **AND** the quote SHALL indicate the minimum was applied

#### Scenario: Maximum fee cap
- **WHEN** the calculated fee exceeds the maximum (1.00 mantraUSD)
- **THEN** the fee SHALL be capped at the maximum value
- **AND** the quote SHALL indicate the cap was applied

#### Scenario: Fees disabled
- **WHEN** fees are disabled in configuration
- **THEN** the quote SHALL return fee: "0"
- **AND** the quote SHALL indicate enabled: false

### Requirement: Fee Quote Expiration

The system SHALL enforce quote expiration to limit gas price volatility exposure.

#### Scenario: Quote within TTL
- **WHEN** a quote is requested
- **THEN** the expiresAt SHALL be current time + 60 seconds

#### Scenario: Stale quote detection
- **WHEN** using a quote past its expiration
- **THEN** the relay service SHALL reject the request
- **AND** return error code `QUOTE_EXPIRED`

### Requirement: Fee Configuration

The system SHALL support configurable fee parameters via environment variables.

#### Scenario: Custom estimated gas
- **WHEN** FEE_ESTIMATED_GAS is configured
- **THEN** fee calculations SHALL use the configured value

#### Scenario: Custom buffer percentage
- **WHEN** FEE_BUFFER_PERCENT is configured
- **THEN** fee calculations SHALL apply the configured buffer

#### Scenario: Custom min/max fees
- **WHEN** FEE_MIN and FEE_MAX are configured
- **THEN** fee calculations SHALL enforce the configured bounds

### Requirement: Fee Quote Response Format

The system SHALL return consistent fee quote response format.

#### Scenario: Complete fee quote response
- **WHEN** a fee quote is successfully generated
- **THEN** the response SHALL include:
  - fee: string (token units, e.g., "0.05")
  - feeFormatted: string (e.g., "0.05 mantraUSD")
  - gasPrice: string (wei)
  - gasPriceGwei: string (human readable)
  - estimatedGas: number
  - bufferPercent: number
  - expiresAt: number (unix timestamp)
  - enabled: boolean

