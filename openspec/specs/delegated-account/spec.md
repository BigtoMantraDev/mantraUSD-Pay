# Delegated Account Specification

## Overview

The Delegated Account contract is an EIP-7702 implementation that enables temporary EOA delegation for gasless transactions. User EOAs delegate to this contract to execute payments without holding native tokens for gas.

## Requirements

### Requirement: EIP-712 Signature Verification

The contract SHALL verify EIP-712 typed data signatures for all executions to ensure authenticity and prevent signature malleability.

#### Scenario: Valid signature verification
- **WHEN** a valid EIP-712 signature is provided with matching signer
- **THEN** the signature verification MUST pass
- **AND** the execution SHALL proceed

#### Scenario: Invalid signature rejection
- **WHEN** an invalid or malformed signature is provided
- **THEN** the contract MUST revert with `InvalidSignature` error
- **AND** no execution SHALL occur

#### Scenario: Signature from wrong account
- **WHEN** a signature is valid but from a different account than the delegating EOA
- **THEN** the contract MUST revert with `InvalidSignature` error
- **AND** the execution SHALL be prevented

### Requirement: Nonce Management

The contract SHALL maintain per-account nonces to prevent replay attacks and ensure transaction ordering.

#### Scenario: First execution with nonce 0
- **WHEN** an account executes for the first time
- **THEN** the nonce SHALL be 0
- **AND** after execution, the nonce MUST increment to 1

#### Scenario: Sequential nonce enforcement
- **WHEN** a transaction is submitted with nonce N
- **THEN** the contract MUST verify the current nonce equals N
- **AND** reject the transaction if nonces don't match

#### Scenario: Nonce increment after execution
- **WHEN** a transaction successfully executes
- **THEN** the account's nonce MUST increment by 1
- **AND** the new nonce SHALL be returned to callers

#### Scenario: Replay attack prevention
- **WHEN** the same signature is submitted multiple times
- **THEN** only the first submission SHALL succeed
- **AND** subsequent submissions MUST revert with `InvalidNonce` error

### Requirement: Deadline Enforcement

The contract SHALL enforce signature deadlines to prevent execution of expired authorizations.

#### Scenario: Execution before deadline
- **WHEN** a transaction is submitted with deadline > current timestamp
- **THEN** the execution SHALL be allowed to proceed
- **AND** no deadline-related error SHALL occur

#### Scenario: Expired signature rejection
- **WHEN** a transaction is submitted with deadline <= current timestamp
- **THEN** the contract MUST revert with `ExpiredSignature` error
- **AND** no execution SHALL occur

#### Scenario: Reasonable deadline window
- **WHEN** creating a signature for future execution
- **THEN** the deadline SHOULD be set between 60 seconds and 1 hour from creation
- **AND** balances the security and usability requirements

### Requirement: Atomic Execution

The contract SHALL execute the authorized operation atomically as part of the signature verification.

#### Scenario: Successful execution
- **WHEN** a valid signed transaction is processed
- **THEN** the destination contract call MUST execute
- **AND** the execution SHALL complete in a single transaction
- **AND** an `ExecutionSuccess` event MUST be emitted

#### Scenario: Execution failure handling
- **WHEN** the destination contract call reverts
- **THEN** the entire transaction MUST revert
- **AND** an `ExecutionFailed` event SHALL be emitted with the revert reason
- **AND** the nonce SHALL NOT increment

#### Scenario: No partial state changes
- **WHEN** any validation or execution step fails
- **THEN** all state changes MUST be reverted
- **AND** the contract SHALL return to pre-transaction state

### Requirement: Destination Validation

The contract SHALL validate execution destinations to prevent security vulnerabilities.

#### Scenario: Call to valid contract address
- **WHEN** destination is a valid contract address
- **THEN** the execution SHALL be allowed
- **AND** the call SHALL be forwarded to that address

#### Scenario: Zero address rejection
- **WHEN** destination is the zero address (0x0)
- **THEN** the contract MUST revert with `InvalidDestination` error
- **AND** no execution SHALL occur

#### Scenario: Self-reference prevention
- **WHEN** destination is the DelegatedAccount contract itself
- **THEN** the contract MUST revert with `InvalidDestination` error
- **AND** prevent potential recursion attacks

### Requirement: Token Transfer Helper

The contract SHALL provide a convenience function for ERC-20 token transfers with signature verification.

#### Scenario: Token transfer execution
- **WHEN** `transferToken` is called with valid signature
- **THEN** the contract SHALL encode the ERC-20 transfer call
- **AND** execute it through the standard `execute` function
- **AND** return success status

#### Scenario: Token transfer validation
- **WHEN** `transferToken` is called
- **THEN** all standard validations SHALL apply (signature, nonce, deadline)
- **AND** the token contract address SHALL be validated
- **AND** the recipient and amount SHALL be validated

### Requirement: EIP-1271 Signature Validation

The contract SHALL implement EIP-1271 for smart contract signature validation compatibility.

#### Scenario: Valid signature verification via isValidSignature
- **WHEN** `isValidSignature` is called with a valid hash and signature
- **THEN** the contract MUST return the EIP-1271 magic value (0x1626ba7e)
- **AND** confirm the signature is from the delegating account

#### Scenario: Invalid signature rejection via isValidSignature
- **WHEN** `isValidSignature` is called with an invalid signature
- **THEN** the contract MUST return a different value (0xffffffff)
- **AND** indicate signature validation failure

### Requirement: Domain Separator

The contract SHALL implement EIP-712 domain separator for chain-specific signature binding.

#### Scenario: Domain separator includes contract address
- **WHEN** the domain separator is computed
- **THEN** it MUST include the contract's address
- **AND** bind signatures to this specific deployment

#### Scenario: Domain separator includes chain ID
- **WHEN** the domain separator is computed
- **THEN** it MUST include the current chain ID
- **AND** prevent cross-chain signature replay

#### Scenario: Domain separator includes name and version
- **WHEN** the domain separator is computed
- **THEN** it MUST include name "DelegatedAccount" and version "1"
- **AND** prevent signature confusion with other contracts

### Requirement: Execute Digest Computation

The contract SHALL provide a function to compute the EIP-712 typed data hash for execution intents.

#### Scenario: Digest computation for signing
- **WHEN** `getExecuteDigest` is called with execution parameters
- **THEN** it SHALL return the correctly formatted EIP-712 hash
- **AND** frontends can use this to construct signatures

#### Scenario: Digest includes all execution parameters
- **WHEN** computing the execution digest
- **THEN** it MUST include account, destination, value, data, nonce, and deadline
- **AND** ensure complete parameter coverage

### Requirement: Event Emission

The contract SHALL emit events for all execution attempts to enable tracking and debugging.

#### Scenario: Success event emission
- **WHEN** an execution completes successfully
- **THEN** an `ExecutionSuccess` event MUST be emitted
- **AND** it SHALL include account, destination, value, and data

#### Scenario: Failure event emission
- **WHEN** an execution fails
- **THEN** an `ExecutionFailed` event MUST be emitted
- **AND** it SHALL include the revert reason for debugging

### Requirement: Stateless Design

The contract SHALL be stateless except for nonce tracking, with all authorization state living on the delegating EOA.

#### Scenario: No user-specific storage
- **WHEN** examining contract storage
- **THEN** only nonce mappings SHALL exist
- **AND** no other user-specific data SHALL be stored

#### Scenario: Temporary delegation
- **WHEN** a user delegates to this contract via EIP-7702
- **THEN** the delegation SHALL be revocable by the user
- **AND** no permanent state SHALL bind the user to this contract

### Requirement: Gas Efficiency

The contract SHALL be optimized for gas efficiency since the relayer pays gas costs.

#### Scenario: Minimal storage operations
- **WHEN** executing a transaction
- **THEN** only necessary storage operations SHALL occur
- **AND** gas cost SHOULD be minimized

#### Scenario: Efficient signature verification
- **WHEN** verifying signatures
- **THEN** the contract SHALL use native EVM operations
- **AND** avoid unnecessary computations

### Requirement: Type Safety

The contract SHALL use Solidity's type system to prevent common vulnerabilities.

#### Scenario: Address type validation
- **WHEN** accepting address parameters
- **THEN** the contract SHALL use the `address` type
- **AND** prevent address(0) where inappropriate

#### Scenario: Uint256 for nonces and deadlines
- **WHEN** managing nonces and timestamps
- **THEN** the contract SHALL use `uint256` type
- **AND** prevent overflow/underflow issues

## Non-Functional Requirements

### Security
- All user inputs SHALL be validated
- Signatures SHALL use EIP-712 structured data
- Replay attacks SHALL be prevented via nonce management
- Cross-chain replay SHALL be prevented via domain separator

### Performance
- Execution gas cost SHOULD be < 150,000 gas units
- Signature verification SHOULD complete in < 50,000 gas units
- Nonce lookups SHALL be O(1) complexity

### Compatibility
- MUST be compatible with EIP-7702 Type 4 transactions
- MUST implement EIP-1271 signature validation
- MUST follow EIP-712 typed data signing

### Maintainability
- Code SHALL be well-documented with NatSpec comments
- Interface SHALL be clearly defined and stable
- Error messages SHALL be descriptive and actionable
