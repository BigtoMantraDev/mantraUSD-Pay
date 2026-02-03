# Spec: Payment Flow

> Route structure, state machine, and navigation logic for customer payments.

## Overview

The payment flow defines how customers navigate through the gasless payment experience, from scanning a QR code to receiving confirmation.

## Dependencies

- TanStack Router for file-based routing
- Backend API for session management
- Wagmi for wallet connection

---

## ADDED Requirements

### Requirement: Payment Route Structure

The webapp SHALL provide a dynamic route `/pay/:sessionId` for processing payments.

#### Scenario: Valid session ID in route

- Given a valid sessionId in the URL path
- And a valid chainId in the query parameters
- When the route loads
- Then the payment page SHALL render
- And session data SHALL be fetched from the backend

#### Scenario: Missing chainId parameter

- Given a sessionId in the URL path
- And no chainId query parameter
- When the route loads
- Then the system SHALL use the default configured chain
- And display a warning if on testnet

#### Scenario: Invalid sessionId format

- Given an invalid sessionId format (not UUID or expected format)
- When the route loads
- Then the system SHALL display SessionNotFound component
- And NOT make an API request

#### Scenario: Route metadata

- Given the payment route loads
- When the page renders
- Then the document title SHALL be "Pay - mantraUSD"
- And appropriate meta tags SHALL be set

---

### Requirement: Payment State Machine

The payment page SHALL implement a state machine with defined transitions.

#### Scenario: Initial loading state

- Given a user opens a payment link
- When the page first renders
- Then the state SHALL be "loading"
- And PaymentLoading component SHALL display

#### Scenario: Transition to wallet prompt

- Given session data is successfully fetched
- And the session is valid and not expired
- And the user's wallet is not connected
- When loading completes
- Then the state SHALL transition to "wallet-prompt"
- And ConnectWalletPrompt component SHALL display

#### Scenario: Transition to payment review

- Given session data is successfully fetched
- And the session is valid
- And the user's wallet is connected
- And the user is on the correct network
- When loading completes
- Then the state SHALL transition to "review"
- And PaymentReview component SHALL display

#### Scenario: Transition to signing

- Given the user is in "review" state
- When the user clicks the Pay button
- Then the state SHALL transition to "signing"
- And PaymentSigning component SHALL display
- And the wallet signature request SHALL be triggered

#### Scenario: Transition to processing

- Given the user is in "signing" state
- When the user approves the signature in their wallet
- Then the state SHALL transition to "processing"
- And PaymentProcessing component SHALL display
- And the relay request SHALL be submitted

#### Scenario: Transition to success

- Given the user is in "processing" state
- When the transaction is confirmed
- Then the state SHALL transition to "success"
- And PaymentSuccess component SHALL display

#### Scenario: Transition to error from processing

- Given the user is in "processing" state
- When the transaction fails or relay returns an error
- Then the state SHALL transition to "error"
- And PaymentError component SHALL display
- And a retry option SHALL be available

#### Scenario: User rejects signature

- Given the user is in "signing" state
- When the user rejects the signature in their wallet
- Then the state SHALL transition back to "review"
- And no error message SHALL persist

---

### Requirement: Session Expiry Handling

The payment flow SHALL handle session expiration gracefully.

#### Scenario: Session already expired on load

- Given a sessionId for an expired session
- When the page loads
- Then SessionExpired component SHALL display
- And no payment action SHALL be available

#### Scenario: Session expires during review

- Given the user is reviewing a valid session
- When the session expiry time passes
- Then the state SHALL transition to "expired"
- And SessionExpired component SHALL display
- And the Pay button SHALL be disabled

#### Scenario: Expiry countdown display

- Given a valid session with time remaining
- When the payment review is displayed
- Then a countdown timer SHALL show remaining time
- And the timer SHALL update every second

---

### Requirement: Session Already Fulfilled

The payment flow SHALL detect already-fulfilled sessions.

#### Scenario: Session fulfilled on load

- Given a sessionId for a fulfilled session
- When the page loads
- Then PaymentAlreadyComplete component SHALL display
- And transaction details SHALL be shown

#### Scenario: Session fulfilled during review

- Given the user is reviewing a pending session
- And another party fulfills the session
- When the polling detects the status change
- Then PaymentAlreadyComplete component SHALL display
- And a message SHALL explain the session was paid

---

### Requirement: Network Validation

The payment flow SHALL validate the user is on the correct network.

#### Scenario: Wrong network connected

- Given the user's wallet is connected to network A
- And the payment session requires network B
- When the payment review would display
- Then NetworkBanner SHALL show a warning
- And a "Switch Network" button SHALL be available

#### Scenario: Network switch success

- Given the user is on the wrong network
- When the user clicks "Switch Network"
- And the wallet switches to the correct network
- Then the payment flow SHALL continue normally

#### Scenario: Unsupported network

- Given the user's wallet is connected to an unsupported network
- When the page loads
- Then NetworkBanner SHALL display "Unsupported Network"
- And instructions to switch SHALL be provided

---

### Requirement: Deep Link Support

The payment route SHALL support being opened from QR codes and external links.

#### Scenario: Open from QR code scan

- Given a QR code containing a payment URL
- When the user scans with their phone camera
- Then the payment page SHALL open in the mobile browser
- And wallet connection SHALL be prompted

#### Scenario: Open from share link

- Given a payment URL shared via message or email
- When the user clicks the link
- Then the payment page SHALL open
- And the full payment flow SHALL be available

#### Scenario: Mobile wallet deep link

- Given the user opens a payment link on mobile
- When a compatible wallet app is installed
- Then AppKit SHALL offer to open the wallet app
- And the signature request SHALL be handled by the wallet app

---

## State Diagram

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
              ┌─────────┐                                     │
    ────────▶│ Loading │                                     │
              └────┬────┘                                     │
                   │                                          │
         ┌─────────┼─────────┬─────────────┐                 │
         │         │         │             │                  │
         ▼         ▼         ▼             ▼                  │
    ┌─────────┐ ┌──────┐ ┌─────────┐ ┌───────────┐           │
    │ Expired │ │Error │ │Fulfilled│ │WalletPrompt│           │
    └─────────┘ └──────┘ └─────────┘ └─────┬─────┘           │
                   ▲                       │                  │
                   │                       │ connect          │
                   │                       ▼                  │
                   │                 ┌──────────┐             │
                   │                 │  Review  │◀────────────┤
                   │                 └────┬─────┘   reject    │
                   │                      │                   │
                   │                      │ pay               │
                   │                      ▼                   │
                   │                 ┌──────────┐             │
                   │                 │ Signing  │─────────────┘
                   │                 └────┬─────┘
                   │                      │
                   │                      │ signed
                   │                      ▼
                   │                 ┌───────────┐
                   └─────────────────│Processing │
                          fail       └────┬──────┘
                                          │
                                          │ confirmed
                                          ▼
                                    ┌──────────┐
                                    │ Success  │
                                    └──────────┘
```
