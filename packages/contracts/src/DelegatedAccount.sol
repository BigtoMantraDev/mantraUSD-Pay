// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IDelegatedAccount } from "./interfaces/IDelegatedAccount.sol";
import { IERC1271 } from "@openzeppelin/contracts/interfaces/IERC1271.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title DelegatedAccount
 * @notice EIP-7702 execution contract enabling gasless transactions for EOA wallets
 * @dev This contract allows EOA wallets to delegate transaction execution through EIP-7702.
 *      With EIP-7702, when this contract is designated as the implementation for an EOA,
 *      address(this) IS the user's EOA address. This enables true gasless execution:
 *      - User signs an EIP-7702 authorization to delegate their EOA to this contract
 *      - User signs an EIP-712 intent specifying what action to execute
 *      - Relayer broadcasts a Type 4 transaction with the authorization list
 *      - The contract code runs in the user's EOA context, msg.sender is the relayer
 *
 * Security Features:
 * - Per-account nonce tracking for replay protection (using address(this))
 * - Deadline enforcement for signature expiry
 * - Destination validation (no zero address or self-calls)
 * - Support for both EOA and smart contract wallet signatures (EIP-1271)
 */
contract DelegatedAccount is IDelegatedAccount, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // ============ Constants ============

    /// @notice EIP-712 typehash for Intent (matches frontend INTENT_TYPES)
    bytes32 public constant INTENT_TYPEHASH =
        keccak256("Intent(address destination,uint256 value,bytes data,uint256 nonce,uint256 deadline)");

    /// @notice EIP-1271 magic value indicating a valid signature
    bytes4 private constant EIP1271_MAGIC_VALUE = 0x1626ba7e;

    // ============ Immutables ============

    /// @notice The implementation contract address (used for EIP-712 domain)
    /// @dev With EIP-7702, address(this) varies per delegation, but the domain
    ///      should use a consistent verifyingContract for signature verification.
    address private immutable _implementation;

    /// @notice Cached domain separator (uses implementation address)
    bytes32 private immutable _cachedDomainSeparator;

    /// @notice Chain ID at deployment (for domain separator validation)
    uint256 private immutable _cachedChainId;

    // ============ State ============

    /// @notice Nonce tracking per account for replay protection
    mapping(address => uint256) private _nonces;

    // ============ Errors ============

    error InvalidSignature();
    error InvalidNonce();
    error SignatureExpired();
    error InvalidDestination();
    error InvalidToken();
    error ExecutionFailed(bytes reason);

    // ============ Constructor ============

    constructor() {
        // Store implementation address for consistent EIP-712 domain
        _implementation = address(this);
        _cachedChainId = block.chainid;
        _cachedDomainSeparator = _computeDomainSeparator(_implementation);
    }

    // ============ External Functions ============

    /**
     * @inheritdoc IDelegatedAccount
     * @dev With EIP-7702, address(this) is the user's EOA. The signature must be from
     *      address(this) to prove the user authorized this specific action.
     */
    function execute(
        address destination,
        uint256 value,
        bytes calldata data,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    )
        external
        nonReentrant
        returns (bytes memory)
    {
        // With EIP-7702, address(this) is the user's EOA
        address account = address(this);

        // Validate deadline
        if (block.timestamp > deadline) revert SignatureExpired();

        // Validate destination
        if (destination == address(0) || destination == account) {
            revert InvalidDestination();
        }

        // Validate nonce for the delegating account
        if (nonce != _nonces[account]) revert InvalidNonce();

        // Verify signature - the signature must be from address(this) (the user's EOA)
        bytes32 dataHash;
        /// @solidity memory-safe-assembly
        assembly {
            let m := mload(0x40)
            calldatacopy(m, data.offset, data.length)
            dataHash := keccak256(m, data.length)
        }
        bytes32 typeHash = INTENT_TYPEHASH;
        bytes32 structHash;
        /// @solidity memory-safe-assembly
        assembly {
            // Compute structHash = keccak256(abi.encode(INTENT_TYPEHASH, destination, value, dataHash, nonce, deadline))
            let m := mload(0x40)
            mstore(m, typeHash)
            mstore(add(m, 0x20), destination)
            mstore(add(m, 0x40), value)
            mstore(add(m, 0x60), dataHash)
            mstore(add(m, 0x80), nonce)
            mstore(add(m, 0xa0), deadline)
            structHash := keccak256(m, 0xc0)
        }

        bytes32 domainSep = domainSeparator();
        bytes32 digest;
        /// @solidity memory-safe-assembly
        assembly {
            // Compute digest = keccak256("\x19\x01" || domainSeparator || structHash)
            let m := mload(0x40)
            mstore(m, 0x1901000000000000000000000000000000000000000000000000000000000000)
            mstore(add(m, 0x02), domainSep)
            mstore(add(m, 0x22), structHash)
            digest := keccak256(m, 0x42)
        }

        if (!_isValidSignature(account, digest, signature)) {
            revert InvalidSignature();
        }

        // Execute call from the user's EOA context
        // With EIP-7702, this call originates from address(this) which is the user's EOA
        (bool success, bytes memory returnData) = destination.call{ value: value }(data);

        if (!success) {
            revert ExecutionFailed(returnData);
        }

        // Increment nonce only after successful execution
        _nonces[account] = nonce + 1;

        emit Executed(account, destination, value, nonce, success);

        return returnData;
    }

    /**
     * @inheritdoc IDelegatedAccount
     * @notice SECURITY WARNING: This function transfers tokens from msg.sender to the recipient.
     *         Only approve this contract for the exact amount needed for immediate transfer.
     *         For better security with gasless transactions, use execute() with signature verification.
     */
    function transferToken(address token, address to, uint256 amount) external nonReentrant {
        if (token == address(0)) revert InvalidToken();
        if (to == address(0)) revert InvalidDestination();

        // Transfer from msg.sender (not from arbitrary addresses)
        // This ensures only the caller's tokens are transferred
        IERC20(token).safeTransferFrom(msg.sender, to, amount);

        emit TokenTransferred(token, msg.sender, to, amount);
    }

    // ============ View Functions ============

    /**
     * @inheritdoc IDelegatedAccount
     */
    function getNonce(address account) external view returns (uint256) {
        return _nonces[account];
    }

    /**
     * @inheritdoc IDelegatedAccount
     * @dev Uses the implementation contract address for consistent signature verification.
     *      With EIP-7702, address(this) varies per delegation, but signatures should
     *      reference a stable verifyingContract.
     */
    function domainSeparator() public view returns (bytes32) {
        // Use cached if chain ID matches, otherwise recompute
        if (block.chainid == _cachedChainId) {
            return _cachedDomainSeparator;
        }
        return _computeDomainSeparator(_implementation);
    }

    /**
     * @notice Get the implementation contract address used for EIP-712 domain
     * @return The implementation address
     */
    function implementation() external view returns (address) {
        return _implementation;
    }

    // ============ Internal Functions ============

    /**
     * @notice Compute the EIP-712 domain separator
     * @param verifyingContract The contract address to use in the domain
     * @return result The domain separator hash
     */
    function _computeDomainSeparator(address verifyingContract) private view returns (bytes32 result) {
        // EIP712Domain typehash: keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
        bytes32 typeHash = 0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f;
        // keccak256("DelegatedAccount")
        bytes32 nameHash = 0x8fb3717175124fe77482abbbf65ce134bcb0a3c323ed0623cb87540ae3d69ffa;
        // keccak256("1")
        bytes32 versionHash = 0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6;

        /// @solidity memory-safe-assembly
        assembly {
            let m := mload(0x40)
            mstore(m, typeHash)
            mstore(add(m, 0x20), nameHash)
            mstore(add(m, 0x40), versionHash)
            mstore(add(m, 0x60), chainid())
            mstore(add(m, 0x80), verifyingContract)
            result := keccak256(m, 0xa0)
        }
    }

    /**
     * @notice Verify a signature from an EOA or smart contract wallet
     * @param signer The expected signer address
     * @param digest The message digest to verify
     * @param signature The signature bytes
     * @return True if the signature is valid
     */
    function _isValidSignature(address signer, bytes32 digest, bytes calldata signature) private view returns (bool) {
        // Try EOA signature first
        (address recovered, ECDSA.RecoverError error,) = digest.tryRecover(signature);

        if (error == ECDSA.RecoverError.NoError && recovered == signer) {
            return true;
        }

        // Try EIP-1271 for smart contract wallets
        if (signer.code.length > 0) {
            try IERC1271(signer).isValidSignature(digest, signature) returns (bytes4 magicValue) {
                return magicValue == EIP1271_MAGIC_VALUE;
            } catch {
                return false;
            }
        }

        return false;
    }

    /**
     * @notice Receive ETH (needed for value transfers)
     */
    receive() external payable { }
}
