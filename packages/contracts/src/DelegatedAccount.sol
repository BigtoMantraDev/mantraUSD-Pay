// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IDelegatedAccount } from "./interfaces/IDelegatedAccount.sol";
import { IERC1271 } from "@openzeppelin/contracts/interfaces/IERC1271.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DelegatedAccount
 * @notice EIP-7702 execution contract enabling gasless transactions for EOA wallets
 * @dev This contract allows EOA wallets to delegate transaction execution through EIP-7702.
 *      Customers sign off-chain using EIP-712 typed data, and a relay service broadcasts
 *      the transaction with the delegation.
 *
 * Security Features:
 * - Per-account nonce tracking for replay protection
 * - Deadline enforcement for signature expiry
 * - Destination validation (no zero address or self-calls)
 * - Support for both EOA and smart contract wallet signatures (EIP-1271)
 */
contract DelegatedAccount is IDelegatedAccount, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // ============ Constants ============

    /// @notice EIP-712 typehash for execute data
    bytes32 public constant EXECUTE_TYPEHASH =
        keccak256("ExecuteData(address account,address destination,uint256 value,bytes data,uint256 nonce,uint256 deadline)");

    /// @notice EIP-1271 magic value indicating a valid signature
    bytes4 private constant EIP1271_MAGIC_VALUE = 0x1626ba7e;

    // ============ Immutables ============

    /// @notice EIP-712 domain separator (computed at deployment)
    bytes32 private immutable _DOMAIN_SEPARATOR;

    /// @notice Chain ID at deployment (for domain separator validation)
    uint256 private immutable _CHAIN_ID;

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
        _CHAIN_ID = block.chainid;
        _DOMAIN_SEPARATOR = _computeDomainSeparator();
    }

    // ============ External Functions ============

    /**
     * @inheritdoc IDelegatedAccount
     */
    function execute(
        address account,
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
        // Validate deadline
        if (block.timestamp > deadline) revert SignatureExpired();

        // Validate destination
        if (destination == address(0) || destination == address(this)) {
            revert InvalidDestination();
        }

        // Validate nonce for the signing account
        if (nonce != _nonces[account]) revert InvalidNonce();

        // Verify signature - the signature must be from the account parameter
        bytes32 structHash = keccak256(abi.encode(EXECUTE_TYPEHASH, account, destination, value, keccak256(data), nonce, deadline));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR(), structHash));

        if (!_isValidSignature(account, digest, signature)) {
            revert InvalidSignature();
        }

        // Execute call (before incrementing nonce to maintain CEI pattern)
        // Note: We keep the external call after nonce check but before increment
        // to ensure failed transactions don't consume nonces
        (bool success, bytes memory returnData) = destination.call{ value: value }(data);

        if (!success) {
            revert ExecutionFailed(returnData);
        }

        // Increment nonce after successful execution (CEI pattern)
        _nonces[account] = nonce + 1;

        emit Executed(account, destination, value, nonce, success);

        return returnData;
    }

    /**
     * @inheritdoc IDelegatedAccount
     * @dev This function allows direct token transfers when the caller has approved
     *      the DelegatedAccount contract. Use with caution - only approve exact amounts
     *      needed for specific transactions.
     * @notice SECURITY WARNING: This function will transfer tokens from msg.sender to the
     *         recipient. Only call this if you have specifically approved this contract
     *         and intend to make the transfer immediately. Consider using execute() with
     *         proper signature verification for better security.
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
     */
    function DOMAIN_SEPARATOR() public view returns (bytes32) {
        // If chain ID hasn't changed, use cached separator
        if (block.chainid == _CHAIN_ID) {
            return _DOMAIN_SEPARATOR;
        }
        // Otherwise recompute (handles chain forks)
        return _computeDomainSeparator();
    }

    // ============ Internal Functions ============

    /**
     * @notice Compute the EIP-712 domain separator
     * @return The domain separator hash
     */
    function _computeDomainSeparator() private view returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("DelegatedAccount"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
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
