# OMies Family Component Specifications

> **Instruction for Agents:** These components MUST be built in `src/components/common/`. They are the "Lego blocks" for all OMies dApps.

## 1. Wallet Connection (`WalletConnectPill.tsx`)

**Purpose:** A custom UI wrapper around AppKit to match the OMies brand.
**Location:** Inside `Navbar.tsx`.

### Visual States
* **Disconnected:**
    * **Component:** `<Button>` (ShadCN).
    * **Style:** `variant="default"` (Dark Blue), `rounded-[4px]`.
    * **Text:** "CONNECT WALLET".
* **Connected:**
    * **Container:** A "Glass Pill" div: `flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full pl-2 pr-4 py-1.5`.
    * **Elements:**
        1.  **Network Icon:** Circular img/svg (`w-6 h-6`).
        2.  **Balance:** Uses `<BalanceDisplay />` (White text).
        3.  **Separator:** Vertical divider `h-4 w-[1px] bg-white/30`.
        4.  **Address:** Uses `<AddressDisplay />` (White text, truncated).

### Interactions
* **Click (Disconnected):** Calls `useAppKit().open()`.
* **Click (Connected):** Opens a ShadCN `Popover` (Dropdown).
    * **Dropdown Content:**
        * **Header:** "My Account".
        * **Row 1:** Copy Address.
        * **Row 2:** "View on Explorer" (External Link).
        * **Row 3:** "Disconnect" (Red text, calls `disconnect()`).

---

## 2. Single-Step Transaction (`TransactionDialog.tsx`)

**Purpose:** Standard actions (Stake, Claim, Transfer).
**Props:**
* `open`: boolean
* `status`: `'idle' | 'review' | 'signing' | 'processing' | 'success' | 'error'`
* `title`: string (e.g., "Stake OM")
* `data`: Array of `{ label: string, value: string | ReactNode }`.
* `onConfirm`: () => void
* `onClose`: () => void

### State Visuals (Inside a `DialogContent`)
1.  **Review:**
    * **Header:** Title "Review Transaction".
    * **Body:** A gray box listing the `data` key/values.
    * **Footer:** Primary Button "CONFIRM".
2.  **Signing:**
    * **Body:** "Please sign the transaction in your wallet..."
    * **Visual:** Pulse animation.
3.  **Processing:**
    * **Icon:** `Loader2` (Lucide) `animate-spin w-12 h-12 text-primary`.
    * **Text:** "Waiting for confirmation..."
    * **Subtext:** "The Omies are working on it."
4.  **Success:**
    * **Icon:** Large Green Check Circle.
    * **Text:** "Transaction Successful!"
    * **Footer:** Button "View on Explorer" + Button "Close".
5.  **Error:**
    * **Icon:** `AlertCircle` (Lucide) `text-destructive`.
    * **Details:** ShadCN `Accordion` containing the raw error message.

---

## 3. Multi-Step Transaction (`MultiStepTransactionDialog.tsx`)

**Purpose:** Complex flows (e.g., Approve Token -> Deposit Token).
**Props:** Extends `TransactionDialog` but takes an array of steps.
* `steps`: Array of `{ id: string, title: string, status: StepStatus }`.
* `currentStepIndex`: number.

### Visual Difference
* **Header:** Must include a **Stepper Indicator** (Row of circles connected by lines).
    * **Pending:** Gray border.
    * **Active:** Blue border + Spinner.
    * **Completed:** Green background + Checkmark.
* **Auto-Advance:** When Step 1 finishes, it automatically shows the "Review" or "Signing" state for Step 2.

---

## 4. Network Guard (`NetworkBanner.tsx`)

**Purpose:** Prevent actions on the wrong chain.
**Logic:** Use `useChainId()` from Wagmi. Compare against `REQUIRED_CHAIN_ID` (env var).

### Visuals
* **Style:** A fixed banner at the bottom OR a full-screen overlay.
* **Color:** `bg-destructive` (Red) or `bg-brand-yellow` (Warning).
* **Content:**
    * **Text:** "Wrong Network. Please switch to Mantra Chain."
    * **Action:** Button "Switch Network".

---

## 5. Utilities

### `AddressDisplay.tsx`
* **Props:** `address` (string), `className`.
* **Logic:** Truncate middle (`0x1234...5678`).
* **UI:** Flex container with the text + `<CopyButton />`.

### `CopyButton.tsx`
* **Props:** `text` (string).
* **Interaction:** Icon changes from `Copy` to `Check` (Green) for 2 seconds after click.

### `PageError.tsx` (Error Boundary)
* **Purpose:** Fallback when the app crashes.
* **Visual:** Centered Card on Cartoon Background.
* **Action:** Button "Reload Page".

---

## 6. Developer Tools (`DevTools.tsx`)

**Route:** `src/routes/dev/components.tsx` (Only enable in `import.meta.env.DEV`).
**Requirements:** Show Color Swatches, Typography Scale, Button Variants, and Transaction Simulator buttons.

---

## 7. Configuration Architecture

**Directory:** `src/config/`
**Pattern:** Modular "File-per-Network".

1.  **`types.ts`**: Defines `ChainConfig` interface (contracts, urls, ui).
2.  **`networks/*.ts`**: Individual modules (e.g., `mantra-mainnet.ts`, `local.ts`).
3.  **`chains.ts`**: The Aggregator.
    * Export `CHAIN_CONFIGS`: A Record mapping ChainID -> Config.
    * Export `SUPPORTED_CHAINS`: Array for Wagmi.
    * Export `DEFAULT_CHAIN_ID`.

**Hook:** `useAppConfig()` must return the active config, falling back to Default if the wallet is on an unsupported chain.

---

## 8. Network Selector (`NetworkSelector.tsx`)

**UI:** ShadCN `Select` component.
**Style:** Glassmorphism matching the Navbar (`bg-white/10`).
**Logic:** Uses `useSwitchChain`.
**States:**
* **Normal:** Green dot + Network Name.
* **Testnet:** Yellow dot + Network Name.
* **Unsupported:** Red Icon + "Wrong Network".

---

## 9. Balance Display (`BalanceDisplay.tsx`)

**Purpose:** Standardized rendering of BigInt values with optional "compact" notation for large numbers.

**Props:**
* `value`: bigint | undefined.
* `decimals`: number (Default 18).
* `symbol`: string.
* `icon`: string (URL).
* `precision`: number (Default 2).
* `compact`: boolean (Default `false`). If true, shortens 1,200,000 to "1.2M".

**Logic Requirements:**
1.  **Formatting:** Use `viem.formatUnits`.
2.  **Compact Mode:**
    * If `compact={true}` AND value > 1,000,000: Render as "1.2M", "3.5B", etc.
    * Use `Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" })`.
3.  **Safety:** Floor the value (do not round up) when showing full precision.
4.  **Tiny Amounts:** If `value > 0` but < `0.01` (or relevant precision), render `< 0.01`.
5.  **Loading:** Show `<Skeleton />` if `value` is undefined.