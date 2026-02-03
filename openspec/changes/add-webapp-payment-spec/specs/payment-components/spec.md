# Spec: Payment Components

> UI components for all payment states in the customer webapp.

## Overview

Payment components provide the visual interface for each state in the payment flow, following the OMies design system.

## Dependencies

- React 19
- Tailwind CSS v4
- ShadCN UI components
- Common components (AddressDisplay, BalanceDisplay, WalletConnectPill)

---

## ADDED Requirements

### Requirement: PaymentLoading Component

The component SHALL display a loading skeleton while fetching session data.

#### Scenario: Initial render

- Given the payment page is loading
- When PaymentLoading renders
- Then it SHALL display a skeleton UI
- And match the layout of PaymentReview

#### Scenario: Skeleton elements

- Given PaymentLoading is rendered
- When displayed
- Then it SHALL show:
  - Skeleton for merchant address
  - Skeleton for amount
  - Skeleton for fee breakdown
  - Skeleton for Pay button

#### Scenario: Animation

- Given PaymentLoading is rendered
- When displayed
- Then skeleton elements SHALL have pulse animation
- And indicate loading is in progress

---

### Requirement: SessionExpired Component

The component SHALL inform the user that the payment session has expired.

#### Scenario: Display expired message

- Given a session has expired
- When SessionExpired renders
- Then it SHALL display "Session Expired"
- And explain the payment link is no longer valid

#### Scenario: Action options

- Given SessionExpired is displayed
- When the user views the component
- Then it SHALL suggest contacting the merchant
- And optionally provide a "Request New Link" option

#### Scenario: Visual styling

- Given SessionExpired renders
- When displayed
- Then it SHALL use warning/error styling
- And include an appropriate icon (clock, warning)

---

### Requirement: SessionNotFound Component

The component SHALL inform the user that the session ID is invalid.

#### Scenario: Display not found message

- Given an invalid session ID
- When SessionNotFound renders
- Then it SHALL display "Session Not Found"
- And explain the link may be incorrect

#### Scenario: Troubleshooting tips

- Given SessionNotFound is displayed
- When the user views the component
- Then it SHALL suggest:
  - Checking the URL
  - Scanning the QR code again
  - Contacting the merchant

---

### Requirement: PaymentAlreadyComplete Component

The component SHALL show that the payment was already processed.

#### Scenario: Display completed message

- Given a fulfilled session
- When PaymentAlreadyComplete renders
- Then it SHALL display "Payment Complete"
- And show the payment was successful

#### Scenario: Transaction details

- Given a fulfilled session with transaction info
- When PaymentAlreadyComplete renders
- Then it SHALL display:
  - Amount paid
  - Merchant address
  - Transaction hash (linked to explorer)
  - Timestamp of payment

#### Scenario: Fulfilled by another party

- Given the current user did not make the payment
- When PaymentAlreadyComplete renders
- Then it SHALL explain "This payment was already completed"
- And show the payer address if available

---

### Requirement: ConnectWalletPrompt Component

The component SHALL prompt the user to connect their wallet.

#### Scenario: Display connect prompt

- Given no wallet is connected
- When ConnectWalletPrompt renders
- Then it SHALL display "Connect Wallet to Pay"
- And include WalletConnectPill component

#### Scenario: Payment preview

- Given session data is available
- When ConnectWalletPrompt renders
- Then it SHALL show:
  - Amount to pay (preview)
  - Merchant receiving payment
- And encourage connection to complete payment

#### Scenario: Mobile wallet options

- Given the user is on mobile
- When ConnectWalletPrompt renders
- Then AppKit modal SHALL offer mobile wallet options
- And deep linking SHALL be available

---

### Requirement: InsufficientBalance Component

The component SHALL warn when the user lacks funds.

#### Scenario: Display balance warning

- Given user balance < required total
- When InsufficientBalance renders
- Then it SHALL display "Insufficient Balance"
- And show required vs available amounts

#### Scenario: Balance details

- Given insufficient balance
- When InsufficientBalance renders
- Then it SHALL display:
  - Required: X.XX mantraUSD
  - Available: Y.YY mantraUSD
  - Shortfall: Z.ZZ mantraUSD

#### Scenario: Action suggestion

- Given insufficient balance
- When InsufficientBalance renders
- Then it SHALL suggest:
  - Getting more mantraUSD
  - Using a different wallet

---

### Requirement: PaymentReview Component

The component SHALL display payment details for user confirmation.

#### Scenario: Amount display

- Given a valid session
- When PaymentReview renders
- Then it SHALL prominently display the total amount
- And use BalanceDisplay with proper formatting

#### Scenario: Merchant display

- Given a valid session with merchant address
- When PaymentReview renders
- Then it SHALL display the merchant address
- And use AddressDisplay component

#### Scenario: Fee breakdown

- Given customer fee is enabled
- When PaymentReview renders
- Then it SHALL display:
  - Base Amount: X.XX mantraUSD
  - Network Fee: Y.YY mantraUSD
  - Total: Z.ZZ mantraUSD

#### Scenario: Fee breakdown - gasless

- Given customer fee is disabled (0)
- When PaymentReview renders
- Then it SHALL display:
  - Amount: X.XX mantraUSD
  - Network Fee: $0.00 (Gasless!)
  - Total: X.XX mantraUSD

#### Scenario: Merchant receives display

- Given merchant fee is enabled
- When PaymentReview renders
- Then it SHALL optionally show "Merchant receives: X.XX mantraUSD"

#### Scenario: Fee quote countdown

- Given feeQuoteExpiresAt is in the future
- When PaymentReview renders
- Then it SHALL display "Quote expires in Xs"
- And countdown SHALL update every second

#### Scenario: Fee quote refresh

- Given fee quote has expired
- When the countdown reaches 0
- Then a loading indicator SHALL appear
- And a new quote SHALL be fetched
- And the updated fee SHALL be displayed

#### Scenario: Session expiry countdown

- Given expiresAt is in the future
- When PaymentReview renders
- Then it SHALL display session expiry countdown
- And warn when < 1 minute remains

#### Scenario: Pay button enabled

- Given user has sufficient balance
- And fee quote is valid
- When PaymentReview renders
- Then the Pay button SHALL be enabled
- And display "Pay X.XX mantraUSD"

#### Scenario: Pay button disabled - insufficient balance

- Given user has insufficient balance
- When PaymentReview renders
- Then the Pay button SHALL be disabled
- And show "Insufficient Balance"

#### Scenario: Pay button disabled - quote expired

- Given fee quote is expired and refreshing
- When PaymentReview renders
- Then the Pay button SHALL be disabled
- And show "Updating quote..."

---

### Requirement: PaymentSigning Component

The component SHALL indicate signature is being requested.

#### Scenario: Display signing prompt

- Given signature is being requested
- When PaymentSigning renders
- Then it SHALL display "Confirm in Wallet"
- And show a waiting indicator

#### Scenario: Wallet-specific guidance

- Given the wallet type is known
- When PaymentSigning renders
- Then it MAY display wallet-specific instructions
- Such as "Check your MetaMask popup"

#### Scenario: Cancel option

- Given signing is in progress
- When PaymentSigning renders
- Then a cancel option SHALL NOT be displayed
- As the user can reject in the wallet

---

### Requirement: PaymentProcessing Component

The component SHALL show transaction is being processed.

#### Scenario: Display processing state

- Given relay request has been submitted
- When PaymentProcessing renders
- Then it SHALL display "Processing Payment..."
- And show a loading spinner

#### Scenario: Transaction hash display

- Given txHash is available
- When PaymentProcessing renders
- Then it SHALL display the transaction hash
- And link to the block explorer

#### Scenario: Processing stages

- Given the transaction is in progress
- When PaymentProcessing renders
- Then it MAY show stages:
  - "Submitting transaction..."
  - "Waiting for confirmation..."

---

### Requirement: PaymentSuccess Component

The component SHALL confirm successful payment.

#### Scenario: Display success message

- Given transaction is confirmed
- When PaymentSuccess renders
- Then it SHALL display "Payment Successful!"
- And use success styling (green checkmark)

#### Scenario: Payment summary

- Given successful payment
- When PaymentSuccess renders
- Then it SHALL display:
  - Amount paid
  - Merchant address
  - Transaction hash (explorer link)

#### Scenario: Explorer link

- Given txHash is available
- When PaymentSuccess renders
- Then it SHALL include "View on Explorer" link
- And link SHALL open in new tab

#### Scenario: Done action

- Given PaymentSuccess is displayed
- When the user wants to close
- Then a "Done" button SHALL be available
- And it MAY close the tab or show completion message

---

### Requirement: PaymentError Component

The component SHALL display error information with recovery options.

#### Scenario: Display error message

- Given a payment error occurred
- When PaymentError renders
- Then it SHALL display error description
- And use error styling (red/warning)

#### Scenario: Specific error messages

- Given different error types
- When PaymentError renders
- Then it SHALL display appropriate messages:
  - SESSION_EXPIRED: "This payment session has expired"
  - INSUFFICIENT_BALANCE: "You don't have enough mantraUSD"
  - TX_REVERTED: "Transaction failed on-chain"
  - NETWORK_ERROR: "Could not connect to server"

#### Scenario: Retry option

- Given a retryable error (network, tx failed)
- When PaymentError renders
- Then a "Try Again" button SHALL be available
- And clicking it SHALL reset to review state

#### Scenario: Non-retryable error

- Given a non-retryable error (session expired)
- When PaymentError renders
- Then no retry option SHALL be shown
- And appropriate next steps SHALL be suggested

#### Scenario: Error details for debugging

- Given an error with technical details
- When PaymentError renders
- Then it MAY include expandable "Details" section
- And show error code and message

---

## Component Props

```typescript
interface PaymentLoadingProps {
  // No props required
}

interface SessionExpiredProps {
  expiresAt: Date;
}

interface SessionNotFoundProps {
  sessionId: string;
}

interface PaymentAlreadyCompleteProps {
  session: PaymentSession;
  txHash?: string;
  paidBy?: Address;
}

interface ConnectWalletPromptProps {
  session: PaymentSession;
}

interface InsufficientBalanceProps {
  required: bigint;
  available: bigint;
  token: TokenConfig;
}

interface PaymentReviewProps {
  session: PaymentSession;
  userBalance: bigint;
  onPay: () => void;
  feeQuoteSecondsRemaining: number;
  sessionSecondsRemaining: number;
  isRefreshingQuote: boolean;
}

interface PaymentSigningProps {
  // No props required
}

interface PaymentProcessingProps {
  txHash?: string;
  explorerUrl?: string;
}

interface PaymentSuccessProps {
  session: PaymentSession;
  txHash: string;
  explorerUrl: string;
  onDone?: () => void;
}

interface PaymentErrorProps {
  error: PaymentError;
  onRetry?: () => void;
  canRetry: boolean;
}
```

---

## Styling Guidelines

| Component               | Background | Border      | Primary Color |
|-------------------------|------------|-------------|---------------|
| PaymentLoading          | white      | none        | gray (skeleton)|
| SessionExpired          | white      | orange      | orange        |
| SessionNotFound         | white      | gray        | gray          |
| PaymentAlreadyComplete  | white      | green       | green         |
| ConnectWalletPrompt     | white      | none        | primary       |
| InsufficientBalance     | white      | orange      | orange        |
| PaymentReview           | white      | none        | primary       |
| PaymentSigning          | white      | none        | primary       |
| PaymentProcessing       | white      | none        | primary       |
| PaymentSuccess          | white      | green       | green         |
| PaymentError            | white      | red         | red           |

All components SHALL follow the OMies design system with:
- Rounded corners (rounded-lg)
- White card backgrounds
- Primary text color (#3B506C)
- Proper spacing (p-6 or similar)
