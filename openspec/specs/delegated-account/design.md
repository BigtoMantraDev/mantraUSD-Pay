# Delegated Account Design

## Context

The DelegatedAccount contract is a critical component of the EIP-7702 gasless payment system. It serves as the temporary code that EOAs delegate to when executing payments without holding native tokens for gas.

### Background
- EIP-7702 allows EOAs to temporarily behave like smart contracts
- Users maintain control of their accounts while gaining smart contract capabilities
- The relayer sponsors gas costs, enabling true gasless transactions
- All authorization happens through EIP-712 signatures, not on-chain state

### Constraints
- Must be stateless except for nonce tracking
- Must prevent replay attacks across different sessions
- Must be compatible with existing ERC-20 tokens
- Must minimize gas costs since relayer pays
- Must prevent common attack vectors (reentrancy, signature replay, etc.)

### Stakeholders
- **End Users**: Need simple, secure payment experience
- **Relayers**: Need protection from abuse and gas cost control
- **Merchants**: Need reliable payment completion
- **Smart Contract Developers**: Need clear, auditable code

## Goals / Non-Goals

### Goals
- Provide stateless, reusable delegation target for any EOA
- Enable gasless payments through relayer-sponsored transactions
- Ensure security through multi-layer validation
- Minimize gas costs for relayer
- Support standard ERC-20 token transfers
- Maintain compatibility with EIP-712, EIP-1271 standards

### Non-Goals
- Managing user balances or payment sessions (SessionRegistry handles this)
- Supporting native token transfers (focus on ERC-20)
- Providing wallet recovery mechanisms
- Implementing complex authorization logic beyond signatures
- Supporting multi-signature schemes
- Implementing token swaps or DeFi interactions

## Decisions

### Decision: Stateless Architecture
**Choice**: Only store nonces, no other user-specific state

**Rationale**:
- Keeps contract simple and auditable
- Reduces gas costs (fewer SSTORE operations)
- Makes contract reusable across all EOAs
- Aligns with EIP-7702's temporary delegation model
- Session state lives in SessionRegistry where it belongs

**Alternatives Considered**:
1. **Store user preferences/settings**: Rejected - adds complexity and gas costs without clear benefit
2. **Store payment history**: Rejected - use events and SessionRegistry instead
3. **Cache frequently accessed data**: Rejected - stateless design more important than optimization

### Decision: Per-Account Nonce Management
**Choice**: Maintain mapping of account => nonce

**Rationale**:
- Prevents replay attacks effectively
- Standard pattern in account abstraction
- Simple to implement and verify
- Allows concurrent users without conflicts

**Alternatives Considered**:
1. **Global nonce**: Rejected - would create bottlenecks for concurrent users
2. **Timestamp-based validation only**: Rejected - vulnerable to clock skew attacks
3. **No nonce, rely on deadline**: Rejected - allows replays within deadline window

### Decision: Deadline-Based Signature Expiration
**Choice**: Require deadline parameter in all signatures

**Rationale**:
- Prevents indefinite validity of signed messages
- Gives users control over signature lifespan
- Standard in EIP-712 patterns
- Works alongside nonce for defense-in-depth

**Alternatives Considered**:
1. **Fixed expiration (e.g., 1 hour)**: Rejected - less flexible for users
2. **No expiration**: Rejected - security risk of long-lived signatures
3. **Block number based**: Rejected - harder to reason about for users

### Decision: EIP-712 Structured Data Signing
**Choice**: Use typed structured data instead of raw message signing

**Rationale**:
- Industry standard for safe signing
- Prevents signature malleability
- Provides clear user-readable signatures in wallets
- Binds signatures to specific contract and chain
- Required for EIP-7702 compatibility

**Alternatives Considered**:
1. **Personal sign**: Rejected - prone to phishing, no structure
2. **Custom encoding**: Rejected - reinventing the wheel, error-prone
3. **Raw transaction signing**: Rejected - doesn't work with delegation model

### Decision: EIP-1271 Implementation
**Choice**: Implement isValidSignature for smart contract signature validation

**Rationale**:
- Enables compatibility with other protocols expecting EIP-1271
- Standard interface for signature validation
- Useful for future integrations
- Minimal implementation overhead

**Alternatives Considered**:
1. **Skip EIP-1271**: Rejected - limits future composability
2. **Full account abstraction (EIP-4337)**: Rejected - overkill for this use case

### Decision: Destination Validation
**Choice**: Prevent calls to zero address and self

**Rationale**:
- Zero address calls are always errors
- Self-calls could enable recursion attacks
- Simple validation with high security value
- Minimal gas overhead

**Alternatives Considered**:
1. **Whitelist destinations**: Rejected - too restrictive, defeats purpose
2. **No validation**: Rejected - leaves obvious attack vectors open
3. **Complex validation rules**: Rejected - adds gas costs and complexity

### Decision: Atomic Execution
**Choice**: Execute target call within same transaction as validation

**Rationale**:
- EIP-7702 enables this pattern naturally
- Eliminates need for separate authorization step
- Simpler user experience (one signature = one action)
- Reduces potential for state inconsistencies

**Alternatives Considered**:
1. **Two-step authorize then execute**: Rejected - worse UX, more gas
2. **Queued execution**: Rejected - adds complexity, not needed for payments
3. **Batched operations**: Out of scope for MVP, could add later

### Decision: Token Transfer Helper Function
**Choice**: Provide transferToken convenience method

**Rationale**:
- Simplifies common case of ERC-20 transfers
- Reduces encoding errors in client code
- Still uses execute internally for consistency
- No additional security surface

**Alternatives Considered**:
1. **Only expose execute**: Rejected - requires client to encode transfer
2. **Support multiple token standards**: Deferred - start with ERC-20
3. **Batch transfers**: Out of scope for MVP

## Technical Design

### Contract Structure

```solidity
contract DelegatedAccount {
    // State: Only nonces
    mapping(address => uint256) private _nonces;
    
    // EIP-712 Domain
    string public constant NAME = "DelegatedAccount";
    string public constant VERSION = "1";
    bytes32 public immutable DOMAIN_SEPARATOR;
    
    // Type hashes
    bytes32 public constant EXECUTE_TYPEHASH = keccak256(
        "Execute(address account,address destination,uint256 value,bytes data,uint256 nonce,uint256 deadline)"
    );
    
    // Core function
    function execute(...) external returns (bytes memory);
    
    // Helper function
    function transferToken(...) external returns (bool);
    
    // View functions
    function getNonce(address account) external view returns (uint256);
    function getExecuteDigest(...) external view returns (bytes32);
    function isValidSignature(...) external view returns (bytes4);
}
```

### Signature Flow

```
1. User wants to execute transaction
2. Frontend builds EIP-712 typed data with:
   - account: user's EOA address
   - destination: target contract (e.g., token address)
   - value: native value (usually 0)
   - data: encoded call (e.g., transfer)
   - nonce: current nonce from getNonce()
   - deadline: future timestamp
3. User signs via wallet
4. Relayer submits Type 4 transaction with:
   - authorization_list: [user's authorization for DelegatedAccount]
   - to: DelegatedAccount contract
   - data: execute(..., signature)
5. Contract validates and executes atomically
```

### Validation Sequence

```
execute() called
  ├─> Check deadline > block.timestamp
  ├─> Check destination != address(0) && destination != address(this)
  ├─> Compute EIP-712 digest
  ├─> Recover signer from signature
  ├─> Check signer == account parameter
  ├─> Check nonce matches _nonces[account]
  ├─> Increment _nonces[account]
  ├─> Execute call to destination
  │   ├─> Success -> emit ExecutionSuccess
  │   └─> Failure -> revert with ExecutionFailed
  └─> Return result
```

### Gas Optimization Strategies

1. **Use immutable DOMAIN_SEPARATOR**: Computed once at deploy, saves gas
2. **Minimal storage**: Only nonces stored, everything else derived or emitted
3. **No unnecessary checks**: Validate only what's security-critical
4. **Efficient encoding**: Use standard ABI encoding, no custom schemes
5. **Revert early**: Check cheapest conditions first (deadline, addresses)

### Error Handling

All errors use custom errors (not revert strings) for gas efficiency:
- `InvalidSignature()`: Signature doesn't match account
- `ExpiredSignature()`: Deadline has passed
- `InvalidNonce()`: Nonce mismatch
- `ExecutionReverted(bytes reason)`: Target call failed
- `InvalidDestination()`: Zero address or self-call

### Event Design

Events capture all execution attempts for monitoring:
```solidity
event ExecutionSuccess(
    address indexed account,
    address indexed destination,
    uint256 value,
    bytes data
);

event ExecutionFailed(
    address indexed account,
    address indexed destination,
    uint256 value,
    bytes data,
    bytes reason
);
```

## Risks / Trade-offs

### Risk: Signature Replay Across Chains
**Mitigation**: DOMAIN_SEPARATOR includes chainId, preventing cross-chain replay

### Risk: Front-running
**Impact**: Low - nonce ensures only intended transaction executes
**Mitigation**: Users sign specific nonce, front-runner can't change it

### Risk: Deadline Too Far in Future
**Impact**: Medium - signature valid longer than user intended
**Mitigation**: Frontend enforces reasonable deadlines (60s - 1hr)

### Risk: Relayer Goes Offline
**Impact**: Medium - user's signed transaction can't be submitted
**Mitigation**: Multiple relayers can accept same signature (if nonce still valid)

### Risk: Gas Cost Volatility
**Impact**: Low for contract (relayer bears cost)
**Mitigation**: Relayer includes gas buffer in customer fee calculation

### Trade-off: Stateless vs. Rich Features
**Decision**: Chose stateless
**Impact**: Can't store user preferences, requires external systems for state
**Justification**: Simplicity and security more important than convenience features

### Trade-off: Generic Execute vs. Specialized Functions
**Decision**: Generic execute() + transferToken() helper
**Impact**: Flexible but requires careful client-side encoding
**Justification**: Balances flexibility and usability

## Migration Plan

### Deployment
1. Deploy DelegatedAccount to testnet (Dukong)
2. Verify contract on block explorer
3. Deploy to mainnet (MANTRA Chain)
4. Register addresses in config package

### Testing Strategy
1. Unit tests: All validation paths (nonce, signature, deadline)
2. Integration tests: End-to-end with SessionRegistry
3. Simulation tests: Gas cost benchmarks
4. Security audit: Before mainnet deployment

### Monitoring
- Track ExecutionSuccess/ExecutionFailed events
- Monitor nonce increments for anomalies
- Alert on unusual gas consumption patterns
- Track unique delegating accounts

## Open Questions

### Question: Should we support native token transfers?
**Status**: Deferred to post-MVP
**Rationale**: mantraUSD (ERC-20) is sufficient for payment use case

### Question: Should we implement batch operations?
**Status**: Deferred to post-MVP
**Rationale**: Single payment at a time is simpler and sufficient initially

### Question: Should we allow changing DOMAIN_SEPARATOR parameters?
**Status**: No - immutable by design
**Rationale**: Changing would break existing signatures, deploy new contract instead

### Question: Should we implement EIP-4337 full account abstraction?
**Status**: No - out of scope
**Rationale**: EIP-7702 provides what we need with less complexity
