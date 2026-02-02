# Session Registry Specification

## Overview

The Session Registry contract manages payment sessions for the scan-to-pay system. It handles session creation, validation, fulfillment tracking, and dual fee management (customer and merchant fees).

## Requirements

### Requirement: Session Creation

The contract SHALL allow merchants to create payment sessions with specified amounts, tokens, fees, and expiration times.

#### Scenario: Create valid session
- **WHEN** a merchant calls `createSession` with valid parameters
- **THEN** a unique session ID MUST be generated
- **AND** the session SHALL be stored with all provided details
- **AND** a `SessionCreated` event MUST be emitted

#### Scenario: Session ID uniqueness
- **WHEN** multiple sessions are created
- **THEN** each session ID MUST be unique
- **AND** session IDs SHALL be deterministic based on parameters and timestamp

#### Scenario: Session with customer fee
- **WHEN** a session is created with `customerFee > 0`
- **THEN** `customerPays` MUST equal `amount + customerFee`
- **AND** the customer fee SHALL be added to the total customer payment

#### Scenario: Session with merchant fee
- **WHEN** a session is created with merchant fee enabled
- **THEN** `merchantFee` SHALL be calculated as `amount * merchantFeeBps / BPS_DENOMINATOR`
- **AND** `merchantReceives` MUST equal `amount - merchantFee`

#### Scenario: Session with both fees
- **WHEN** a session is created with both fees enabled
- **THEN** `customerPays` SHALL equal `amount + customerFee`
- **AND** `merchantReceives` SHALL equal `amount - merchantFee`
- **AND** `totalFees` SHALL equal `customerFee + merchantFee`

#### Scenario: Session expiry validation
- **WHEN** creating a session with duration
- **THEN** the duration MUST be >= MIN_SESSION_DURATION (5 minutes)
- **AND** the duration MUST be <= MAX_SESSION_DURATION (24 hours)
- **AND** `expiresAt` SHALL be set to `createdAt + duration`

#### Scenario: Invalid token rejection
- **WHEN** creating a session with a non-whitelisted token
- **THEN** the contract MUST revert with `InvalidToken` error
- **AND** no session SHALL be created

#### Scenario: Invalid amount rejection
- **WHEN** creating a session with amount = 0
- **THEN** the contract MUST revert with `InvalidAmount` error
- **AND** no session SHALL be created

### Requirement: Session Fulfillment

The contract SHALL allow payment of sessions through the DelegatedAccount contract with proper validation.

#### Scenario: Successful session fulfillment
- **WHEN** `fulfillSession` is called on a valid, unexpired, unfulfilled session
- **THEN** the payment transfers SHALL execute (customer to merchant, fees to collectors)
- **AND** the session SHALL be marked as fulfilled
- **AND** a `SessionFulfilled` event MUST be emitted
- **AND** the payer address SHALL be recorded

#### Scenario: Customer payment transfer
- **WHEN** a session is fulfilled
- **THEN** `customerPays` amount SHALL be transferred from payer
- **AND** `merchantReceives` amount SHALL be sent to merchant
- **AND** `customerFee` SHALL be sent to relayer (msg.sender)
- **AND** `merchantFee` SHALL be sent to feeCollector

#### Scenario: Session already fulfilled rejection
- **WHEN** `fulfillSession` is called on an already fulfilled session
- **THEN** the contract MUST revert with `SessionAlreadyFulfilled` error
- **AND** no transfers SHALL occur

#### Scenario: Expired session rejection
- **WHEN** `fulfillSession` is called on an expired session
- **THEN** the contract MUST revert with `SessionExpired` error
- **AND** no transfers SHALL occur

#### Scenario: Non-existent session rejection
- **WHEN** `fulfillSession` is called with an invalid session ID
- **THEN** the contract MUST revert with `SessionNotFound` error
- **AND** no transfers SHALL occur

### Requirement: Session Cancellation

The contract SHALL allow merchants to cancel their unfulfilled sessions.

#### Scenario: Merchant cancels own session
- **WHEN** a merchant calls `cancelSession` on their own unfulfilled session
- **THEN** the session SHALL be marked as cancelled
- **AND** a `SessionCancelled` event MUST be emitted
- **AND** the session SHALL no longer be fulfillable

#### Scenario: Unauthorized cancellation rejection
- **WHEN** a non-merchant attempts to cancel a session
- **THEN** the contract MUST revert with `UnauthorizedMerchant` error
- **AND** the session SHALL remain active

#### Scenario: Cannot cancel fulfilled session
- **WHEN** attempting to cancel an already fulfilled session
- **THEN** the contract MUST revert with `SessionAlreadyFulfilled` error
- **AND** the session state SHALL remain unchanged

### Requirement: Fee Configuration Management

The contract SHALL allow admin to configure fee parameters within defined limits.

#### Scenario: Set merchant fee rate
- **WHEN** admin calls `setFeeConfig` with valid merchant fee BPS
- **THEN** the merchant fee rate SHALL be updated
- **AND** the rate MUST be <= MAX_FEE_BPS (500 = 5%)
- **AND** a `FeeConfigUpdated` event MUST be emitted

#### Scenario: Set customer fee limits
- **WHEN** admin calls `setFeeConfig` with maxCustomerFee
- **THEN** the max customer fee SHALL be updated
- **AND** future sessions MUST validate against this limit
- **AND** a `FeeConfigUpdated` event MUST be emitted

#### Scenario: Set fee collector address
- **WHEN** admin calls `setFeeConfig` with feeCollector address
- **THEN** the fee collector SHALL be updated
- **AND** future merchant fees SHALL be sent to this address
- **AND** the address MUST NOT be zero address

#### Scenario: Fee rate too high rejection
- **WHEN** admin attempts to set merchantFeeBps > MAX_FEE_BPS
- **THEN** the contract MUST revert with `FeeTooHigh` error
- **AND** the fee configuration SHALL remain unchanged

#### Scenario: Invalid fee collector rejection
- **WHEN** admin attempts to set feeCollector to zero address
- **THEN** the contract MUST revert with `InvalidFeeCollector` error
- **AND** the fee collector SHALL remain unchanged

### Requirement: Fee Toggle Controls

The contract SHALL allow independent enabling/disabling of customer and merchant fees.

#### Scenario: Enable customer fee
- **WHEN** admin calls `setCustomerFeeEnabled(true)`
- **THEN** the customer fee SHALL be enabled globally
- **AND** new sessions SHALL include customer fees
- **AND** a `CustomerFeeToggled` event MUST be emitted

#### Scenario: Disable customer fee
- **WHEN** admin calls `setCustomerFeeEnabled(false)`
- **THEN** the customer fee SHALL be disabled globally
- **AND** new sessions SHALL have customerFee = 0
- **AND** existing sessions SHALL maintain their original fee amounts

#### Scenario: Enable merchant fee
- **WHEN** admin calls `setMerchantFeeEnabled(true)`
- **THEN** the merchant fee SHALL be enabled globally
- **AND** new sessions SHALL deduct merchant fees
- **AND** a `MerchantFeeToggled` event MUST be emitted

#### Scenario: Disable merchant fee
- **WHEN** admin calls `setMerchantFeeEnabled(false)`
- **THEN** the merchant fee SHALL be disabled globally
- **AND** new sessions SHALL have merchantFee = 0
- **AND** `merchantReceives` SHALL equal full `amount`

#### Scenario: Both fees disabled
- **WHEN** both customer and merchant fees are disabled
- **THEN** `customerPays` SHALL equal `amount`
- **AND** `merchantReceives` SHALL equal `amount`
- **AND** no fees SHALL be collected

### Requirement: Token Whitelist Management

The contract SHALL maintain a whitelist of allowed payment tokens.

#### Scenario: Add allowed token
- **WHEN** admin calls `setAllowedToken(token, true)`
- **THEN** the token SHALL be added to the whitelist
- **AND** sessions can be created with this token

#### Scenario: Remove allowed token
- **WHEN** admin calls `setAllowedToken(token, false)`
- **THEN** the token SHALL be removed from the whitelist
- **AND** new sessions CANNOT be created with this token
- **AND** existing sessions with this token SHALL remain valid

#### Scenario: Check token allowed status
- **WHEN** `isTokenAllowed(token)` is called
- **THEN** it SHALL return true for whitelisted tokens
- **AND** return false for non-whitelisted tokens

### Requirement: Merchant Fee Calculation

The contract SHALL provide a function to calculate merchant fees for a given amount.

#### Scenario: Calculate merchant fee with fee enabled
- **WHEN** merchant fee is enabled and `calculateMerchantFee(amount)` is called
- **THEN** `merchantFee` SHALL equal `amount * merchantFeeBps / BPS_DENOMINATOR`
- **AND** `merchantReceives` SHALL equal `amount - merchantFee`

#### Scenario: Calculate merchant fee with fee disabled
- **WHEN** merchant fee is disabled and `calculateMerchantFee(amount)` is called
- **THEN** `merchantFee` SHALL equal 0
- **AND** `merchantReceives` SHALL equal the full `amount`

#### Scenario: Merchant fee rounding
- **WHEN** calculating fees results in fractional amounts
- **THEN** the result SHALL be rounded down (floor division)
- **AND** ensure no dust amounts accumulate

### Requirement: Customer Fee Validation

The contract SHALL validate that customer fees provided during session creation are within configured limits.

#### Scenario: Valid customer fee acceptance
- **WHEN** a session is created with customer fee within bounds
- **THEN** the session SHALL be created successfully
- **AND** the fee SHALL be recorded as provided

#### Scenario: Customer fee exceeds maximum
- **WHEN** a session is created with customerFee > maxCustomerFee
- **THEN** the contract MUST revert with `FeeTooHigh` error
- **AND** no session SHALL be created

#### Scenario: Customer fee below minimum (when enabled)
- **WHEN** customer fee is enabled and customerFee < minCustomerFee
- **THEN** the contract MUST revert with `FeeTooHigh` error
- **AND** no session SHALL be created

#### Scenario: Zero customer fee when disabled
- **WHEN** customer fee is disabled
- **THEN** sessions MUST be created with customerFee = 0
- **AND** validation SHALL pass regardless of backend calculation

### Requirement: Session Query Functions

The contract SHALL provide functions to retrieve session data and validate session states.

#### Scenario: Get session by ID
- **WHEN** `getSession(sessionId)` is called
- **THEN** it SHALL return the complete PaymentSession struct
- **AND** include all fields: amounts, fees, timestamps, merchant, fulfillment status

#### Scenario: Get merchant sessions
- **WHEN** `getMerchantSessions(merchantAddress)` is called
- **THEN** it SHALL return an array of all session IDs for that merchant
- **AND** include both fulfilled and unfulfilled sessions

#### Scenario: Check session validity
- **WHEN** `isSessionValid(sessionId)` is called
- **THEN** it SHALL return true if session exists, is not expired, and not fulfilled
- **AND** return false otherwise

#### Scenario: Query non-existent session
- **WHEN** `getSession` is called with invalid session ID
- **THEN** it SHALL return a default empty session struct
- **OR** revert with `SessionNotFound` (implementation choice)

### Requirement: Fee Withdrawal

The contract SHALL allow admin to withdraw accumulated merchant fees.

#### Scenario: Withdraw accumulated fees
- **WHEN** admin calls `withdrawFees(token)`
- **THEN** all accumulated fees for that token SHALL be transferred to admin
- **AND** the accumulated fee balance SHALL be reset to zero
- **AND** a `FeesWithdrawn` event MUST be emitted

#### Scenario: Withdraw with no accumulated fees
- **WHEN** `withdrawFees` is called for a token with zero accumulated fees
- **THEN** the contract MUST revert with `NoFeesToWithdraw` error
- **AND** no transfer SHALL occur

#### Scenario: Track accumulated fees
- **WHEN** `getAccumulatedFees(token)` is called
- **THEN** it SHALL return the total merchant fees collected for that token
- **AND** the amount SHALL match sum of all merchantFee amounts from fulfilled sessions

### Requirement: Event Emission

The contract SHALL emit comprehensive events for all state changes to enable off-chain tracking.

#### Scenario: Session created event
- **WHEN** a session is created
- **THEN** `SessionCreated` event MUST be emitted
- **AND** include sessionId, merchant, token, amounts, fees, reference, expiresAt

#### Scenario: Session fulfilled event
- **WHEN** a session is fulfilled
- **THEN** `SessionFulfilled` event MUST be emitted
- **AND** include sessionId, payer, merchant, amount, fees, timestamp

#### Scenario: Session cancelled event
- **WHEN** a session is cancelled
- **THEN** `SessionCancelled` event MUST be emitted
- **AND** include the sessionId

#### Scenario: Fee configuration updated event
- **WHEN** fee configuration is changed
- **THEN** `FeeConfigUpdated` event MUST be emitted
- **AND** include all updated fee parameters

#### Scenario: Fee toggle events
- **WHEN** customer or merchant fees are toggled
- **THEN** respective `CustomerFeeToggled` or `MerchantFeeToggled` events MUST be emitted
- **AND** include the new enabled state

### Requirement: Access Control

The contract SHALL implement proper access control for administrative functions.

#### Scenario: Only admin can update fee config
- **WHEN** non-admin calls `setFeeConfig`
- **THEN** the transaction MUST revert
- **AND** fee configuration SHALL remain unchanged

#### Scenario: Only admin can toggle fees
- **WHEN** non-admin calls `setCustomerFeeEnabled` or `setMerchantFeeEnabled`
- **THEN** the transaction MUST revert
- **AND** fee states SHALL remain unchanged

#### Scenario: Only admin can manage token whitelist
- **WHEN** non-admin calls `setAllowedToken`
- **THEN** the transaction MUST revert
- **AND** token whitelist SHALL remain unchanged

#### Scenario: Only admin can withdraw fees
- **WHEN** non-admin calls `withdrawFees`
- **THEN** the transaction MUST revert
- **AND** accumulated fees SHALL remain in contract

### Requirement: Reference Field Support

The contract SHALL support optional merchant-provided reference strings for session tracking.

#### Scenario: Session with reference
- **WHEN** creating a session with a reference string
- **THEN** the reference SHALL be stored with the session
- **AND** the reference SHALL be included in `SessionCreated` event

#### Scenario: Session without reference
- **WHEN** creating a session with empty reference
- **THEN** the session SHALL be created successfully
- **AND** reference SHALL be empty string

#### Scenario: Reference in events
- **WHEN** querying session data
- **THEN** the reference SHALL be retrievable
- **AND** merchants can use it to correlate with their internal systems

## Non-Functional Requirements

### Security
- All monetary values SHALL use uint256 to prevent overflow
- Fee calculations SHALL use basis points (10000 denominator) for precision
- Sessions SHALL be uniquely identifiable to prevent confusion
- Access control SHALL prevent unauthorized configuration changes
- Token transfers SHALL use SafeERC20 or equivalent safety measures

### Performance
- Session lookup SHOULD be O(1) using mapping
- Merchant session queries SHOULD be optimized with indexing
- Event emission SHOULD enable efficient off-chain indexing
- Gas costs for common operations (create, fulfill) SHOULD be minimized

### Reliability
- Session expiration MUST be enforced strictly
- Double-spending MUST be prevented via fulfilled flag
- Fee calculations MUST be deterministic and verifiable
- State transitions SHALL be atomic

### Usability
- Error messages SHALL be clear and actionable
- View functions SHALL provide complete session information
- Events SHALL include all necessary data for off-chain systems
- Reference field SHALL support merchant workflow integration

### Maintainability
- Code SHALL be well-documented with NatSpec comments
- Fee configuration SHALL be adjustable without contract upgrade
- Token whitelist SHALL be manageable post-deployment
- Constants SHALL be clearly defined and documented
