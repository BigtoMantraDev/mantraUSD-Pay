# Spec: DelegatedAccount

> EIP-7702 execution contract enabling gasless transactions for EOA wallets.

## Overview

The DelegatedAccount contract implements a secure execution layer that allows EOA wallets to delegate transaction execution through EIP-7702. This enables gasless payments where customers sign off-chain and a relay service broadcasts the transaction.

## Dependencies

- OpenZeppelin SafeERC20 for secure token transfers
- ECDSA library for signature verification
- EIP-712 for typed data signing

---

## ADDED Requirements

### Requirement: EIP-712 Domain Separator

The contract MUST implement EIP-712 domain separator for typed data signing.

#### Scenario: Domain separator construction

- Given the contract is deployed on a chain
- When the domain separator is computed
- Then it MUST include:
  - `name`: "DelegatedAccount"
  - `version`: "1"
  - `chainId`: Current chain ID
  - `verifyingContract`: Contract address

#### Scenario: Chain ID binding

- Given a signature created on chain A
- When verification is attempted on chain B
- Then the signature MUST be rejected due to domain mismatch

---

### Requirement: Signature Verification

The contract MUST verify EIP-712 signatures before executing any operation.

#### Scenario: Valid EOA signature

- Given a valid EIP-712 signature from the caller
- When `execute()` is called with correct parameters
- Then the operation MUST proceed
- And the nonce MUST be incremented

#### Scenario: Invalid signature

- Given an invalid or tampered signature
- When `execute()` is called
- Then the transaction MUST revert with "Invalid signature"

#### Scenario: Signature from wrong signer

- Given a valid signature from address A
- When `execute()` is called by address B (via delegation)
- Then the transaction MUST revert

---

### Requirement: Nonce Management

The contract MUST implement per-account nonce tracking for replay protection.

#### Scenario: Sequential nonce enforcement

- Given an account with nonce N
- When `execute()` is called with nonce N
- Then execution proceeds
- And nonce increments to N+1

#### Scenario: Nonce replay attack

- Given a successfully executed transaction with nonce N
- When the same transaction is replayed
- Then the transaction MUST revert with "Invalid nonce"

#### Scenario: Out-of-order nonce

- Given an account with nonce N
- When `execute()` is called with nonce N+2
- Then the transaction MUST revert with "Invalid nonce"

#### Scenario: Nonce getter

- Given any account address
- When `getNonce(address)` is called
- Then the current nonce for that account MUST be returned

---

### Requirement: Deadline Enforcement

The contract MUST enforce signature expiration via deadline parameter.

#### Scenario: Valid deadline

- Given a signature with deadline in the future
- When `execute()` is called before the deadline
- Then execution MUST proceed

#### Scenario: Expired deadline

- Given a signature with deadline in the past
- When `execute()` is called
- Then the transaction MUST revert with "Signature expired"

#### Scenario: Deadline at current block

- Given a signature with deadline equal to `block.timestamp`
- When `execute()` is called in the same block
- Then execution MUST proceed (deadline is inclusive)

---

### Requirement: Atomic Execution

The contract MUST execute the target call atomically with proper error handling.

#### Scenario: Successful execution

- Given a valid signature and target call
- When `execute()` succeeds
- Then the `Executed` event MUST be emitted
- And the return data MUST be available

#### Scenario: Target call failure

- Given a valid signature but failing target call
- When `execute()` is called
- Then the transaction MUST revert
- And the original revert reason MUST be propagated

#### Scenario: Reentrancy protection

- Given a malicious target that attempts to re-call `execute()`
- When the reentrant call is attempted
- Then the nested call MUST fail

---

### Requirement: Destination Validation

The contract MUST validate the destination address before execution.

#### Scenario: Zero address destination

- Given a call with destination = address(0)
- When `execute()` is called
- Then the transaction MUST revert with "Invalid destination"

#### Scenario: Self-call prevention

- Given a call with destination = DelegatedAccount address
- When `execute()` is called
- Then the transaction MUST revert with "Invalid destination"

#### Scenario: Valid destination

- Given a call with a valid non-zero contract address
- When `execute()` is called with valid signature
- Then execution MUST proceed

---

### Requirement: Token Transfer Helper

The contract MUST provide a helper function for ERC-20 token transfers.

#### Scenario: Transfer tokens

- Given the caller has sufficient token balance
- When `transferToken(token, to, amount)` is called
- Then tokens MUST be transferred using SafeERC20
- And the `TokenTransferred` event MUST be emitted

#### Scenario: Insufficient balance

- Given the caller has insufficient token balance
- When `transferToken()` is called
- Then the transaction MUST revert

#### Scenario: Invalid token address

- Given token address = address(0)
- When `transferToken()` is called
- Then the transaction MUST revert

---

### Requirement: EIP-1271 Support

The contract MUST support signature verification for smart contract wallets.

#### Scenario: EOA signature

- Given a signature from an EOA
- When signature verification is performed
- Then ECDSA recovery MUST be used

#### Scenario: Contract wallet signature

- Given a signature from a smart contract wallet
- When signature verification is performed
- Then EIP-1271 `isValidSignature()` MUST be called on the wallet
- And the magic value MUST be checked

---

### Requirement: Events

The contract MUST emit events for all significant state changes.

#### Event: Executed

```solidity
event Executed(
    address indexed executor,
    address indexed destination,
    uint256 value,
    uint256 nonce,
    bool success
);
```

#### Event: TokenTransferred

```solidity
event TokenTransferred(
    address indexed token,
    address indexed from,
    address indexed to,
    uint256 amount
);
```

---

## Interface

```solidity
interface IDelegatedAccount {
    function execute(
        address destination,
        uint256 value,
        bytes calldata data,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external returns (bytes memory);

    function transferToken(
        address token,
        address to,
        uint256 amount
    ) external;

    function getNonce(address account) external view returns (uint256);

    function DOMAIN_SEPARATOR() external view returns (bytes32);
}
```

---

## Security Considerations

| Risk                    | Mitigation                                      |
|-------------------------|--------------------------------------------------|
| Replay attacks          | Per-account nonce tracking                       |
| Stale signatures        | Deadline enforcement                             |
| Malicious destinations  | Zero address and self-call validation            |
| Signature malleability  | Use OpenZeppelin ECDSA library                   |
| Cross-chain replay      | ChainId in EIP-712 domain                        |
