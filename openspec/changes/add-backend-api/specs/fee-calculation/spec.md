# Capability: Fee Calculation

Dynamic fee calculation for gasless payments.

## ADDED Requirements

### Requirement: Dynamic Customer Fee Calculation

The system SHALL calculate customer fees dynamically based on current gas prices.

Calculation formula:

```
estimatedGas = 150,000 (conservative estimate for EIP-7702 tx)
currentGasPrice = eth_gasPrice() 
gasCostInOM = estimatedGas × currentGasPrice
gasCostInUSD = gasCostInOM × OM_USD_PRICE
customerFee = gasCostInUSD × (1 + bufferPercent/100)
```

The customer fee MUST be clamped to configured bounds:

- Minimum: `minCustomerFee` (default: 0.01 mantraUSD)
- Maximum: `maxCustomerFee` (default: 1.00 mantraUSD)

If `customerFeeEnabled` is false, the customer fee SHALL be 0.

#### Scenario: Normal gas price calculation

- **GIVEN** gas price is 0.001 OM
- **AND** OM/USD price is $5.00
- **AND** buffer percent is 20%
- **WHEN** customer fee is calculated
- **THEN** gasCostInOM = 150,000 × 0.001 = 0.15 OM
- **AND** gasCostInUSD = 0.15 × $5.00 = $0.75
- **AND** customerFee = $0.75 × 1.20 = $0.90

#### Scenario: Fee below minimum

- **GIVEN** calculated fee is $0.005
- **AND** minCustomerFee is $0.01
- **WHEN** customer fee is calculated
- **THEN** customerFee is clamped to $0.01

#### Scenario: Fee above maximum

- **GIVEN** calculated fee is $1.50
- **AND** maxCustomerFee is $1.00
- **WHEN** customer fee is calculated
- **THEN** customerFee is clamped to $1.00

#### Scenario: Customer fee disabled

- **GIVEN** customerFeeEnabled is false
- **WHEN** customer fee is calculated
- **THEN** customerFee is $0.00
- **AND** relayer absorbs gas cost

---

### Requirement: Merchant Fee Calculation

The system SHALL calculate merchant fees as a fixed percentage of the payment amount.

Calculation formula:

```
merchantFee = amount × merchantFeeBps / 10000
merchantReceives = amount - merchantFee
```

The merchant fee MUST NOT exceed `maxMerchantFeeBps` (500 = 5%).

If `merchantFeeEnabled` is false, the merchant fee SHALL be 0.

#### Scenario: Standard merchant fee

- **GIVEN** payment amount is $100.00
- **AND** merchantFeeBps is 100 (1%)
- **WHEN** merchant fee is calculated
- **THEN** merchantFee = $100.00 × 100 / 10000 = $1.00
- **AND** merchantReceives = $100.00 - $1.00 = $99.00

#### Scenario: Merchant fee disabled

- **GIVEN** merchantFeeEnabled is false
- **WHEN** merchant fee is calculated
- **THEN** merchantFee is $0.00
- **AND** merchantReceives equals amount

#### Scenario: Fee exceeds maximum

- **GIVEN** merchantFeeBps is 600 (6%)
- **AND** maxMerchantFeeBps is 500 (5%)
- **WHEN** fee configuration is set
- **THEN** the system rejects the configuration
- **AND** returns validation error

---

### Requirement: Fee Quote API

The system SHALL provide fee quotes via `GET /fees/quote`.

The request MUST include:

- `chainId` - Target chain ID (query parameter, must match configured network)

The system SHALL return:

| Field            | Type    | Description                        |
|------------------|---------|------------------------------------|
| `customerFee`    | string  | Fee in token units (e.g., "0.06")  |
| `customerFeeUSD` | string  | Fee in USD for display             |
| `gasPrice`       | string  | Current gas price in wei           |
| `gasPriceGwei`   | string  | Gas price in Gwei for transparency |
| `estimatedGas`   | number  | Gas units estimated (150000)       |
| `bufferPercent`  | number  | Buffer applied (20)                |
| `expiresAt`      | number  | Quote expiration timestamp         |
| `quoteTTL`       | number  | TTL in seconds (60)                |
| `enabled`        | boolean | Whether customer fee is enabled    |

#### Scenario: Get fee quote with customer fee enabled

- **GIVEN** customerFeeEnabled is true
- **AND** current gas price is 1 gwei
- **WHEN** client calls `GET /fees/quote?chainId=5887`
- **THEN** response includes calculated customerFee
- **AND** `enabled` is true
- **AND** `expiresAt` is ~60 seconds in the future

#### Scenario: Get fee quote with customer fee disabled

- **GIVEN** customerFeeEnabled is false
- **WHEN** client calls `GET /fees/quote?chainId=5887`
- **THEN** `customerFee` is "0.00"
- **AND** `enabled` is false

#### Scenario: Chain ID mismatch

- **GIVEN** backend configured for chain 5887
- **WHEN** client calls `GET /fees/quote?chainId=5888`
- **THEN** the system returns status 400
- **AND** error indicates chain ID mismatch

---

### Requirement: Fee Quote TTL

Fee quotes SHALL have a time-to-live (TTL) of 60 seconds.

The system SHALL:

- Include `expiresAt` timestamp in all fee-related responses
- Include `feeQuoteExpiresAt` in session responses
- Reject relay requests where the fee quote has expired

Clients SHOULD:

- Re-fetch session if `feeQuoteExpiresAt` has passed
- Show updated fee before user signs

#### Scenario: Fee quote within TTL

- **GIVEN** a session with `feeQuoteExpiresAt` 30 seconds in the future
- **WHEN** the relay request is made
- **THEN** the request proceeds normally

#### Scenario: Fee quote expired

- **GIVEN** a session with `feeQuoteExpiresAt` in the past
- **WHEN** the relay request is made
- **THEN** the system returns status 400
- **AND** the error indicates "Fee quote expired. Please refresh session."

---

### Requirement: Fee Configuration

The system SHALL support the following fee configuration:

| Parameter            | Type    | Default      | Description                     |
|----------------------|---------|--------------|---------------------------------|
| `customerFeeEnabled` | boolean | true         | Toggle customer fee on/off      |
| `merchantFeeEnabled` | boolean | true         | Toggle merchant fee on/off      |
| `merchantFeeBps`     | number  | 100 (1%)     | Merchant fee in basis points    |
| `maxMerchantFeeBps`  | number  | 500 (5%)     | Maximum merchant fee            |
| `gasBufferPercent`   | number  | 20           | Buffer added to gas estimate    |
| `maxCustomerFee`     | bigint  | 1.00 (6 dec) | Max customer fee in token units |
| `minCustomerFee`     | bigint  | 0.01 (6 dec) | Min customer fee in token units |
| `quoteTTL`           | number  | 60           | Fee quote validity in seconds   |
| `feeCollector`       | address | -            | Address receiving merchant fees |

Configuration MUST be loaded from environment variables.

#### Scenario: Load fee configuration from environment

- **GIVEN** environment variables for fee configuration
- **WHEN** the backend starts
- **THEN** fee configuration is loaded and validated
- **AND** invalid values cause startup failure

---

### Requirement: Fee Transparency

All fee-related responses SHALL include sufficient detail for UI transparency.

Session creation response MUST include:

- `customerFee` - Exact fee customer pays
- `merchantFee` - Exact fee deducted from merchant
- `customerPays` - Total amount customer will pay
- `merchantReceives` - Net amount merchant receives
- `customerFeeEnabled` - Whether customer fee is active
- `merchantFeeEnabled` - Whether merchant fee is active

This enables the UI to show clear fee breakdowns.

#### Scenario: Full fee transparency in session response

- **GIVEN** a session with both fees enabled
- **WHEN** the session is retrieved
- **THEN** all fee fields are present
- **AND** arithmetic is correct: customerPays = amount + customerFee
- **AND** arithmetic is correct: merchantReceives = amount - merchantFee

---

### Requirement: Fee Precision

All fee calculations SHALL use the token's native precision (6 decimals for mantraUSD).

The system SHALL:

- Perform calculations in token units (micro-units)
- Round fees UP using mathematical ceiling at the token's precision (e.g. 6 decimal places for mantraUSD), i.e. always rounding toward +∞ but leaving values already at that precision unchanged
- Return formatted values as decimal strings

#### Scenario: Precision handling

- **GIVEN** a calculated fee of 0.055555 mantraUSD
- **WHEN** the fee is formatted
- **THEN** the result is "0.055556" (rounded up using 6-decimal-place ceiling)
- **AND** a fee already at 6-decimal precision (e.g. 0.055550 stored as 55,550 micro-units) is not increased by ceiling and MAY be formatted without redundant trailing zeros (e.g. "0.05555")
- **AND** internal storage uses 6 decimal places
