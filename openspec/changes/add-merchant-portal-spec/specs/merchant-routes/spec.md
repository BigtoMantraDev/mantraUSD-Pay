# Spec: Merchant Routes

> Route structure and navigation for the merchant portal.

## Overview

The merchant portal uses TanStack Router with file-based routing. All routes require wallet connection to identify the merchant.

## Dependencies

- TanStack Router
- Wagmi for wallet connection
- Backend API for session management

---

## ADDED Requirements

### Requirement: Dashboard Route

The merchant portal SHALL provide a dashboard at the root route `/`.

#### Scenario: Render dashboard when connected

- Given a merchant with connected wallet
- When they navigate to `/`
- Then the Dashboard page SHALL render
- And stats cards SHALL display
- And active sessions list SHALL display
- And recent payments list SHALL display

#### Scenario: Redirect to connect when not connected

- Given a user without connected wallet
- When they navigate to `/`
- Then they SHALL be redirected to wallet connect prompt
- And the intended destination SHALL be preserved

#### Scenario: Dashboard stats loading

- Given a connected merchant
- When the dashboard is loading
- Then skeleton placeholders SHALL display for stats
- And loading indicators SHALL show for lists

---

### Requirement: Create Session Route

The merchant portal SHALL provide a session creation page at `/create`.

#### Scenario: Render create form when connected

- Given a merchant with connected wallet
- When they navigate to `/create`
- Then the CreateSessionForm SHALL render
- And all required fields SHALL be accessible

#### Scenario: Successful session creation

- Given a completed session form
- When the merchant submits
- Then the session SHALL be created via API
- And the SessionCreatedModal SHALL display
- And the QR code SHALL be visible

#### Scenario: Navigate to session detail after creation

- Given a successfully created session
- When the merchant clicks "View Session"
- Then they SHALL navigate to `/sessions/:sessionId`

#### Scenario: Create another session

- Given a successfully created session
- When the merchant clicks "Create Another"
- Then the form SHALL reset
- And the modal SHALL close

---

### Requirement: Session Detail Route

The merchant portal SHALL provide session details at `/sessions/:sessionId`.

#### Scenario: Render session detail for owned session

- Given a merchant viewing their own session
- When they navigate to `/sessions/:sessionId`
- Then session details SHALL display
- And QR code SHALL display prominently
- And status badge SHALL reflect current state

#### Scenario: Session not found

- Given an invalid sessionId
- When the merchant navigates to `/sessions/:invalid`
- Then a "Session Not Found" error SHALL display
- And a link to dashboard SHALL be provided

#### Scenario: Session not owned by merchant

- Given a sessionId belonging to another merchant
- When the merchant navigates to that session
- Then an "Access Denied" error SHALL display
- And session details SHALL NOT be shown

#### Scenario: Real-time status updates

- Given a pending session being viewed
- When the session status changes (fulfilled/expired)
- Then the UI SHALL update automatically
- And the status badge SHALL reflect the new state

---

### Requirement: History Route

The merchant portal SHALL provide payment history at `/history`.

#### Scenario: Render history with sessions

- Given a merchant with past sessions
- When they navigate to `/history`
- Then a table of sessions SHALL display
- And sessions SHALL be sorted by date (newest first)

#### Scenario: Empty history

- Given a merchant with no sessions
- When they navigate to `/history`
- Then an empty state SHALL display
- And a call-to-action to create session SHALL show

#### Scenario: Filter by status

- Given history page with sessions
- When the merchant selects a status filter
- Then only sessions with that status SHALL display

#### Scenario: Pagination

- Given more sessions than page size (e.g., > 20)
- When the history loads
- Then pagination controls SHALL display
- And navigating pages SHALL load appropriate sessions

---

### Requirement: Route Authentication

All merchant portal routes SHALL require wallet connection.

#### Scenario: Protected route access without wallet

- Given any route in the merchant portal
- When accessed without wallet connection
- Then the user SHALL be redirected to connect prompt

#### Scenario: Wallet disconnect during session

- Given a merchant using the portal
- When their wallet disconnects
- Then they SHALL be redirected to connect prompt
- And appropriate messaging SHALL explain the disconnect

#### Scenario: Preserve navigation intent

- Given a user trying to access `/sessions/abc123`
- When redirected to connect wallet
- And they successfully connect
- Then they SHALL be redirected to `/sessions/abc123`

---

### Requirement: Navigation

The merchant portal SHALL provide consistent navigation.

#### Scenario: Navbar links

- Given any page in the merchant portal
- When viewing the navbar
- Then links to Dashboard, Create, and History SHALL be visible
- And the current route SHALL be highlighted

#### Scenario: Quick create action

- Given the dashboard
- When the merchant clicks "New Payment" button
- Then they SHALL navigate to `/create`

#### Scenario: Back navigation from detail

- Given the session detail page
- When the merchant clicks back
- Then they SHALL navigate to the previous page
- Or to dashboard if no history

---

## Route Configuration

```typescript
// routes/__root.tsx
export const Route = createRootRoute({
  component: RootLayout,
  beforeLoad: ({ context }) => {
    // Wallet connection check
  },
});

// routes/index.tsx
export const Route = createFileRoute('/')({
  component: Dashboard,
});

// routes/create.tsx
export const Route = createFileRoute('/create')({
  component: CreateSession,
});

// routes/sessions/$sessionId.tsx
export const Route = createFileRoute('/sessions/$sessionId')({
  component: SessionDetail,
  loader: ({ params }) => loadSession(params.sessionId),
});

// routes/history.tsx
export const Route = createFileRoute('/history')({
  component: History,
  validateSearch: (search) => ({
    status: search.status || 'all',
    page: search.page || 1,
  }),
});
```
