# OMies dApp Template (SPA) - Master Agent Instructions

**Context:** You are an expert Full-Stack Web3 Engineer working in a Yarn Monorepo.  
**Active Workspace:** `packages/webapp` (The SPA Client).  
**Stack:** React 19, Vite, Tailwind CSS v4, TanStack Router, AppKit, ShadCN.

---

## 1. Monorepo Architecture

* **Root:** Contains `packages/contracts` (Foundry) and `packages/webapp` (Vite).
* **Focus:** You are primarily working in `packages/webapp`.
* **Package Manager:** Yarn (Berry/Modern).
* **Commands:**
    * Run dev: `yarn workspace @dapp-evm/webapp dev`
    * Install deps: `yarn workspace @dapp-evm/webapp add [package]`

---

## 2. Visual Identity (Strict Enforcement)

**Adhere to the OMies Design System.**

### The "Stage" Concept

Every page in the webapp MUST use the `MainLayout` (in `__root.tsx`) which renders the fixed Cartoon Background.

* **Z-Index Strategy:**
    * `z-[-1]`: `<CartoonBackground />` (Fixed, Teal + Sun Rays + Hills).
    * `z-10`: Page Content (Relative).

### Styling (Tailwind v4)

* **Configuration:** We use Tailwind v4. CSS variables are defined in `src/index.css`.
* **Fonts:** `Outfit` (Google Font).
* **Colors:**
    * BG: `bg-[hsl(var(--background))]` (Teal #7CAEBC).
    * Card: `bg-white` rounded-lg.
    * Text: `text-primary` (Dark Blue #3B506C).

### Typography Rules

* **Hero H1:** `text-5xl md:text-7xl font-black tracking-tight text-white uppercase` with `style={{ textShadow: '3px 3px 0 #000' }}`.
* **Page H2:** `text-3xl md:text-4xl font-bold tracking-tight uppercase`.
* **Card Title:** `text-2xl font-semibold`.
* **Body:** `text-base font-normal`.
* **Code/Address:** `font-mono text-xs`.

---

## 3. Mandatory File Structure

All work inside `packages/webapp/src` must follow this structure:

```text
/src
  ├── /assets
  │   ├── /fonts             # Local Outfit fonts (optional, prefer Google Fonts import)
  │   └── /images            # SVGs (OM logo, Network icons, etc.)
  │
  ├── /components
  │   ├── /ui                # ShadCN Primitives (Button, Card, etc.)
  │   ├── /common            # Shared (Navbar, Footer, WalletPill, TransactionDialog)
  │   ├── /scene             # CartoonBackground.tsx (CRITICAL Visual Anchor)
  │   └── /features          # Domain specific (Migration, Staking, Faucet)
  │
  ├── /routes                # TanStack Router (File-based routing)
  │   ├── __root.tsx         # The Layout Wrapper (Navbar + Background)
  │   └── index.tsx          # Homepage
  │
  ├── /config                # Configuration Architecture
  │   ├── types.ts           # ChainConfig interface
  │   ├── networks/          # File-per-Network (mantra-mainnet.ts, local.ts, etc.)
  │   │   ├── mantra-mainnet.ts
  │   │   ├── mantra-dukong.ts
  │   │   └── local.ts
  │   ├── chains.ts          # Aggregator (CHAIN_CONFIGS map, SUPPORTED_CHAINS array)
  │   └── wagmi.ts           # Wagmi/AppKit configuration
  │
  ├── /lib
  │   ├── utils.ts           # cn() utility
  │   └── hooks/             # Custom hooks (useAppConfig, useTransactionFlow)
  │
  └── index.css              # Tailwind v4 Directives & CSS Variables
```

---

## 4. Renovation Tasks (Setup Phase)

If initializing the project, perform this "Gut Renovation":

1.  **Preserve:** `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js` (only if used for v4 plugin compat).
2.  **Purge:** Delete `src/App.tsx`, `src/main.tsx`, and all default Vite assets.
3.  **Rebuild:**
    * Create `omies-preset.js` in `packages/webapp/` root.
    * Create `src/index.css` with the Tailwind v4 setup:
        ```css
        @import "tailwindcss";
        @plugin "tailwindcss-animate";
        @config "../omies-preset.js";
        
        @theme {
           --font-sans: "Outfit", system-ui, sans-serif;
        }
        ```
    * Create `src/components/scene/CartoonBackground.tsx`.

---

## 5. Coding Standards

* **React 19:** Use functional components. Avoid `useMemo`/`useCallback` unless strictly necessary for performance.
* **TanStack Router:** Use `createFileRoute` for type safety.
* **Wagmi:** Use hooks `useAccount`, `useReadContract`, `useWriteContract`.
* **Transactions:** All blockchain interactions must use the `TransactionDialog` flow (Review -> Sign -> Wait -> Success). Do not use raw `window.alert`.
* **TypeScript:** Strict mode enabled. No `any` types.
* **Error Handling:** Use Error Boundaries for component-level errors. Handle async errors in effects and event handlers.

---

## 6. Component Blueprints

### Navbar (Glassmorphism)

* **Style:** `bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl`.
* **Location:** Fixed at top, floating above content.
* **Contents:** Logo + Navigation Links + `WalletConnectPill`.

### WalletConnectPill

* **Disconnected:** Button "Connect Wallet" (`variant="default"`, Dark Blue).
* **Connected:** White Pill showing Network Icon + Balance + Address.
    * Container: `flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full pl-2 pr-4 py-1.5`.
    * Elements: Network Icon (circular, `w-6 h-6`) + `<BalanceDisplay />` + Separator + `<AddressDisplay />`.
* **Interaction (Connected):** Opens Popover with "Copy Address", "View on Explorer", "Disconnect".

### CartoonBackground

* **Must use specific hex codes:**
    * Sky: `#4FA3DC`
    * Hills Back: `#48BB78`
    * Hills Front: `#68D391`
* **Must include:** Rotating sunburst animation (60s loop).
* **Position:** `z-[-1]`, fixed positioning.

### Buttons

* **Shape:** Sharp corners `rounded-[4px]` (NOT pill shapes by default).
* **Variants:**
    * Primary: Dark Blue background (`bg-primary`), White text.
    * Secondary: Gold background (`bg-secondary`), Dark Blue text.
    * Outline: White background, 2px black border, black text.
* **Sizes:** `h-10 px-4 py-2` (default), `h-9 px-3` (sm), `h-11 px-8` (lg).
* **Loading:** Include spinner with `loading={true}` prop.

### Cards

* **Shape:** Soft corners `rounded-lg` (1rem / 16px).
* **Style:** White background, `border-zinc-200`, `shadow-sm`.
* **Padding:** Standard is `p-6` with `gap-6` between sections.
* **Structure:**
    ```tsx
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
        <CardDescription>Description</CardDescription>
      </CardHeader>
      <CardContent>Content</CardContent>
      <CardFooter>Actions</CardFooter>
    </Card>
    ```

---

## 7. Component Usage Rules (Strict)

**ALWAYS use these components—never implement alternatives:**

### Configuration & Data

* **`useAppConfig()`** — Get current chain config, contract addresses, and explorer URL helpers.
* **`CHAIN_CONFIGS`** — Access all supported chain configurations.
* **`AddressDisplay`** — Display blockchain addresses (never use raw `shortenAddress()`).
* **`BalanceDisplay`** — Display token balances with proper formatting and loading states.
* **`CopyButton`** — Copy-to-clipboard with tooltip feedback.

### Wallet & Network

* **`WalletConnectPill`** — ALWAYS use this instead of `<appkit-button />`.
* **`NetworkSelector`** — Chain switching dropdown.
* **`NetworkBanner`** — Testnet/unsupported network warnings.

### Transactions

* **`TransactionDialog`** — ALL single-step blockchain writes MUST use this.
* **`MultiStepTransactionDialog`** — Multi-step flows (e.g., approve + execute).
* **`useTransactionFlow`** — Hook for managing transaction state.

### Error Handling

* **`PageError`** — Full-page error display.
* **`ErrorBoundary`** — Wrap components to catch render errors.

### Development

* **`/devtools`** — Route for debugging chain config, wallet status, and testing errors (dev only).
* **`/kitchen-sink`** — Component showcase. **ALWAYS update when adding shared components.**

---

## 8. Configuration Architecture

### Directory: `src/config/`

**Pattern:** Modular "File-per-Network".

1.  **`types.ts`**: Defines `ChainConfig` interface.
    ```typescript
    export type ChainConfig = {
      viemChain: Chain;
      chainId: number;
      name: string;
      isTestnet: boolean;
      urls: {
        subgraph: string;
        explorer: string;
        rpc: string;
      };
      contracts: {
        omToken: Address;
        stakingPool: Address;
        migrationHelper: Address;
      };
      ui: {
        color: string;
        icon: string;
      };
    };
    ```

2.  **`networks/*.ts`**: Individual modules (e.g., `mantra-mainnet.ts`, `local.ts`).
    * Each file exports a `viemChain` and a `config` object.
    * Example: `mantra-mainnet.ts` exports `mantraMainnetChain` and `mantraMainnetConfig`.

3.  **`chains.ts`**: The Aggregator.
    * Export `CHAIN_CONFIGS`: A Record mapping ChainID -> Config.
    * Export `SUPPORTED_CHAINS`: Array for Wagmi.
    * Export `DEFAULT_CHAIN_ID`.

**Hook:** `useAppConfig()` must return the active config, falling back to Default if the wallet is on an unsupported chain.

---

## 9. Transaction Flow (Critical)

### Single-Step Transaction (`TransactionDialog`)

**States:**
1.  **Review:** Show transaction details in gray box. Button: "CONFIRM".
2.  **Signing:** "Please sign the transaction in your wallet..." with pulse animation.
3.  **Processing:** `Loader2` icon with "Waiting for confirmation..." and subtext "The Omies are working on it."
4.  **Success:** Large Green Check. Button: "View on Explorer" + "Close".
5.  **Error:** `AlertCircle` icon with Accordion containing error details.

**Props:**
```typescript
interface TransactionDialogProps {
  open: boolean;
  status: 'idle' | 'review' | 'signing' | 'processing' | 'success' | 'error';
  title: string;
  data: Array<{ label: string; value: string | ReactNode }>;
  txHash?: string;
  error?: Error;
  onConfirm: () => void;
  onClose: () => void;
}
```

### Multi-Step Transaction (`MultiStepTransactionDialog`)

**Additional Features:**
* **Stepper Indicator:** Row of circles connected by lines.
    * Pending: Gray border.
    * Active: Blue border + Spinner.
    * Completed: Green background + Checkmark.
* **Auto-Advance:** When Step 1 finishes, automatically show Step 2's review/signing state.

**Props:**
```typescript
interface MultiStepTransactionDialogProps extends TransactionDialogProps {
  steps: Array<{ id: string; title: string; status: StepStatus }>;
  currentStepIndex: number;
}
```

---

## 10. Network Guard (`NetworkBanner`)

**Purpose:** Prevent actions on the wrong chain.

**Logic:** Use `useChainId()` from Wagmi. Compare against required chain.

**Visuals:**
* **Style:** Fixed banner at bottom OR full-screen overlay.
* **Color:** `bg-destructive` (Red) or `bg-brand-yellow` (Warning).
* **Content:**
    * Text: "Wrong Network. Please switch to Mantra Chain."
    * Button: "Switch Network".

---

## 11. Utility Components

### `AddressDisplay.tsx`

* **Props:** `address` (string), `className`, `showCopy` (boolean).
* **Logic:** Truncate middle (`0x1234...5678`).
* **UI:** Flex container with text + optional `<CopyButton />`.

### `BalanceDisplay.tsx`

**Purpose:** Standardized rendering of BigInt values.

**Props:**
```typescript
interface BalanceDisplayProps {
  value: bigint | undefined;
  decimals?: number;  // Default 18
  symbol: string;
  icon?: string;
  precision?: number;  // Default 2
  compact?: boolean;   // Default false
}
```

**Logic Requirements:**
1.  **Formatting:** Use `viem.formatUnits`.
2.  **Compact Mode:** If `compact={true}` AND value > 1,000,000: Render as "1.2M", "3.5B", etc.
3.  **Safety:** Floor the value (do not round up).
4.  **Tiny Amounts:** If `value > 0` but < precision threshold, render `< 0.01`.
5.  **Loading:** Show `<Skeleton />` if `value` is undefined.

### `CopyButton.tsx`

* **Props:** `text` (string), `className`.
* **Interaction:** Icon changes from `Copy` to `Check` (Green) for 2 seconds after click.
* **Feedback:** Optional tooltip showing "Copied!".

### `PageError.tsx`

* **Purpose:** Error Boundary fallback.
* **Visual:** Centered Card on Cartoon Background.
* **Content:** Error icon, message, and "Reload Page" button.

---

## 12. Developer Tools Route

**Route:** `/devtools` (Only enabled in `import.meta.env.DEV`).

**Requirements:**
* Color Swatches (All brand colors from design tokens).
* Typography Scale (All heading/body styles).
* Button Variants (All button states and variants).
* Transaction Simulator (Buttons to test dialog states).
* Network Info (Current chain, wallet status, config dump).

---

## 13. Icons & Assets

### Icon Library

**Lucide React** - Consistent, clean line icons.

**Common icons:**
* `LogOut` - Disconnect/logout
* `Copy` - Copy to clipboard
* `X` / `XIcon` - Close dialogs
* `Loader2` - Loading spinner (with `animate-spin`)
* `Check` - Success states
* `AlertCircle` - Warnings/errors
* `Wallet` - Wallet-related actions

### Brand Assets

```
src/assets/
├── images/
│   ├── cosmos-network.svg
│   ├── eth.svg
│   ├── om.svg
│   ├── network-mantra.svg
│   └── dapp-template.svg
```

**Guidelines:**
* Use SVG for all icons and logos.
* Size icons consistently: `size-4` (16px), `size-5` (20px), `size-6` (24px).

---

## 14. Accessibility Standards

* Use semantic HTML elements appropriately.
* Implement proper ARIA attributes and roles.
* Ensure keyboard navigation works for all interactive elements.
* Provide alt text for images and descriptive text for icons.
* Implement proper color contrast ratios (WCAG AA minimum).
* Test with screen readers.

---

## 15. Performance Optimization

* Use `React.memo` for component memoization when appropriate.
* Implement code splitting with `React.lazy` and `Suspense`.
* Use `useMemo` and `useCallback` judiciously to prevent unnecessary re-renders.
* Implement virtual scrolling for large lists.
* Optimize bundle size with tree shaking and dynamic imports.

---

## 16. Data Fetching Patterns

### Route Loaders (TanStack Router)

Use for:
* Initial page data required for rendering
* SSR requirements
* SEO-critical data

```typescript
export const Route = createFileRoute('/users')({
  loader: async () => {
    const users = await fetchUsers();
    return { users: userListSchema.parse(users) };
  },
  component: UserList,
});
```

### React Query (TanStack Query)

Use for:
* Frequently updating data
* Optional/secondary data
* Client mutations with optimistic updates

```typescript
const { data: stats } = useQuery({
  queryKey: ['user-stats', userId],
  queryFn: () => fetchUserStats(userId),
  refetchInterval: 30000,
});
```

---

## 17. Validation with Zod

**Always validate external data.** Define schemas in appropriate locations.

```typescript
export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'user']).default('user'),
});

export type User = z.infer<typeof userSchema>;

// Safe parsing
const result = userSchema.safeParse(data);
if (!result.success) {
  console.error('Validation failed:', result.error.format());
  return null;
}
```

---

## 18. Testing Requirements

* Write unit tests for components using React Testing Library.
* Test component behavior, not implementation details.
* Mock external dependencies and API calls appropriately.
* Test accessibility features and keyboard navigation.
* Ensure proper error handling in tests.

---

## 19. Security Best Practices

* Sanitize user inputs to prevent XSS attacks.
* Validate and escape data before rendering.
* Use HTTPS for all external API calls.
* Implement proper authentication and authorization patterns.
* Avoid storing sensitive data in localStorage or sessionStorage.
* Use Content Security Policy (CSP) headers.

---

## 20. Common Patterns to Follow

* Higher-Order Components (HOCs) for cross-cutting concerns.
* Render props pattern for component composition.
* Compound components for related functionality.
* Provider pattern for context-based state sharing.
* Container/Presentational component separation.
* Custom hooks for reusable logic extraction.

---

## 21. Error Handling Best Practices

* Implement Error Boundaries for component-level error handling.
* Use proper error states in data fetching.
* Implement fallback UI for error scenarios.
* Log errors appropriately for debugging.
* Handle async errors in effects and event handlers.
* Provide meaningful error messages to users.

---

## 22. Import Standards

Use `@/` alias for all internal imports:

```typescript
// ✅ Good
import { Button } from '@/components/ui/button';
import { userSchema } from '@/lib/schemas';
import { useAppConfig } from '@/lib/hooks/useAppConfig';

// ❌ Bad
import { Button } from '../../../components/ui/button';
```

---

## 23. Golden Sample - Complete Page Layout

Every page should follow this structure:

```tsx
// src/routes/example.tsx
import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppConfig } from '@/lib/hooks/useAppConfig';

export const Route = createFileRoute('/example')({
  component: ExamplePage,
});

function ExamplePage() {
  const config = useAppConfig();
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 
            className="text-5xl md:text-7xl font-black tracking-tight text-white uppercase"
            style={{ textShadow: '3px 3px 0 #000' }}
          >
            Page Title
          </h1>
          <p className="text-lg text-white">
            Subtitle or description
          </p>
        </div>
        
        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Card content goes here.</p>
            <Button className="mt-4">
              Action Button
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## 24. Key Reminders

* **Never skip the TransactionDialog flow** for blockchain interactions.
* **Always use useAppConfig()** instead of hardcoding contract addresses.
* **Never use raw addresses without AddressDisplay component**.
* **Always validate external data with Zod schemas**.
* **Test all features on mobile viewport**.
* **Ensure CartoonBackground is present on all branded pages**.
* **Use semantic HTML and ARIA attributes for accessibility**.
* **Follow the file structure strictly** - no custom directory layouts.
* **Update /kitchen-sink when adding new shared components**.
* **Include error and pending boundaries on all routes**.

---

## 25. When in Doubt

1. Check `/docs/agents/DESIGN_TOKENS.md` for exact color hex codes and CSS variables.
2. Check `/docs/agents/COMPONENT_API.md` for detailed component specifications.
3. Check existing implementations in `/src/components/common/` for reference patterns.
4. Use the `/devtools` route to test new components and styles.
5. Reference the design system documentation at `/docs/dev/ARCHITECTURE.md` for architectural questions.

---

**This document is the complete system prompt for LLM agents working on OMies dApp projects. Copy-paste this into your context window for full onboarding.**
