# Relay API Specification

## Overview

The Relay API accepts signed transaction intents from users and broadcasts them to MANTRA Chain as EIP-7702 Type 4 transactions. The relayer pays gas fees on behalf of users, enabling a gasless UX.

## ADDED Requirements

### Requirement: Transaction Relay Endpoint

The system SHALL provide a POST endpoint to relay signed transaction intents to the blockchain.

#### Scenario: Successful relay with valid signature
- **WHEN** a valid relay request is submitted with correct signature
- **AND** the nonce matches the on-chain nonce
- **AND** the deadline has not expired
- **THEN** the system SHALL broadcast an EIP-7702 Type 4 transaction
- **AND** return the transaction hash
- **AND** return the block explorer URL

#### Scenario: Invalid signature rejection
- **WHEN** a relay request is submitted with an invalid signature
- **THEN** the system SHALL reject the request with HTTP 400
- **AND** return error code `INVALID_SIGNATURE`
- **AND** NOT broadcast any transaction

#### Scenario: Signature from wrong address
- **WHEN** the recovered signer does not match userAddress
- **THEN** the system SHALL reject the request with HTTP 400
- **AND** return error code `SIGNER_MISMATCH`

#### Scenario: Expired deadline rejection
- **WHEN** a relay request has a deadline in the past
- **THEN** the system SHALL reject the request with HTTP 400
- **AND** return error code `DEADLINE_EXPIRED`
- **AND** NOT broadcast any transaction

#### Scenario: Invalid nonce rejection
- **WHEN** the request nonce does not match the on-chain nonce
- **THEN** the system SHALL reject the request with HTTP 400
- **AND** return error code `INVALID_NONCE`
- **AND** include the expected nonce in the response

#### Scenario: Chain ID mismatch rejection
- **WHEN** the request chainId does not match the backend's configured chain
- **THEN** the system SHALL reject the request with HTTP 400
- **AND** return error code `CHAIN_MISMATCH`

### Requirement: Transaction Simulation

The system SHALL simulate transactions before broadcasting to prevent wasted gas on guaranteed failures.

#### Scenario: Simulation success proceeds to broadcast
- **WHEN** a transaction simulation succeeds
- **THEN** the system SHALL proceed to broadcast the transaction
- **AND** return the transaction hash on success

#### Scenario: Simulation failure prevents broadcast
- **WHEN** a transaction simulation fails
- **THEN** the system SHALL NOT broadcast the transaction
- **AND** return HTTP 400 with error code `SIMULATION_FAILED`
- **AND** include the revert reason in the response

### Requirement: Relay Request Validation

The system SHALL validate all relay request fields before processing.

#### Scenario: Valid request structure accepted
- **WHEN** a request contains all required fields with valid formats
- **THEN** the system SHALL proceed with signature verification

#### Scenario: Missing required field rejection
- **WHEN** a request is missing a required field
- **THEN** the system SHALL return HTTP 400
- **AND** indicate which field is missing

#### Scenario: Invalid address format rejection
- **WHEN** userAddress or destination is not a valid Ethereum address
- **THEN** the system SHALL return HTTP 400
- **AND** indicate the invalid field

#### Scenario: Invalid hex data rejection
- **WHEN** signature or data is not valid hexadecimal
- **THEN** the system SHALL return HTTP 400
- **AND** indicate the invalid field

### Requirement: Relayer Status Endpoint

The system SHALL provide a status endpoint to check relayer availability and balance.

#### Scenario: Healthy relayer status
- **WHEN** the relayer has sufficient balance for transactions
- **THEN** GET /relay/status SHALL return available: true
- **AND** include the relayer address
- **AND** include the current balance

#### Scenario: Low balance warning
- **WHEN** the relayer balance is below the configured threshold
- **THEN** GET /relay/status SHALL return available: true
- **AND** include a warning about low balance

#### Scenario: Unavailable relayer
- **WHEN** the relayer cannot broadcast transactions
- **THEN** GET /relay/status SHALL return available: false
- **AND** include the reason for unavailability

### Requirement: Rate Limiting

The system SHALL enforce rate limits to prevent abuse of the relay service.

#### Scenario: Within rate limit
- **WHEN** a client makes fewer than 10 requests per minute
- **THEN** all requests SHALL be processed normally

#### Scenario: Rate limit exceeded
- **WHEN** a client exceeds 10 requests per minute
- **THEN** the system SHALL return HTTP 429
- **AND** include Retry-After header
- **AND** NOT process the request

### Requirement: Relay Response Format

The system SHALL return consistent response formats for all relay operations.

#### Scenario: Successful relay response
- **WHEN** a transaction is successfully broadcast
- **THEN** the response SHALL include success: true
- **AND** include txHash as the transaction hash
- **AND** include explorerUrl for the transaction
- **AND** include a human-readable message

#### Scenario: Failed relay response
- **WHEN** a relay request fails
- **THEN** the response SHALL include success: false
- **AND** include an error code
- **AND** include a human-readable error message
- **AND** include details where applicable

## Non-Functional Requirements

### Performance
- Relay request processing SHOULD complete in < 5 seconds (excluding chain confirmation)
- Simulation SHOULD complete in < 2 seconds

### Security
- All requests SHALL be validated before signature verification
- Signature verification SHALL occur before any on-chain interaction
- Rate limiting SHALL be enforced per IP address

### Availability
- The relay endpoint SHOULD have 99.9% uptime
- Health checks SHALL be available at /health
