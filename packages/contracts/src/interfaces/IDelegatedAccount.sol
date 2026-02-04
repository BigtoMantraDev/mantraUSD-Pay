// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IDelegatedAccount
 * @notice Interface for the EIP-7702 execution contract enabling gasless transactions
 * @dev This contract allows EOA wallets to delegate transaction execution through EIP-7702
 */
interface IDelegatedAccount {
    /**
     * @notice Emitted when a call is successfully executed
     * @param account The account that authorized the execution
     * @param destination The target contract address
     * @param value The ETH value sent with the call
     * @param nonce The nonce used for this execution
     * @param success Whether the call succeeded
     */
    event Executed(address indexed account, address indexed destination, uint256 value, uint256 nonce, bool success);

    /**
     * @notice Emitted when tokens are transferred via the helper function
     * @param token The ERC-20 token address
     * @param from The sender address
     * @param to The recipient address
     * @param amount The amount transferred
     */
    event TokenTransferred(address indexed token, address indexed from, address indexed to, uint256 amount);

    /**
     * @notice Execute a call on behalf of the delegating account
     * @param account The account that signed the authorization (owns the funds)
     * @param destination The target contract to call
     * @param value The ETH value to send with the call
     * @param data The calldata to send to the target
     * @param nonce The nonce for replay protection
     * @param deadline The timestamp after which the signature expires
     * @param signature The EIP-712 signature authorizing the execution
     * @return The return data from the executed call
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
        returns (bytes memory);

    /**
     * @notice Transfer ERC-20 tokens on behalf of the delegating account
     * @param token The ERC-20 token contract address
     * @param to The recipient address
     * @param amount The amount of tokens to transfer
     */
    function transferToken(address token, address to, uint256 amount) external;

    /**
     * @notice Get the current nonce for an account
     * @param account The account to query
     * @return The current nonce value
     */
    function getNonce(address account) external view returns (uint256);

    /**
     * @notice Get the EIP-712 domain separator
     * @return The domain separator hash
     */
    function domainSeparator() external view returns (bytes32);
}
