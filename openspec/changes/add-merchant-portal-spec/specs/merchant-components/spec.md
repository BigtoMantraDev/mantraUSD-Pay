# Spec: Merchant Components

> UI components for the merchant portal dashboard, session creation, and management.

## Overview

Merchant components provide the visual interface for all merchant portal functionality, following the OMies design system.

## Dependencies

- React 19
- Tailwind CSS v4
- ShadCN UI components
- QR code generation library

---

## ADDED Requirements

### Requirement: StatsCard Component

The component SHALL display a single statistic with label and value.

#### Scenario: Render stat card

- Given a label and value
- When StatsCard renders
- Then the label SHALL display above the value
- And the value SHALL be prominently styled

#### Scenario: Loading state

- Given isLoading=true
- When StatsCard renders
- Then a skeleton placeholder SHALL display

#### Scenario: Stat variants

- Given different stat types
- When StatsCard renders
- Then it SHALL support:
  - Count (integer)
  - Currency (formatted amount)
  - Percentage

---

### Requirement: Dashboard Stats Cards

The dashboard SHALL display three stat cards.

#### Scenario: Today's payments card

- Given dashboard renders
- When stats are loaded
- Then "Today's Payments" card SHALL display
- And show count of fulfilled sessions today

#### Scenario: Today's volume card

- Given dashboard renders
- When stats are loaded
- Then "Today's Volume" card SHALL display
- And show sum of amounts in mantraUSD

#### Scenario: Active sessions card

- Given dashboard renders
- When stats are loaded
- Then "Active Sessions" card SHALL display
- And show count of pending (non-expired) sessions

---

### Requirement: SessionListItem Component

The component SHALL display a single session in list format.

#### Scenario: Display session info

- Given a session object
- When SessionListItem renders
- Then it SHALL display:
  - Reference or truncated sessionId
  - Amount (formatted)
  - Status badge
  - Created time (relative)

#### Scenario: Status badge colors

- Given different session statuses
- When SessionListItem renders
- Then badges SHALL use appropriate colors:
  - Pending: blue
  - Fulfilled: green
  - Expired: gray
  - Cancelled: red

#### Scenario: Click to view detail

- Given a session list item
- When the merchant clicks it
- Then they SHALL navigate to session detail

#### Scenario: Quick QR action

- Given a pending session item
- When "View QR" action is clicked
- Then QR code modal SHALL open

---

### Requirement: ActiveSessionsList Component

The component SHALL display pending sessions on the dashboard.

#### Scenario: List active sessions

- Given pending sessions exist
- When ActiveSessionsList renders
- Then up to 5 pending sessions SHALL display
- And sessions SHALL be sorted by creation (newest first)

#### Scenario: Empty state

- Given no pending sessions
- When ActiveSessionsList renders
- Then "No active sessions" message SHALL display
- And "Create Payment" CTA SHALL be visible

#### Scenario: View all link

- Given more than 5 active sessions
- When ActiveSessionsList renders
- Then "View All" link SHALL appear
- And link SHALL navigate to history with status filter

---

### Requirement: RecentPaymentsList Component

The component SHALL display recently fulfilled sessions.

#### Scenario: List recent payments

- Given fulfilled sessions exist
- When RecentPaymentsList renders
- Then up to 5 recent payments SHALL display
- And sessions SHALL be sorted by fulfillment time

#### Scenario: Payment item display

- Given a fulfilled session
- When displayed in the list
- Then it SHALL show:
  - Amount received by merchant
  - Payer address (truncated)
  - Time ago

#### Scenario: Empty state

- Given no fulfilled sessions
- When RecentPaymentsList renders
- Then "No payments yet" message SHALL display

---

### Requirement: CreateSessionForm Component

The component SHALL provide a form for creating payment sessions.

#### Scenario: Amount input

- Given the form renders
- When amount field is shown
- Then it SHALL accept numeric input
- And enforce max 6 decimal places
- And show mantraUSD symbol

#### Scenario: Amount validation

- Given amount input
- When invalid value entered (negative, zero, too many decimals)
- Then validation error SHALL display
- And submit SHALL be disabled

#### Scenario: Reference input

- Given the form renders
- When reference field is shown
- Then it SHALL be optional
- And max 100 characters
- And placeholder "Order #123 (optional)"

#### Scenario: Duration selection

- Given the form renders
- When duration field is shown
- Then it SHALL be a dropdown with options:
  - 5 minutes
  - 15 minutes (default)
  - 30 minutes
  - 1 hour
  - 24 hours

#### Scenario: Fee preview

- Given valid amount entered
- When fee preview section renders
- Then it SHALL show:
  - Base amount
  - Customer fee (estimated)
  - Merchant fee (calculated)
  - Merchant receives (amount - merchant fee)

#### Scenario: Submit button

- Given valid form data
- When form is complete
- Then "Create Payment Request" button SHALL be enabled

#### Scenario: Submit loading state

- Given form submission in progress
- When loading
- Then button SHALL show spinner
- And button SHALL be disabled

---

### Requirement: SessionCreatedModal Component

The component SHALL display after successful session creation.

#### Scenario: Modal display

- Given successful session creation
- When SessionCreatedModal opens
- Then success message SHALL display
- And QR code SHALL be prominently shown
- And payment URL SHALL be visible

#### Scenario: QR code focus

- Given the modal is open
- When rendered
- Then QR code SHALL be large (min 200x200px)
- And have clear instructions to scan

#### Scenario: Copy URL action

- Given the modal is open
- When "Copy Link" is clicked
- Then payment URL SHALL copy to clipboard
- And confirmation toast SHALL show

#### Scenario: Modal actions

- Given the modal is open
- When action buttons render
- Then "View Session", "Create Another", "Close" SHALL be available

---

### Requirement: QRCodeDisplay Component

The component SHALL render QR codes for payment URLs.

#### Scenario: Generate QR from URL

- Given a payment URL
- When QRCodeDisplay renders
- Then a scannable QR code SHALL display

#### Scenario: Size variants

- Given different display contexts
- When QRCodeDisplay renders
- Then it SHALL support sizes:
  - small (128px) - for lists
  - medium (200px) - for modals
  - large (300px) - for detail/print

#### Scenario: High contrast

- Given QR code renders
- When displayed
- Then it SHALL have:
  - Dark modules on white background
  - Adequate quiet zone (margin)
  - Clear foreground/background contrast

#### Scenario: Download action

- Given QRCodeDisplay with download enabled
- When "Download" is clicked
- Then PNG image SHALL be downloaded

#### Scenario: Print action

- Given QRCodeDisplay with print enabled
- When "Print" is clicked
- Then browser print dialog SHALL open
- And print-optimized layout SHALL be used

---

### Requirement: SessionDetail Component

The component SHALL display full session information.

#### Scenario: Session header

- Given a session
- When SessionDetail renders
- Then it SHALL show:
  - Session ID
  - Status badge (large)
  - Expiry countdown (if pending)

#### Scenario: Amount section

- Given a session
- When SessionDetail renders
- Then it SHALL show:
  - Base amount
  - Customer fee
  - Merchant fee
  - Total customer pays
  - Merchant receives

#### Scenario: Metadata section

- Given a session
- When SessionDetail renders
- Then it SHALL show:
  - Reference (if set)
  - Created timestamp
  - Expires timestamp
  - Token symbol

#### Scenario: QR section for pending

- Given a pending session
- When SessionDetail renders
- Then large QR code SHALL display
- And copy/download/print actions SHALL be available

#### Scenario: Payment info for fulfilled

- Given a fulfilled session
- When SessionDetail renders
- Then it SHALL show:
  - Payer address (with copy)
  - Transaction hash (with explorer link)
  - Payment timestamp

#### Scenario: Cancel action for pending

- Given a pending session owned by merchant
- When SessionDetail renders
- Then "Cancel Session" button SHALL display

---

### Requirement: CancelSessionDialog Component

The component SHALL confirm session cancellation.

#### Scenario: Confirmation prompt

- Given cancel action triggered
- When CancelSessionDialog opens
- Then it SHALL display:
  - "Cancel this payment request?"
  - Session amount and reference
  - Warning that this cannot be undone

#### Scenario: Confirm cancellation

- Given the dialog is open
- When "Yes, Cancel" is clicked
- Then cancellation SHALL proceed
- And dialog SHALL close
- And session SHALL update to cancelled

#### Scenario: Cancel the cancel

- Given the dialog is open
- When "Keep Session" is clicked
- Then dialog SHALL close
- And no cancellation SHALL occur

---

### Requirement: HistoryFilters Component

The component SHALL provide filtering for session history.

#### Scenario: Status filter

- Given HistoryFilters renders
- When status dropdown is shown
- Then options SHALL include:
  - All
  - Pending
  - Fulfilled
  - Expired
  - Cancelled

#### Scenario: Date filter

- Given HistoryFilters renders
- When date filter is shown
- Then options SHALL include:
  - Today
  - This Week
  - This Month
  - All Time
  - Custom Range (optional)

#### Scenario: Apply filters

- Given filter selections
- When applied
- Then history list SHALL update
- And URL search params SHALL update

---

### Requirement: SessionTable Component

The component SHALL display sessions in tabular format.

#### Scenario: Table columns

- Given SessionTable renders
- When displayed
- Then columns SHALL include:
  - Reference/ID
  - Amount
  - Status
  - Created
  - Payer (if fulfilled)
  - Actions

#### Scenario: Row click

- Given a table row
- When clicked
- Then navigation to session detail SHALL occur

#### Scenario: Responsive behavior

- Given narrow viewport
- When SessionTable renders
- Then it SHALL adapt to card layout
- Or hide less important columns

#### Scenario: Pagination

- Given more sessions than page size
- When SessionTable renders
- Then pagination controls SHALL display
- And page navigation SHALL work

---

### Requirement: ConnectWalletPrompt Component

The component SHALL prompt wallet connection for merchants.

#### Scenario: Prompt display

- Given no wallet connected
- When ConnectWalletPrompt renders
- Then it SHALL display:
  - "Connect Wallet to Continue"
  - Explanation of merchant features
  - WalletConnectPill component

#### Scenario: Branding

- Given ConnectWalletPrompt renders
- When displayed
- Then mantraUSD-Pay branding SHALL be visible
- And merchant-focused messaging SHALL be used

---

## Component Props

```typescript
interface StatsCardProps {
  label: string;
  value: string | number;
  variant?: 'count' | 'currency' | 'percentage';
  isLoading?: boolean;
}

interface SessionListItemProps {
  session: MerchantSession;
  onViewQR?: () => void;
  onClick?: () => void;
}

interface ActiveSessionsListProps {
  sessions: MerchantSession[];
  isLoading?: boolean;
  onCreateSession?: () => void;
}

interface RecentPaymentsListProps {
  sessions: MerchantSession[];
  isLoading?: boolean;
}

interface CreateSessionFormProps {
  onSuccess: (session: CreatedSession) => void;
  chainId: number;
}

interface SessionCreatedModalProps {
  session: CreatedSession;
  isOpen: boolean;
  onClose: () => void;
  onViewSession: () => void;
  onCreateAnother: () => void;
}

interface QRCodeDisplayProps {
  url: string;
  size?: 'small' | 'medium' | 'large';
  showActions?: boolean;
}

interface SessionDetailProps {
  session: SessionDetail;
  isOwner: boolean;
  onCancel?: () => void;
}

interface CancelSessionDialogProps {
  session: MerchantSession;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface HistoryFiltersProps {
  status: SessionStatus | 'all';
  dateRange: DateRange;
  onStatusChange: (status: SessionStatus | 'all') => void;
  onDateRangeChange: (range: DateRange) => void;
}

interface SessionTableProps {
  sessions: MerchantSession[];
  isLoading?: boolean;
  page: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface ConnectWalletPromptProps {
  returnUrl?: string;
}
```

---

## Styling Guidelines

| Component            | Background | Border | Primary Color |
|----------------------|------------|--------|---------------|
| StatsCard            | white      | subtle | primary       |
| SessionListItem      | white      | bottom | varies (status)|
| ActiveSessionsList   | transparent| none   | primary       |
| CreateSessionForm    | white      | none   | primary       |
| SessionCreatedModal  | white      | none   | success (green)|
| QRCodeDisplay        | white      | subtle | black (QR)    |
| SessionDetail        | white      | none   | varies        |
| CancelSessionDialog  | white      | none   | destructive   |
| HistoryFilters       | transparent| none   | primary       |
| SessionTable         | white      | rows   | primary       |
| ConnectWalletPrompt  | white      | none   | primary       |

All components SHALL follow the OMies design system with:
- Rounded corners (rounded-lg)
- White card backgrounds
- Primary text color (#3B506C)
- Outfit font family
