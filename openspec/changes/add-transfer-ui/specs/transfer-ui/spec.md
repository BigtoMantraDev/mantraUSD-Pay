# Transfer UI Specification

## Overview

The Transfer UI provides a gasless ERC20 transfer experience. Users enter recipient and amount, sign an EIP-712 message (no gas required), and the backend relayer broadcasts the transaction on their behalf.

## ADDED Requirements

### Requirement: Transfer Form Input

The system SHALL provide a form for users to enter transfer details with validation.

#### Scenario: Valid recipient and amount entry
- **WHEN** user enters a valid Ethereum address as recipient
- **AND** user enters a valid token amount
- **THEN** the form SHALL enable the continue/confirm button
- **AND** display the entered values for review

#### Scenario: Invalid recipient address rejection
- **WHEN** user enters an invalid Ethereum address
- **THEN** the form SHALL show an inline error message
- **AND** disable the confirm button

#### Scenario: Amount exceeds balance rejection
- **WHEN** user enters an amount greater than their token balance
- **THEN** the form SHALL show "Insufficient balance" error
- **AND** disable the confirm button

#### Scenario: Zero amount rejection
- **WHEN** user enters zero or empty amount
- **THEN** the form SHALL disable the confirm button
- **AND** NOT show an error (considered incomplete input)

#### Scenario: Max button functionality
- **WHEN** user clicks the "Max" button
- **THEN** the amount field SHALL populate with their full balance minus fee
- **AND** update the total display accordingly

### Requirement: Fee Quote Display

The system SHALL display the current relay fee before user confirms the transfer.

#### Scenario: Fee quote loaded successfully
- **WHEN** the transfer form is displayed
- **AND** the backend returns a fee quote
- **THEN** the system SHALL display the fee amount
- **AND** display the fee in human-readable format (e.g., "0.05 mantraUSD")

#### Scenario: Fee quote loading state
- **WHEN** the fee quote is being fetched
- **THEN** the system SHALL show a loading indicator in the fee section
- **AND** disable the confirm button until loaded

#### Scenario: Fee quote error
- **WHEN** the fee quote request fails
- **THEN** the system SHALL show an error message
- **AND** provide a retry button
- **AND** disable the confirm button

#### Scenario: Fee quote expiration warning
- **WHEN** the fee quote is close to expiration (< 30 seconds)
- **THEN** the system SHALL show a countdown or warning
- **AND** auto-refresh the quote when expired

#### Scenario: Total amount display
- **WHEN** user has entered a valid amount
- **AND** fee quote is available
- **THEN** the system SHALL display total = amount + fee
- **AND** verify user has sufficient balance for total

### Requirement: EIP-712 Signature Request

The system SHALL request EIP-712 typed data signatures from the user's wallet.

#### Scenario: Signature request initiated
- **WHEN** user clicks confirm on a valid transfer
- **THEN** the system SHALL build EIP-712 typed data with correct domain
- **AND** request signature via wallet connection
- **AND** show "Signing..." state in the UI

#### Scenario: Signature approved
- **WHEN** user approves the signature in their wallet
- **THEN** the system SHALL capture the signature
- **AND** proceed to relay submission
- **AND** transition to "Relaying..." state

#### Scenario: Signature rejected
- **WHEN** user rejects the signature in their wallet
- **THEN** the system SHALL return to the review state
- **AND** show "Transaction cancelled" message
- **AND** allow user to retry

#### Scenario: Wallet disconnected during signing
- **WHEN** the wallet disconnects during signature request
- **THEN** the system SHALL show an error
- **AND** prompt user to reconnect wallet

### Requirement: Relay Submission

The system SHALL submit signed intents to the backend relay service.

#### Scenario: Successful relay submission
- **WHEN** a valid signature is obtained
- **THEN** the system SHALL POST to /relay with intent and signature
- **AND** show "Submitting to relay..." state
- **AND** display the returned transaction hash on success

#### Scenario: Relay service unavailable
- **WHEN** the backend relay service is unavailable
- **THEN** the system SHALL show "Relay service unavailable" error
- **AND** provide retry button
- **AND** NOT consume the user's signature

#### Scenario: Relay rejection due to invalid nonce
- **WHEN** the relay returns INVALID_NONCE error
- **THEN** the system SHALL show "Nonce mismatch, please retry"
- **AND** refetch the current nonce
- **AND** allow user to sign again with correct nonce

#### Scenario: Relay rejection due to expired deadline
- **WHEN** the relay returns DEADLINE_EXPIRED error
- **THEN** the system SHALL show "Signature expired, please try again"
- **AND** refresh the fee quote
- **AND** return to review state

### Requirement: Transaction Status Display

The system SHALL display transaction status through the relay and confirmation process.

#### Scenario: Transaction pending confirmation
- **WHEN** the relay successfully submits the transaction
- **THEN** the system SHALL show "Transaction pending..."
- **AND** display the transaction hash
- **AND** provide explorer link

#### Scenario: Transaction confirmed
- **WHEN** the transaction is confirmed on-chain
- **THEN** the system SHALL show success state
- **AND** display confirmation details
- **AND** provide "New Transfer" button to reset form

#### Scenario: Transaction failed on-chain
- **WHEN** the transaction reverts on-chain
- **THEN** the system SHALL show error state
- **AND** display the revert reason if available
- **AND** provide retry option

### Requirement: Wallet Connection Guard

The system SHALL require wallet connection before allowing transfers.

#### Scenario: Wallet not connected
- **WHEN** user navigates to transfer page without connected wallet
- **THEN** the system SHALL show "Connect Wallet" prompt
- **AND** NOT display the transfer form

#### Scenario: Wallet connected to wrong network
- **WHEN** user's wallet is on an unsupported network
- **THEN** the system SHALL show network switch prompt
- **AND** provide button to switch to supported network
- **AND** disable transfer form until correct network

#### Scenario: Wallet connected successfully
- **WHEN** user has connected wallet on supported network
- **THEN** the system SHALL display the transfer form
- **AND** show user's address and balance

### Requirement: Nonce Management

The system SHALL fetch and use correct nonces for signature construction.

#### Scenario: Fresh nonce fetched before signing
- **WHEN** user initiates a transfer confirmation
- **THEN** the system SHALL fetch current nonce from backend/chain
- **AND** use this nonce in the EIP-712 message

#### Scenario: Nonce fetch failure
- **WHEN** nonce lookup fails
- **THEN** the system SHALL show error message
- **AND** disable confirm button
- **AND** provide retry option

### Requirement: Responsive Design

The system SHALL provide a mobile-friendly transfer experience.

#### Scenario: Mobile viewport
- **WHEN** user accesses transfer page on mobile device
- **THEN** the form SHALL be fully usable
- **AND** buttons SHALL be appropriately sized for touch
- **AND** inputs SHALL be readable and accessible

#### Scenario: Desktop viewport
- **WHEN** user accesses transfer page on desktop
- **THEN** the form SHALL be centered with appropriate max-width
- **AND** follow the card-based layout pattern

## Non-Functional Requirements

### Performance
- Fee quote fetch SHOULD complete in < 1 second
- Signature request SHOULD appear within 500ms of confirm click
- UI state transitions SHOULD feel instant (< 100ms)

### Accessibility
- All form inputs SHALL have proper labels
- Error messages SHALL be announced to screen readers
- Focus management SHALL be logical through the flow

### Consistency
- UI components SHALL use existing ShadCN primitives
- Colors and typography SHALL follow OMies design system
- Transaction states SHALL match existing TransactionDialog patterns
