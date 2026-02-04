# Change: Add Merchant Portal Specification

## Why

The mantraUSD-Pay system requires a merchant portal for businesses to create payment requests and manage sessions. Based on PRD Section 7.2, the merchant portal provides:

1. **Dashboard** - Overview of payments, volume, and active sessions
2. **Session Creation** - Create payment requests with QR codes
3. **Session Management** - View, track, and cancel sessions
4. **Payment History** - Historical view of all transactions

This proposal documents the merchant portal as a separate webapp in the monorepo.

## What Changes

### New Specifications

| Spec                       | Description                                       |
|----------------------------|---------------------------------------------------|
| `merchant-routes`          | Route structure and navigation                    |
| `merchant-hooks`           | React hooks for session management                |
| `merchant-components`      | UI components for dashboard and session views     |

### Key Features

**Routes:**
- `/` - Dashboard with stats and recent activity
- `/create` - Create new payment request
- `/sessions/:sessionId` - Session detail with QR code
- `/history` - Payment history with filtering

**Hooks:**
- `useCreateSession(chainId)` - Create payment sessions
- `useMerchantSessions(chainId, options)` - List merchant's sessions
- `useSessionStats(chainId)` - Dashboard statistics
- `useCancelSession()` - Cancel pending sessions

**Components:**
- Dashboard stats cards
- Session creation form
- QR code generator and display
- Session list with status badges
- Session detail view

### Non-Breaking Changes

- New package `packages/merchant-portal` in monorepo
- Shares config with webapp via `@mantrausd-pay/config`
- Uses same OMies design system

## Impact

### Affected Code

- `packages/merchant-portal/` - New package
- `packages/merchant-portal/src/routes/` - Route definitions
- `packages/merchant-portal/src/hooks/` - Business logic hooks
- `packages/merchant-portal/src/components/` - UI components

### Dependencies

- Backend API must be available (`add-backend-api` spec)
- Config package for chain/contract configuration (`add-config-package-spec`)
- Shares design system with customer webapp

## Out of Scope

- Customer payment flow (covered in `add-webapp-payment-spec`)
- Multi-merchant account management
- Analytics dashboard
- Webhook notifications
