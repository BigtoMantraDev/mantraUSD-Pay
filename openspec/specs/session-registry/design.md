# Session Registry Design

## Context

The SessionRegistry contract is the payment session management layer of the EIP-7702 gasless payment system. It bridges merchants creating payment requests with customers executing payments through the DelegatedAccount contract.

### Background
- Merchants need to create payment requests as QR codes
- Sessions must track amounts, fees, expiration, and fulfillment status
- The system supports two independent fee types: customer fee (gas-based) and merchant fee (percentage-based)
- Sessions must be time-limited to prevent indefinite liability
- Token transfers must be safe and atomic

### Constraints
- Sessions cannot be modified after creation (immutable)
- Maximum session duration is 24 hours
- Both fee types capped at 5% each
- Only whitelisted tokens can be used
- Must track accumulated fees for withdrawal
- Must prevent double-spending of same session

### Stakeholders
- **Merchants**: Create sessions, receive payments, track history
- **Customers**: Pay sessions through DelegatedAccount
- **Relayers**: Receive customer fees for gas sponsorship
- **Platform**: Collects merchant fees, manages configuration
- **Auditors**: Need clear events and state tracking

## Goals / Non-Goals

### Goals
- Provide immutable payment session creation and tracking
- Support dual fee model (customer + merchant fees)
- Enable independent fee toggles for business flexibility
- Ensure atomic payment execution with fee distribution
- Allow merchant session management (create, cancel)
- Provide comprehensive event emission for off-chain indexing
- Support flexible token whitelist management

### Non-Goals
- Session modification after creation (create new session instead)
- Partial payments or installments
- Refund mechanisms (handle via separate sessions)
- Multi-token payments in single session
- Subscription or recurring payment management
- Payment routing or split payments
- Session templates or pre-configuration

## Decisions

### Decision: Immutable Sessions
**Choice**: Sessions cannot be modified after creation

**Rationale**:
- Simplifies smart contract logic (no update functions)
- Prevents disputes about changed terms
- QR codes remain valid with original terms
- Create new session if terms change

**Alternatives Considered**:
1. **Mutable sessions**: Rejected - complex state management, dispute prone
2. **Amendment system**: Rejected - adds complexity without clear benefit
3. **Versioned sessions**: Rejected - overkill for payment use case

### Decision: Dual Fee Model
**Choice**: Support both customer fee (dynamic, gas-based) and merchant fee (fixed percentage) independently

**Rationale**:
- Customer fee covers relayer gas costs (operational)
- Merchant fee provides platform revenue (business model)
- Independent toggles allow flexible business strategies
- Clear separation of concerns

**Alternatives Considered**:
1. **Single combined fee**: Rejected - less flexibility, harder to explain
2. **Only merchant fee**: Rejected - relayer needs gas cost recovery
3. **Only customer fee**: Rejected - no platform revenue mechanism
4. **Complex tiered fees**: Deferred - start simple, add later if needed

### Decision: Off-Chain Customer Fee Calculation
**Choice**: Backend calculates customer fee based on current gas prices, contract validates bounds

**Rationale**:
- Gas prices fluctuate, can't predict at session creation
- Contract gas price oracles add complexity and cost
- Backend has better access to real-time gas data
- Contract enforces max/min bounds for safety
- Enables dynamic pricing like Uber surge pricing

**Alternatives Considered**:
1. **On-chain oracle**: Rejected - adds dependency, gas cost, complexity
2. **Fixed customer fee**: Rejected - doesn't adapt to gas price changes
3. **No validation**: Rejected - leaves users vulnerable to excessive fees
4. **Merchant sets customer fee**: Rejected - merchant doesn't know gas costs

### Decision: On-Chain Merchant Fee Calculation
**Choice**: Contract calculates merchant fee using basis points

**Rationale**:
- Percentage is fixed and configured on-chain
- Simple calculation: `amount * bps / 10000`
- Deterministic and verifiable
- No external data needed

**Alternatives Considered**:
1. **Off-chain calculation**: Rejected - opens arbitrage opportunities
2. **Flat fee**: Rejected - unfair for different payment amounts
3. **Tiered fees**: Deferred - add if business needs emerge

### Decision: Session Duration Limits
**Choice**: Min 5 minutes, max 24 hours

**Rationale**:
- 5 min minimum gives customer reasonable time to pay
- 24 hour maximum prevents indefinite liability
- Balances merchant flexibility with risk management
- Prevents abuse (very short or very long sessions)

**Alternatives Considered**:
1. **No minimum**: Rejected - enables timing attacks
2. **No maximum**: Rejected - indefinite liability risk
3. **Configurable limits**: Deferred - start with constants, add config if needed

### Decision: Session ID Generation
**Choice**: Hash of (merchant, token, amount, timestamp, nonce)

**Rationale**:
- Deterministic but unique
- Includes all key parameters
- Prevents collisions with timestamp + nonce
- Verifiable off-chain

**Alternatives Considered**:
1. **Sequential counter**: Rejected - reveals business volume
2. **Random ID**: Rejected - not deterministic, harder to verify
3. **Merchant-provided ID**: Rejected - collision risk, validation overhead

### Decision: Token Whitelist
**Choice**: Admin-managed whitelist of allowed tokens

**Rationale**:
- Prevents payments in malicious tokens
- Enables gradual rollout (start with mantraUSD)
- Control over supported assets
- Can remove problematic tokens

**Alternatives Considered**:
1. **Open to all ERC-20**: Rejected - security risk
2. **Hardcoded tokens**: Rejected - not flexible enough
3. **Token registry contract**: Deferred - unnecessary complexity for MVP

### Decision: Fee Collection Strategy
**Choice**: Accumulate merchant fees in contract, admin withdraws periodically

**Rationale**:
- Batch withdrawals save gas vs per-transaction
- Clear accounting of accumulated fees
- Enables treasury management strategies
- Customer fees go directly to relayer (immediate)

**Alternatives Considered**:
1. **Immediate fee transfer**: Rejected - wasteful gas costs
2. **Separate fee vault**: Rejected - adds contract complexity
3. **Auto-compounding**: Out of scope for payments

### Decision: Access Control
**Choice**: Ownable pattern for admin functions

**Rationale**:
- Simple and battle-tested (OpenZeppelin)
- Clear ownership model
- Single admin sufficient for MVP
- Can upgrade to multi-sig or DAO later

**Alternatives Considered**:
1. **Role-based (AccessControl)**: Deferred - overkill for MVP
2. **No access control**: Rejected - security risk
3. **DAO from start**: Rejected - premature complexity

### Decision: Event Emission Strategy
**Choice**: Emit comprehensive events for all state changes with full data

**Rationale**:
- Enables off-chain indexing without contract queries
- Provides audit trail
- Supports real-time monitoring
- Cheaper than frequent contract calls

**Alternatives Considered**:
1. **Minimal events**: Rejected - forces more contract queries
2. **Event-only data**: Rejected - need storage for validation
3. **Off-chain DB instead**: Rejected - less trustless

## Technical Design

### Contract Structure

```solidity
contract SessionRegistry is Ownable {
    // Constants
    uint256 public constant MIN_SESSION_DURATION = 5 minutes;
    uint256 public constant MAX_SESSION_DURATION = 24 hours;
    uint256 public constant MAX_FEE_BPS = 500; // 5%
    uint256 public constant BPS_DENOMINATOR = 10000;
    
    // State
    FeeConfig public feeConfig;
    mapping(bytes32 => PaymentSession) public sessions;
    mapping(address => bytes32[]) public merchantSessions;
    mapping(address => bool) public allowedTokens;
    mapping(address => uint256) public accumulatedFees;
    
    // Structs
    struct FeeConfig { ... }
    struct PaymentSession { ... }
}
```

### Session Creation Flow

```
createSession(token, amount, customerFee, ...) called
  ├─> Validate caller is merchant
  ├─> Validate token is allowed
  ├─> Validate amount > 0
  ├─> Validate duration in bounds
  ├─> Validate customerFee <= maxCustomerFee (if enabled)
  ├─> Calculate merchantFee = amount * merchantFeeBps / BPS_DENOMINATOR
  ├─> Calculate customerPays = amount + customerFee
  ├─> Calculate merchantReceives = amount - merchantFee
  ├─> Generate unique sessionId
  ├─> Store session in mapping
  ├─> Add to merchantSessions array
  ├─> Emit SessionCreated event
  └─> Return sessionId
```

### Session Fulfillment Flow

```
fulfillSession(sessionId, payer) called by DelegatedAccount
  ├─> Load session from storage
  ├─> Validate session exists
  ├─> Validate session not expired
  ├─> Validate session not fulfilled
  ├─> Transfer customerPays from payer to this contract
  ├─> Transfer merchantReceives to merchant
  ├─> Transfer customerFee to msg.sender (relayer)
  ├─> Transfer merchantFee to feeCollector
  ├─> Add merchantFee to accumulatedFees
  ├─> Mark session as fulfilled
  ├─> Store payer and txHash
  ├─> Emit SessionFulfilled event
  └─> Success
```

### Fee Calculation Logic

```solidity
function calculateMerchantFee(uint256 amount) public view returns (
    uint256 merchantFee,
    uint256 merchantReceives
) {
    if (!feeConfig.merchantFeeEnabled) {
        return (0, amount);
    }
    
    merchantFee = (amount * feeConfig.merchantFeeBps) / BPS_DENOMINATOR;
    merchantReceives = amount - merchantFee;
}

function validateCustomerFee(uint256 customerFee) public view returns (bool) {
    if (!feeConfig.customerFeeEnabled) {
        return customerFee == 0;
    }
    
    return customerFee >= feeConfig.minCustomerFee 
        && customerFee <= feeConfig.maxCustomerFee;
}
```

### State Machine

```
Session States:
- CREATED: Session exists, not expired, not fulfilled
- EXPIRED: Current time > expiresAt
- FULFILLED: fulfilled = true
- CANCELLED: Special flag or removal from storage

Transitions:
CREATED -> FULFILLED (via fulfillSession)
CREATED -> EXPIRED (via time passing)
CREATED -> CANCELLED (via cancelSession)

Terminal states: FULFILLED, EXPIRED, CANCELLED
```

### Data Structures

```solidity
struct PaymentSession {
    bytes32 id;
    address merchant;
    address token;
    uint256 amount;              // Base amount
    uint256 customerFee;         // Dynamic gas-based fee
    uint256 merchantFee;         // Percentage-based service fee
    uint256 customerPays;        // Total customer pays
    uint256 merchantReceives;    // Net merchant receives
    string reference;            // Optional merchant reference
    uint256 createdAt;
    uint256 expiresAt;
    bool fulfilled;
    address payer;
    bytes32 txHash;
}

struct FeeConfig {
    uint256 merchantFeeBps;
    bool merchantFeeEnabled;
    uint256 maxMerchantFeeBps;
    bool customerFeeEnabled;
    uint256 maxCustomerFee;
    uint256 minCustomerFee;
    address feeCollector;
}
```

### Storage Layout Optimization

1. **Pack booleans**: Group fulfilled, fee enabled flags
2. **Use uint256**: Avoid smaller types unless packing
3. **Minimize storage slots**: Each SSTORE costs 20k gas
4. **Index mappings properly**: sessionId => Session for O(1) lookup

### Gas Optimization Strategies

1. **Lazy deletion**: Don't delete sessions, mark fulfilled instead
2. **Batch events**: Include all data in single event vs multiple
3. **View functions**: Use view for read-only operations
4. **Short-circuit validation**: Check cheapest conditions first
5. **Immutable config where possible**: e.g., MAX_FEE_BPS

## Risks / Trade-offs

### Risk: Customer Fee Quote Expiration
**Impact**: Medium - User signs with outdated fee, loses more than expected
**Mitigation**: 
- Backend enforces 60s quote TTL
- Frontend warns if quote stale
- Contract enforces maxCustomerFee cap

### Risk: Merchant Fee Changes Between Create and Fulfill
**Impact**: Low - Fee locked at creation time
**Mitigation**: Merchant fee calculated and stored at session creation

### Risk: Token Price Volatility
**Impact**: Medium - Fixed amounts may be worth more/less at payment time
**Mitigation**: Short session durations (max 24h) limit exposure

### Risk: Accumulated Fees Stuck in Contract
**Impact**: Low - Requires admin action to withdraw
**Mitigation**: 
- Clear withdrawal function
- Events track accumulation
- Regular withdrawal schedule

### Risk: Whitelist Management
**Impact**: Low - Admin key compromise could allow malicious tokens
**Mitigation**: 
- Multi-sig admin recommended for production
- Audit token additions carefully
- Events track whitelist changes

### Trade-off: Immutable Sessions vs Flexibility
**Decision**: Chose immutability
**Impact**: Must create new session to change terms
**Justification**: Simpler, more secure, prevents disputes

### Trade-off: On-Chain vs Off-Chain Fee Calculation
**Decision**: Merchant on-chain, customer off-chain
**Impact**: Different trust models
**Justification**: 
- Merchant fee deterministic, belongs on-chain
- Customer fee dynamic, better off-chain with validation

### Trade-off: Storage vs Events
**Decision**: Store sessions, emit comprehensive events
**Impact**: Higher gas for creation, lower for queries
**Justification**: One-time creation cost worth it for reliable queries

## Migration Plan

### Deployment Sequence
1. Deploy to Dukong testnet
2. Configure fee parameters (both fees disabled initially)
3. Whitelist mantraUSD token
4. Test session lifecycle
5. Enable fees in controlled rollout
6. Deploy to mainnet
7. Configure mainnet parameters

### Testing Strategy
1. **Unit tests**: Each function in isolation
2. **Integration tests**: Full payment flows
3. **Edge cases**: Expired sessions, invalid tokens, fee boundaries
4. **Gas benchmarks**: Optimize critical paths
5. **Security audit**: External review before mainnet

### Configuration Steps
```solidity
// Initial setup
setAllowedToken(mantraUSD, true);
setFeeConfig(
    100,              // 1% merchant fee
    1e6,              // 1 mantraUSD max customer fee
    treasuryAddress
);
setCustomerFeeEnabled(false);  // Start disabled
setMerchantFeeEnabled(false);  // Start disabled
```

### Monitoring
- Track `SessionCreated` events for volume metrics
- Monitor `SessionFulfilled` for conversion rates
- Alert on expired sessions (potential UX issues)
- Track accumulated fees vs withdrawals
- Monitor gas costs per operation

## Open Questions

### Question: Should we support session amendments?
**Status**: No for MVP
**Rationale**: Adds complexity, create new session instead

### Question: Should we implement refunds?
**Status**: Out of scope initially
**Rationale**: Can be handled by reverse payment session

### Question: Should fee collector be per-token or global?
**Status**: Global for MVP
**Rationale**: Simpler accounting, can enhance later if needed

### Question: Should we batch multiple sessions in single transaction?
**Status**: Deferred post-MVP
**Rationale**: Single session covers 95% of use cases

### Question: Should sessions be deletable vs marked fulfilled?
**Status**: Mark fulfilled, keep data
**Rationale**: Audit trail more important than storage savings

### Question: Should we emit events for view function calls?
**Status**: No
**Rationale**: View functions don't change state, no events needed
