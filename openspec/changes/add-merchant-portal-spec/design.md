# Design: Merchant Portal Architecture

## Context

The merchant portal is the business-facing application for mantraUSD-Pay. Merchants use it to create payment requests (sessions), generate QR codes, and track payments.

**Background:**
- Separate webapp from customer payment flow
- Uses same tech stack as customer webapp (React 19, Vite, TanStack Router)
- Shares design system and common components
- Requires wallet connection to identify merchant

**Constraints:**
- Merchant identified by connected wallet address
- All sessions scoped to connected wallet
- Must work on desktop (primary) and tablet
- QR codes must be printable/downloadable

**Stakeholders:**
- Merchants (primary users)
- Backend team (API consumers)
- Operations (may need merchant support tools)

## Goals / Non-Goals

**Goals:**
- Easy session creation with minimal inputs
- Clear QR code display for customer scanning
- Real-time session status updates
- Dashboard overview of business activity
- Session history and filtering

**Non-Goals:**
- Multi-merchant organizations
- Recurring payments / subscriptions
- Inventory management integration
- POS hardware integration (MVP)
- Detailed analytics / reporting

## Decisions

### Decision 1: Separate Package in Monorepo

**What:** Create `packages/merchant-portal` as a separate Vite app

**Why:**
- Different deployment target than customer webapp
- May have different auth requirements in future
- Cleaner separation of concerns
- Can share config and common components via workspace

**Alternatives considered:**
- Same webapp with route guards - More complex, mixed concerns
- Separate repository - Harder to share code

### Decision 2: Wallet-Based Merchant Identity

**What:** Use connected wallet address as merchant identifier

**Why:**
- No separate authentication system needed
- Cryptographic proof of identity
- Consistent with Web3 patterns
- Sessions automatically scoped to wallet

**Trade-offs:**
- No multi-device sessions (must connect wallet each time)
- **Mitigation:** Acceptable for MVP, add account system later if needed

### Decision 3: TanStack Router with File-Based Routes

**What:** Use same routing pattern as customer webapp

**Why:**
- Consistency across packages
- Type-safe routing
- Developer familiarity

**Route Structure:**
```
routes/
├── __root.tsx          # Layout with Navbar + Background
├── index.tsx           # Dashboard (/)
├── create.tsx          # Create session (/create)
├── sessions/
│   └── $sessionId.tsx  # Session detail (/sessions/:id)
└── history.tsx         # Payment history (/history)
```

### Decision 4: Real-Time Polling for Session Status

**What:** Poll backend every 5 seconds for session updates

**Why:**
- Simple implementation
- No WebSocket infrastructure needed
- Dashboard and detail views stay current

**Trade-offs:**
- 5 second delay for status updates
- **Mitigation:** Acceptable UX, add WebSocket for real-time later

### Decision 5: QR Code Generation Client-Side

**What:** Generate QR codes in browser using `qrcode` library

**Why:**
- No backend dependency for QR generation
- Instant display after session creation
- Can customize styling

**QR Content:**
```
https://{webapp-domain}/pay/{sessionId}?chainId={chainId}
```

### Decision 6: Session Form with Sensible Defaults

**What:** Minimal form for session creation

| Field       | Type   | Default       | Validation          |
|-------------|--------|---------------|---------------------|
| Amount      | number | (required)    | > 0, max decimals 6 |
| Reference   | string | (optional)    | max 100 chars       |
| Duration    | select | 15 minutes    | 5min - 24hr options |

**Why:**
- Fast session creation for merchants
- Reference field for internal tracking
- Duration dropdown simpler than custom input

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Merchant Portal                               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Routes Layer                           │   │
│  │                                                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │   │
│  │  │Dashboard │ │  Create  │ │ Session  │ │ History  │    │   │
│  │  │   /      │ │ /create  │ │/:sessionId│ │ /history │    │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘    │   │
│  └───────┼────────────┼────────────┼────────────┼───────────┘   │
│          │            │            │            │                │
│  ┌───────┴────────────┴────────────┴────────────┴───────────┐   │
│  │                    Hooks Layer                            │   │
│  │                                                           │   │
│  │  ┌────────────────┐  ┌────────────────┐                  │   │
│  │  │useCreateSession│  │useMerchantSessions│               │   │
│  │  └────────────────┘  └────────────────┘                  │   │
│  │  ┌────────────────┐  ┌────────────────┐                  │   │
│  │  │useSessionStats │  │useCancelSession│                   │   │
│  │  └────────────────┘  └────────────────┘                  │   │
│  └───────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                    Backend API                            │   │
│  │                                                           │   │
│  │  POST /sessions          GET /sessions/merchant/:address │   │
│  │  GET /sessions/:id       DELETE /sessions/:id            │   │
│  └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
__root.tsx
├── Navbar (with WalletConnectPill)
├── CartoonBackground
└── <Outlet />
    │
    ├── index.tsx (Dashboard)
    │   ├── StatsCards
    │   │   ├── TodayPaymentsCard
    │   │   ├── TodayVolumeCard
    │   │   └── ActiveSessionsCard
    │   ├── ActiveSessionsList
    │   │   └── SessionListItem[]
    │   └── RecentPaymentsList
    │       └── PaymentListItem[]
    │
    ├── create.tsx (Create Session)
    │   ├── CreateSessionForm
    │   │   ├── AmountInput
    │   │   ├── ReferenceInput
    │   │   └── DurationSelect
    │   └── SessionCreatedModal
    │       └── QRCodeDisplay
    │
    ├── sessions/$sessionId.tsx (Session Detail)
    │   ├── SessionHeader (status badge)
    │   ├── QRCodeDisplay (large, printable)
    │   ├── SessionDetails
    │   │   ├── Amount
    │   │   ├── Reference
    │   │   ├── Created/Expires
    │   │   └── PaymentInfo (if fulfilled)
    │   └── SessionActions
    │       └── CancelButton (if pending)
    │
    └── history.tsx (Payment History)
        ├── HistoryFilters
        │   ├── StatusFilter
        │   └── DateFilter
        └── SessionTable
            └── SessionRow[]
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Session Creation Flow                        │
│                                                                  │
│  1. Merchant fills form                                         │
│     └─▶ Amount, reference, duration                             │
│                                                                  │
│  2. Submit to backend                                           │
│     └─▶ POST /sessions { merchantAddress, amount, ... }         │
│                                                                  │
│  3. Backend creates session                                     │
│     └─▶ Returns sessionId, paymentUrl                           │
│                                                                  │
│  4. Generate QR code                                            │
│     └─▶ Encode paymentUrl in QR                                 │
│                                                                  │
│  5. Display to merchant                                         │
│     └─▶ Show QR, copy link option, print option                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     Dashboard Data Flow                          │
│                                                                  │
│  1. On mount + wallet connection                                │
│     └─▶ Fetch sessions for merchant address                     │
│                                                                  │
│  2. Calculate stats                                             │
│     └─▶ Today's payments, volume, active count                  │
│                                                                  │
│  3. Poll for updates                                            │
│     └─▶ Every 5 seconds, refetch sessions                       │
│                                                                  │
│  4. Update UI                                                   │
│     └─▶ Stats cards, session lists refresh                      │
└─────────────────────────────────────────────────────────────────┘
```

## Risks / Trade-offs

### Risk: Wallet Disconnection During Use

**Risk:** Merchant loses session if wallet disconnects
**Mitigation:**
- Clear messaging about wallet requirement
- Graceful handling of disconnection (redirect to connect)
- Session data persists on backend

### Risk: QR Code Usability

**Risk:** QR codes may be hard to scan in various conditions
**Mitigation:**
- High contrast QR with ample quiet zone
- Multiple size options (screen, print)
- Fallback: copyable payment link

### Risk: Session Overload

**Risk:** Merchant creates many sessions, list becomes unwieldy
**Mitigation:**
- Pagination on session lists
- Archive/hide old sessions
- Status filters for quick finding

### Risk: Browser Tab Closed Before QR Displayed

**Risk:** Merchant submits form but loses QR before noting it
**Mitigation:**
- Session saved to backend, can retrieve from history
- Copy to clipboard option
- Consider: save to local storage temporarily

## Open Questions

1. **Q:** Should merchants be able to edit session amounts after creation?
   **A:** No for MVP. Once created, sessions are immutable. Create new session if needed.

2. **Q:** Should we support session templates / presets?
   **A:** Not for MVP. Could add "Recent amounts" quick-select later.

3. **Q:** How to handle multiple pending sessions?
   **A:** Allow unlimited pending sessions. Merchants may have multiple checkout lanes.

4. **Q:** Should history show all time or have date limits?
   **A:** Default to last 30 days, allow date range filter. Backend may limit older data.

5. **Q:** Print functionality for QR codes?
   **A:** Use browser print with print-optimized CSS. No custom print implementation.
