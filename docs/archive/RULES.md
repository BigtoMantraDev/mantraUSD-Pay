# Development Guidelines

This document defines hard rules for humans, AGENTS, and LLMs working in the MANTRA Achievements project. Treat them as non-negotiable.

---

## Global Rules

- Use `yarn` for all dependency management and scripts.
  - Do not use `npm`, `pnpm`, or `npx` unless the repo already does in that exact place.
- Code must pass ESLint and Prettier with the existing config.
- Do not introduce new libraries if the same problem is already solved in the repo.
- Prefer existing patterns and utilities over inventing new ones.
- Do not change public APIs, shared types, or core hooks unless the task explicitly asks for it.

---

## Rules For AGENTS / LLMS

When generating or editing code:

1. **Read first**
   - Inspect existing examples doing something similar before writing new code.
   - Match existing patterns for:
     - Folder structure
     - Hook names
     - Component patterns
     - Error handling and UX flows

2. **Keep diffs small and targeted**
   - Change only what is required to satisfy the task.
   - Do not refactor unrelated files or code paths.
   - Do not move files unless explicitly asked.

3. **Respect types and contracts**
   - Do not weaken types with `any` or `unknown` unless absolutely required.
   - Do not change existing type shapes, API responses, or shared interfaces without a clear reason in the task.

4. **Follow existing conventions**
   - Match naming conventions:
     - Components: `PascalCase`
     - Hooks: `useCamelCase`
     - Types and enums: `PascalCase`
   - Match existing import ordering and alias usage.

5. **Error handling**
   - Never swallow errors silently.
   - Use existing toast/notification or dialog patterns.
   - For smart contract calls, always use the project’s transaction dialog helpers when they exist.

6. **Comments and TODOs**
   - Do not add TODOs unless they are necessary and specific.
   - Prefer finishing the work rather than leaving TODO markers.
   - If you must add a TODO, format it as `// TODO: [JIRA-123] clear, actionable description`.

7. **No speculative changes**
   - Do not modify environment variables, CI workflows, or infra unless explicitly requested.
   - Do not change build configs (Vite, Next, Webpack, etc.) unless that is the task.

---

## Tooling

- Package manager: `yarn`
- Formatting: Prettier (use the repo config)
- Linting: ESLint (use the repo config)
- TypeScript: strict where configured; do not loosen `tsconfig` options
- Storybook (if present): every reusable presentational component should have stories

---

## Frontend / React Guidelines

- All new React code must use TypeScript:
  - Components: `.tsx`
  - Hooks / utils: `.ts`
- Styling:
  - Use `tailwindcss` utilities for layout and styling.
  - Global styles live in `packages/webapp/src/index.css`.
  - Do not add ad-hoc inline styles except for rare, simple cases.
- UI components:
  - First, look for components in the codebase that already solve your need.
  - For basic primitives, use shadcn UI:
    - Docs: https://ui.shadcn.com/docs/components
    - MCP: you can also use the shadcn tool (MCP) if available.
    - Existing implementations: `packages/webapp/src/shadcn/components`
  - Build complex UI by composing existing shadcn components and local primitives.
- Reference `docs/DESIGN_RULES.md` for detailed design system.
---

## Configuration & Environment

- **Dynamic Configuration**:
  - Do not rely on `VITE_` environment variables for chain-specific values (contract addresses, subgraph URLs, etc.).
  - Use the `useAppConfig` hook to retrieve configuration based on the active chain ID.
  - This supports the multi-chain/environment switching feature of the dApp.
- **Environment Variables**:
  - Use `.env` files only for build-time constants or secrets that do not change between chains (e.g., WalletConnect Project ID).

---

## Container / Component Pattern

Always follow the container/component split unless there is a clear, documented reason not to.

**Container rules**

- Responsibilities:
  - Owns logic, state, data fetching, and side effects.
  - Uses hooks, context, routing, and services.
  - AVOID the use of useEffect if possible, prefer useMemo.
- Props:
  - Props into the container should be minimal.
  - Ideally accept only identifiers, configuration, or static values.
  - All dynamic data is fetched or derived via hooks/context inside the container.
- Composition:
  - Containers can contain other containers to isolate complex logic.
- Size:
  - If a container exceeds ~200 lines:
    - Extract logic into custom hooks in `packages/webapp/src/hooks`.
    - Keep the container mostly as a wiring layer.

**Component (presentational) rules**

- Responsibilities:
  - Pure presentational. Receives data via props.
  - No direct data fetching, no global state, no routing, no side effects.
- Hooks:
  - Do not use hooks like `useQuery`, `useMutation`, `useContext`, `useRouter` inside presentational components.
  - If complex UI needs some internal state (e.g. open/closed), use local `useState` only for that UI concern.
- State modeling:
  - If a component has more than two visual states, avoid multiple boolean flags.
  - Use an enum or discriminated union for mutually exclusive states.
- Responsiveness:
  - Use Tailwind responsive utilities: https://tailwindcss.com/docs/responsive-design
  - Do not add custom media queries unless absolutely necessary and consistent with existing styles.
- Nesting containers:
  - If complex child logic is required, insert a container as a child or slot inside the component.
  - Do not bypass the pattern by dropping hooks directly into the presentational component.
- Size:
  - If a component exceeds ~200 lines:
    - Split into smaller subcomponents.
    - Keep the main component focused on layout/composition.
- Storybook:
  - Every presentational component should have Storybook stories covering:
    - Default state
    - Loading state (if applicable)
    - Error / empty states (if applicable)
    - All key visual variants

---

## State Management / Hooks / Data Fetching

**General**

- Prefer hooks and query libraries over manual `fetch`.
- Keep components dumb: do data shaping in hooks using selectors.
- Avoid multiple booleans to represent state; prefer enums or discriminated unions.

**Indexer Queries**

- Use TanStack Query (`useQuery`) for reading indexed data from TheGraph/Goldsky.
- Use `enabled` and `select` options:
  - `enabled` to control when queries run.
  - `select` to transform data and keep components simple.
- For hooks reusable across screens:
  - Place them in `packages/webapp/src/hooks`.

**Smart Contracts (read)**

- Use wagmi hooks:
  - `useReadContract` or `useReadContracts`.
- Always:
  - Use `enabled` to avoid calling before prerequisites (wallet, chain, address) are ready.
  - Use `select` to map raw on-chain data into domain models.
- Contract addresses should come from config, never hardcoded.

**Global state**

- Use `jotai` for global state, following the existing patterns.
- Keep atoms small and focused, not large god-objects.
- Prefer derived atoms over storing duplicated computed state.

**Hooks organization**

- Hooks used in more than one location:
  - Place in `packages/webapp/src/hooks`.
- Hooks that exceed ~200 lines:
  - Split into smaller custom hooks (e.g. `useFooData`, `useFooActions`).

---

## Mutations & Side Effects

**Smart Contract write mutations**

- Use wagmi write hooks:
  - `useWriteContract` and `writeContractAsync` for async/await syntax.
- Transaction UX:
  - Use `useAwaitingTransactionDialog` and `useTransactionDialog` for consistent states.
  - Always show loading state while transaction is pending.
  - Use `useWaitForTransactionReceipt` to track confirmation before marking success.
- On success:
  - Show success state with transaction hash.
  - Invalidate queries or update global state for any data affected by the transaction.
- Handle errors gracefully:
  - User rejection (don't show as error)
  - Insufficient funds
  - Gas estimation failures
  - Network errors

---

## Error Handling & UX

- Never ignore caught errors:
  - Log them in a consistent way if needed (Sentry, console in dev only).
  - Show a clear message to the user using the project’s standard component (toast, dialog, inline error).
- Loading states:
  - Always show a loading state for data fetching (skeletons, spinners, or placeholders).
- Empty states:
  - Components that render lists should handle:
    - Loading
    - Empty
    - Error
    - Populated
- Do not leak internal error messages directly from the backend to users. Map to friendly messages where appropriate.

---

## File & Naming Conventions

- Components:
  - `ComponentName.tsx` in a directory matching its feature or app.
- Hooks:
  - `useSomething.ts` in `hooks` directories.
- Types:
  - Shared types in `types` or `models` folders, using `PascalCase`.
- Tests:
  - Co-locate with the file or follow the existing pattern (e.g. `ComponentName.test.tsx`).
- Exports:
  - Prefer named exports for most modules.
  - Default exports only where the rest of the codebase already uses them (e.g. pages).

---

## Testing

- For new logic:
  - Add unit tests for hooks and pure functions.
- For complex components:
  - Add tests that cover:
    - Branching UI states
    - Critical user interactions
- Do not break existing tests. If you must change them, update them in line with real behavior changes, not to silence failures.

---

## Git & Repo Hygiene

- Keep commits small and focused.
- Write meaningful commit messages:
  - `feat:`, `fix:`, `chore:`, `refactor:`, etc. if the repo uses that style.
- Do not commit:
  - Local environment files
  - Editor-specific config outside what is already in the repo
  - Generated artifacts that are meant to be in `.gitignore`

---

## Documentation

- For new hooks and complex components:
  - Add a short comment at the top describing intent and usage.
- Keep comments factual:
  - Explain "why," not "what the code does."
- Update any README or openspec feature docs if your change alters behavior users rely on.
- Organize docs in the `/docs` folder when appropriate, do not scatter docs around the repo.

---

## Solidity / Smart Contract Guidelines

### Foundry Workflow

- All contract development uses Foundry (Forge).
- Commands:
  - `forge build` - Compile contracts
  - `forge test` - Run tests
  - `forge test -vvv` - Verbose test output
  - `forge fmt` - Format Solidity code
- Never use Hardhat, Truffle, or other tools unless explicitly migrating.

### Contract Structure

- All contracts live in `packages/contracts/src/`.
- Tests live in `packages/contracts/test/` with `.t.sol` suffix.
- Scripts live in `packages/contracts/script/` with `.s.sol` suffix.
- Follow Solidity style guide: https://docs.soliditylang.org/en/latest/style-guide.html

### Security Best Practices

- **Access Control:**
  - Use OpenZeppelin's `Ownable` or `AccessControl` for role-based permissions.
  - Never use `tx.origin` for authentication, always use `msg.sender`.
  - Validate all external inputs.
- **Reentrancy:**
  - Follow checks-effects-interactions pattern.
  - Use OpenZeppelin's `ReentrancyGuard` when needed.
- **Integer Safety:**
  - Solidity 0.8+ has built-in overflow protection.
  - Be explicit about unchecked blocks when intentional.
- **Gas Optimization:**
  - Use `uint256` over smaller uints unless packing is beneficial.
  - Cache storage variables in memory when used multiple times.
  - Prefer `calldata` over `memory` for external function parameters.

### Testing Requirements

- Every public/external function must have tests covering:
  - Happy path
  - Access control (unauthorized calls should revert)
  - Edge cases (zero addresses, empty values, max values)
  - Revert conditions with proper error messages
- Use descriptive test names: `test_FunctionName_Condition_ExpectedOutcome`
- Use Foundry cheatcodes for testing:
  - `vm.prank(address)` - Set msg.sender
  - `vm.expectRevert()` - Expect transaction to revert
  - `vm.expectEmit()` - Verify events

### Events & Errors

- Emit events for all state changes.
- Use custom errors (Solidity 0.8.4+) instead of revert strings for gas efficiency:
  ```solidity
  error Unauthorized();
  error InvalidParameter(string param);
  ```
- Event naming: `PascalCase` matching the action (e.g., `AchievementMinted`, `CuratorAdded`).

### Code Quality

- Use NatSpec comments for all public/external functions:
  ```solidity
  /// @notice Mints a new achievement NFT
  /// @param recipient The address receiving the NFT
  /// @param metadata The achievement metadata
  /// @return tokenId The ID of the minted token
  ```
- Keep functions small and focused.
- Avoid deep inheritance chains.
- Use interfaces for contract interactions.

### Deployment & Configuration

- Chain configurations live in `packages/contracts/config/chains.toml`.
- Never hardcode addresses or chain IDs in contracts.
- Use constructor parameters or initializers for configuration.
- Document deployment process in the contracts README.

### Contract Upgrades

- This project uses **non-upgradeable contracts** for immutability and security.
- If upgrade patterns are introduced, use OpenZeppelin's UUPS or Transparent Proxy.
- Document upgrade process clearly if implemented.

---