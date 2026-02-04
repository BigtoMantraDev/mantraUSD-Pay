# Nonce API Specification

## Overview

The Nonce API provides on-chain nonce queries for user accounts. Nonces are managed by the DelegatedAccount contract and are required for EIP-712 signature construction.

## ADDED Requirements

### Requirement: Nonce Query Endpoint

The system SHALL provide a GET endpoint to retrieve the current nonce for an account.

#### Scenario: Successful nonce retrieval
- **WHEN** GET /nonce/:address is called with a valid address
- **AND** chainId query parameter is provided
- **THEN** the system SHALL query the DelegatedAccount contract
- **AND** return the current nonce as a string
- **AND** return the nonce as a number

#### Scenario: Account with no transactions
- **WHEN** querying nonce for an account that has never transacted
- **THEN** the nonce SHALL be 0
- **AND** the response SHALL indicate this is the first nonce

#### Scenario: Invalid address rejection
- **WHEN** GET /nonce/:address is called with an invalid address format
- **THEN** the system SHALL return HTTP 400
- **AND** return error code `INVALID_ADDRESS`

#### Scenario: Missing chain ID
- **WHEN** GET /nonce/:address is called without chainId parameter
- **THEN** the system SHALL return HTTP 400
- **AND** return error code `MISSING_CHAIN_ID`

#### Scenario: Unsupported chain ID
- **WHEN** GET /nonce/:address is called with unsupported chainId
- **THEN** the system SHALL return HTTP 400
- **AND** return error code `UNSUPPORTED_CHAIN`

### Requirement: Nonce Response Format

The system SHALL return consistent nonce response format.

#### Scenario: Standard nonce response
- **WHEN** a nonce query succeeds
- **THEN** the response SHALL include:
  - nonce: string (for BigInt compatibility)
  - nonceNumber: number (for convenience)

### Requirement: On-Chain Nonce Source

The system SHALL always query the authoritative on-chain nonce from DelegatedAccount.

#### Scenario: Fresh nonce query
- **WHEN** a nonce is queried
- **THEN** the system SHALL call DelegatedAccount.getNonce(address)
- **AND** return the latest on-chain value
- **AND** NOT use cached values

#### Scenario: Contract call failure handling
- **WHEN** the on-chain nonce query fails
- **THEN** the system SHALL return HTTP 503
- **AND** return error code `BLOCKCHAIN_ERROR`
- **AND** include the underlying error message

### Requirement: Address Validation

The system SHALL validate address format before querying on-chain.

#### Scenario: Valid checksummed address
- **WHEN** address is a valid EIP-55 checksummed address
- **THEN** the query SHALL proceed normally

#### Scenario: Valid lowercase address
- **WHEN** address is a valid lowercase Ethereum address
- **THEN** the query SHALL proceed normally
- **AND** the system SHALL normalize the address

#### Scenario: Invalid address format
- **WHEN** address is not a valid 40-character hex string (with 0x prefix)
- **THEN** the system SHALL return HTTP 400
- **AND** NOT make any on-chain queries

## Non-Functional Requirements

### Performance
- Nonce queries SHOULD complete in < 1 second
- No caching SHALL be applied (always fresh on-chain data)

### Reliability
- Nonce endpoint SHOULD have 99.9% uptime
- RPC failures SHALL be reported with clear error messages

### Consistency
- Nonce values SHALL always reflect current on-chain state
- No optimistic nonce tracking SHALL be performed
