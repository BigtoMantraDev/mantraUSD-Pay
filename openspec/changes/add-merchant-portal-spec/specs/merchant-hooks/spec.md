# Spec: Merchant Hooks

> React hooks for session creation, listing, and management.

## Overview

Merchant hooks encapsulate API calls and state management for merchant portal functionality.

## Dependencies

- React 19
- TanStack Query for data fetching
- Backend API
- Wagmi for wallet address

---

## ADDED Requirements

### Requirement: useCreateSession Hook

The hook SHALL create payment sessions via the backend API.

#### Scenario: Create session with valid data

- Given a connected merchant wallet
- And valid session parameters (amount, duration)
- When createSession() is called
- Then POST /sessions SHALL be called
- And the created session SHALL be returned

#### Scenario: Include merchant address

- Given a connected wallet with address 0xABC
- When createSession() is called
- Then merchantAddress SHALL be set to 0xABC
- And the backend SHALL validate this matches the caller

#### Scenario: Session creation request body

- Given session parameters
- When createSession() is called
- Then the request SHALL include:
  - merchantAddress: connected wallet address
  - amount: string (e.g., "50.00")
  - reference: string (optional)
  - duration: number (seconds)
  - chainId: number

#### Scenario: Successful creation response

- Given a successful API call
- When the response is received
- Then the hook SHALL return:
  - sessionId: string
  - paymentUrl: string
  - amount, fees, expiry details

#### Scenario: Handle creation error

- Given an API error (validation, rate limit)
- When the response is received
- Then the hook SHALL return:
  - isError: true
  - error: { code, message }

#### Scenario: Loading state during creation

- Given a pending API call
- When createSession() is in progress
- Then isLoading SHALL be true
- And isLoading SHALL be false when complete

---

### Requirement: useMerchantSessions Hook

The hook SHALL list sessions for the connected merchant.

#### Scenario: Fetch sessions for merchant

- Given a connected merchant with address 0xABC
- When useMerchantSessions() is called
- Then GET /sessions/merchant/0xABC SHALL be requested
- And the session list SHALL be returned

#### Scenario: Session list data structure

- Given a successful fetch
- When data is returned
- Then each session SHALL include:
  - sessionId: string
  - amount: string
  - customerFee: string
  - merchantFee: string
  - status: "pending" | "fulfilled" | "expired" | "cancelled"
  - reference: string | null
  - createdAt: Date
  - expiresAt: Date
  - payer: address | null (if fulfilled)
  - txHash: string | null (if fulfilled)

#### Scenario: Pagination support

- Given more sessions than limit
- When options { limit, offset } are provided
- Then only the requested page SHALL be returned
- And total count SHALL be included

#### Scenario: Status filtering

- Given options { status: "fulfilled" }
- When useMerchantSessions() is called
- Then only fulfilled sessions SHALL be returned

#### Scenario: Automatic polling

- Given options { pollInterval: 5000 }
- When useMerchantSessions() is active
- Then sessions SHALL be refetched every 5 seconds

#### Scenario: Disable polling

- Given options { pollInterval: 0 } or { enabled: false }
- When useMerchantSessions() is called
- Then no automatic polling SHALL occur

#### Scenario: Empty sessions

- Given a merchant with no sessions
- When useMerchantSessions() returns
- Then data SHALL be an empty array
- And isSuccess SHALL be true

---

### Requirement: useSessionStats Hook

The hook SHALL calculate dashboard statistics from sessions.

#### Scenario: Calculate today's payment count

- Given sessions data
- When useSessionStats() computes
- Then todayPaymentsCount SHALL equal count of fulfilled sessions created today

#### Scenario: Calculate today's volume

- Given sessions data with fulfilled sessions
- When useSessionStats() computes
- Then todayVolume SHALL equal sum of amounts from today's fulfilled sessions

#### Scenario: Calculate active sessions count

- Given sessions data
- When useSessionStats() computes
- Then activeSessionsCount SHALL equal count of pending sessions not expired

#### Scenario: Stats update on session change

- Given polling is active
- When a session status changes
- Then stats SHALL recalculate automatically

#### Scenario: Zero stats for new merchant

- Given a merchant with no sessions
- When useSessionStats() returns
- Then all counts/volumes SHALL be 0

---

### Requirement: useCancelSession Hook

The hook SHALL cancel pending sessions.

#### Scenario: Cancel pending session

- Given a pending session owned by merchant
- When cancelSession(sessionId) is called
- Then DELETE /sessions/:sessionId SHALL be called
- And success SHALL be returned

#### Scenario: Cannot cancel fulfilled session

- Given a fulfilled session
- When cancelSession() is called
- Then error "Session already fulfilled" SHALL be returned
- And no API call SHALL be made (or backend rejects)

#### Scenario: Cannot cancel other merchant's session

- Given a session owned by another merchant
- When cancelSession() is called
- Then error "Not authorized" SHALL be returned

#### Scenario: Refetch sessions after cancel

- Given a successful cancellation
- When the cancel completes
- Then useMerchantSessions SHALL refetch
- And the cancelled session SHALL have status "cancelled"

#### Scenario: Confirmation before cancel

- Given the hook is used
- When cancelSession() is about to be called
- Then the component SHOULD show a confirmation dialog
- Note: This is UI behavior, not hook behavior

---

### Requirement: useSession Hook

The hook SHALL fetch a single session by ID.

#### Scenario: Fetch session detail

- Given a valid sessionId
- When useSession(sessionId) is called
- Then GET /sessions/:sessionId SHALL be requested
- And full session details SHALL be returned

#### Scenario: Session not found

- Given an invalid sessionId
- When useSession() is called
- Then error "Session not found" SHALL be returned
- And data SHALL be undefined

#### Scenario: Verify merchant ownership

- Given a session owned by different merchant
- When useSession() returns
- Then isOwner SHALL be false
- And component can restrict access accordingly

#### Scenario: Real-time polling for detail

- Given an active session view
- When useSession() is called with poll enabled
- Then session status SHALL update when changed

---

## Hook Interfaces

```typescript
interface UseCreateSessionResult {
  createSession: (params: CreateSessionParams) => Promise<void>;
  data: CreatedSession | undefined;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: ApiError | null;
  reset: () => void;
}

interface CreateSessionParams {
  amount: string;
  reference?: string;
  duration: number;
}

interface UseMerchantSessionsResult {
  data: MerchantSession[];
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  total: number;
  refetch: () => Promise<void>;
}

interface UseMerchantSessionsOptions {
  limit?: number;
  offset?: number;
  status?: SessionStatus | 'all';
  pollInterval?: number;
  enabled?: boolean;
}

interface UseSessionStatsResult {
  todayPaymentsCount: number;
  todayVolume: string;
  activeSessionsCount: number;
  isLoading: boolean;
}

interface UseCancelSessionResult {
  cancelSession: (sessionId: string) => Promise<void>;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: ApiError | null;
}

interface UseSessionResult {
  data: SessionDetail | undefined;
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  isOwner: boolean;
  refetch: () => Promise<void>;
}
```

---

## Error Codes

| Code                | Hook                 | Description                      |
|---------------------|----------------------|----------------------------------|
| SESSION_NOT_FOUND   | useSession           | Session ID does not exist        |
| NOT_AUTHORIZED      | useSession, useCancel| Session belongs to other merchant|
| VALIDATION_ERROR    | useCreateSession     | Invalid parameters               |
| SESSION_EXPIRED     | useCancelSession     | Cannot cancel expired session    |
| SESSION_FULFILLED   | useCancelSession     | Cannot cancel fulfilled session  |
| RATE_LIMITED        | useCreateSession     | Too many requests                |
| NETWORK_ERROR       | All                  | API request failed               |
