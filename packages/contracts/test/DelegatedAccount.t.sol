// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { DelegatedAccount } from "../src/DelegatedAccount.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";
import { MockSmartWallet } from "./mocks/MockSmartWallet.sol";
import { Test } from "forge-std/Test.sol";

/**
 * @title MockTarget
 * @notice Simple mock contract for testing execute function
 */
contract MockTarget {
    bool public wasCalled;
    uint256 public ethReceived;

    function doSomething() external returns (bool) {
        wasCalled = true;
        return true;
    }

    function doSomethingWithArgs(uint256 value) external returns (uint256) {
        wasCalled = true;
        return value * 2;
    }

    function doFail() external pure {
        revert("MockTarget: intended failure");
    }

    // Function to receive ETH
    function receiveEth() external payable {
        wasCalled = true;
        ethReceived = msg.value;
    }

    // Allow contract to receive ETH
    receive() external payable {
        ethReceived = msg.value;
    }
}

/**
 * @title DelegatedAccountTest
 * @notice Comprehensive tests for the DelegatedAccount contract
 * @dev These tests simulate EIP-7702 delegation context where the contract code
 *      runs as if it were the user's EOA (i.e., address(this) == user's EOA).
 *      In production, this happens via EIP-7702 Type 4 transactions with authorization lists.
 */
contract DelegatedAccountTest is Test {
    DelegatedAccount public delegatedAccount;
    MockERC20 public token;
    MockSmartWallet public smartWallet;

    address public owner;
    uint256 public ownerPrivateKey;
    address public user;
    uint256 public userPrivateKey;
    address public recipient;

    // Updated INTENT_TYPEHASH to match the new contract (without account parameter)
    bytes32 public constant INTENT_TYPEHASH =
        keccak256("Intent(address destination,uint256 value,bytes data,uint256 nonce,uint256 deadline)");

    event Executed(address indexed account, address indexed destination, uint256 value, uint256 nonce, bool success);

    event TokenTransferred(address indexed token, address indexed from, address indexed to, uint256 amount);

    function setUp() public {
        // Create test accounts
        ownerPrivateKey = 0xA11CE;
        owner = vm.addr(ownerPrivateKey);
        userPrivateKey = 0xB0B;
        user = vm.addr(userPrivateKey);
        recipient = makeAddr("recipient");

        // Deploy the DelegatedAccount implementation
        delegatedAccount = new DelegatedAccount();
        token = new MockERC20("Test Token", "TEST", 18);
        smartWallet = new MockSmartWallet(owner);

        // Setup token balances
        token.mint(owner, 1000 ether);
        token.mint(user, 1000 ether);
    }

    /**
     * @notice Helper to simulate EIP-7702 delegation
     * @dev Uses vm.etch to place DelegatedAccount code at the user's EOA address.
     *      This simulates what happens when an EIP-7702 Type 4 transaction includes
     *      the user's authorization in the authorizationList.
     */
    function _simulateEIP7702Delegation(address eoa) internal {
        // Get the runtime bytecode from the deployed implementation
        bytes memory code = address(delegatedAccount).code;
        // Etch it onto the EOA to simulate EIP-7702 delegation
        vm.etch(eoa, code);
    }

    /**
     * @notice Get a DelegatedAccount interface for a delegated EOA
     */
    function _getDelegatedEOA(address eoa) internal pure returns (DelegatedAccount) {
        return DelegatedAccount(payable(eoa));
    }

    // ============ EIP-712 Domain Tests ============

    function test_DomainSeparator() public {
        // Simulate EIP-7702 delegation for owner
        _simulateEIP7702Delegation(owner);
        DelegatedAccount delegatedOwner = _getDelegatedEOA(owner);

        // Domain separator should use the implementation contract address
        // (consistent across all delegations, not the user's EOA)
        bytes32 expectedDomainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("DelegatedAccount"),
                keccak256("1"),
                block.chainid,
                address(delegatedAccount) // Implementation contract address
            )
        );

        assertEq(delegatedOwner.domainSeparator(), expectedDomainSeparator);
    }

    // ============ Execute Tests ============

    function test_Execute_ValidSignature() public {
        // Simulate EIP-7702 delegation for owner
        _simulateEIP7702Delegation(owner);
        DelegatedAccount delegatedOwner = _getDelegatedEOA(owner);

        // Use a simple mock contract that just returns success
        MockTarget mockTarget = new MockTarget();

        address destination = address(mockTarget);
        uint256 value = 0;
        bytes memory data = abi.encodeWithSelector(MockTarget.doSomething.selector);
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        // Sign with owner's key - the signature proves owner authorized this action
        bytes memory signature = _signExecuteForEOA(ownerPrivateKey, owner, destination, value, data, nonce, deadline);

        // Execute - can be called by anyone (e.g., relayer), but signature must be from owner
        vm.expectEmit(true, true, false, true);
        emit Executed(owner, destination, value, nonce, true);

        // Call execute on the delegated EOA (not the implementation contract)
        delegatedOwner.execute(destination, value, data, nonce, deadline, signature);

        // Verify nonce incremented
        assertEq(delegatedOwner.getNonce(owner), 1);
        // Verify the call was made
        assertTrue(mockTarget.wasCalled());
    }

    function test_Execute_InvalidSignature() public {
        // Simulate EIP-7702 delegation for owner
        _simulateEIP7702Delegation(owner);
        DelegatedAccount delegatedOwner = _getDelegatedEOA(owner);

        address destination = address(token);
        uint256 value = 0;
        bytes memory data = abi.encodeWithSelector(token.transfer.selector, recipient, 100 ether);
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        // Sign with user's key (wrong signer for owner's delegated EOA)
        bytes memory signature = _signExecuteForEOA(userPrivateKey, owner, destination, value, data, nonce, deadline);

        vm.expectRevert(DelegatedAccount.InvalidSignature.selector);
        delegatedOwner.execute(destination, value, data, nonce, deadline, signature);
    }

    function test_Execute_InvalidNonce() public {
        _simulateEIP7702Delegation(owner);
        DelegatedAccount delegatedOwner = _getDelegatedEOA(owner);

        address destination = address(token);
        uint256 value = 0;
        bytes memory data = abi.encodeWithSelector(token.transfer.selector, recipient, 100 ether);
        uint256 wrongNonce = 5; // Should be 0
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory signature = _signExecuteForEOA(ownerPrivateKey, owner, destination, value, data, wrongNonce, deadline);

        vm.expectRevert(DelegatedAccount.InvalidNonce.selector);
        delegatedOwner.execute(destination, value, data, wrongNonce, deadline, signature);
    }

    function test_Execute_ReplayAttack() public {
        _simulateEIP7702Delegation(owner);
        DelegatedAccount delegatedOwner = _getDelegatedEOA(owner);

        MockTarget mockTarget = new MockTarget();

        address destination = address(mockTarget);
        uint256 value = 0;
        bytes memory data = abi.encodeWithSelector(MockTarget.doSomething.selector);
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory signature = _signExecuteForEOA(ownerPrivateKey, owner, destination, value, data, nonce, deadline);

        // First execution should succeed
        delegatedOwner.execute(destination, value, data, nonce, deadline, signature);

        // Replay should fail
        vm.expectRevert(DelegatedAccount.InvalidNonce.selector);
        delegatedOwner.execute(destination, value, data, nonce, deadline, signature);
    }

    function test_Execute_ExpiredDeadline() public {
        _simulateEIP7702Delegation(owner);
        DelegatedAccount delegatedOwner = _getDelegatedEOA(owner);

        address destination = address(token);
        uint256 value = 0;
        bytes memory data = abi.encodeWithSelector(token.transfer.selector, recipient, 100 ether);
        uint256 nonce = 0;
        uint256 deadline = block.timestamp - 1; // Already expired

        bytes memory signature = _signExecuteForEOA(ownerPrivateKey, owner, destination, value, data, nonce, deadline);

        vm.expectRevert(DelegatedAccount.SignatureExpired.selector);
        delegatedOwner.execute(destination, value, data, nonce, deadline, signature);
    }

    function test_Execute_DeadlineAtCurrentBlock() public {
        _simulateEIP7702Delegation(owner);
        DelegatedAccount delegatedOwner = _getDelegatedEOA(owner);

        MockTarget mockTarget = new MockTarget();

        address destination = address(mockTarget);
        uint256 value = 0;
        bytes memory data = abi.encodeWithSelector(MockTarget.doSomething.selector);
        uint256 nonce = 0;
        uint256 deadline = block.timestamp; // Inclusive deadline

        bytes memory signature = _signExecuteForEOA(ownerPrivateKey, owner, destination, value, data, nonce, deadline);

        // Should succeed - deadline is inclusive
        delegatedOwner.execute(destination, value, data, nonce, deadline, signature);

        assertTrue(mockTarget.wasCalled());
    }

    function test_Execute_ZeroAddressDestination() public {
        _simulateEIP7702Delegation(owner);
        DelegatedAccount delegatedOwner = _getDelegatedEOA(owner);

        address destination = address(0);
        uint256 value = 0;
        bytes memory data = "";
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory signature = _signExecuteForEOA(ownerPrivateKey, owner, destination, value, data, nonce, deadline);

        vm.expectRevert(DelegatedAccount.InvalidDestination.selector);
        delegatedOwner.execute(destination, value, data, nonce, deadline, signature);
    }

    function test_Execute_SelfCallPrevention() public {
        _simulateEIP7702Delegation(owner);
        DelegatedAccount delegatedOwner = _getDelegatedEOA(owner);

        // With EIP-7702, address(this) is the owner's EOA, so self-call = calling owner
        address destination = owner;
        uint256 value = 0;
        bytes memory data = "";
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory signature = _signExecuteForEOA(ownerPrivateKey, owner, destination, value, data, nonce, deadline);

        vm.expectRevert(DelegatedAccount.InvalidDestination.selector);
        delegatedOwner.execute(destination, value, data, nonce, deadline, signature);
    }

    function test_Execute_TargetCallFailure() public {
        _simulateEIP7702Delegation(owner);
        DelegatedAccount delegatedOwner = _getDelegatedEOA(owner);

        // Give tokens to the delegated EOA (owner's address with contract code)
        token.mint(owner, 1000 ether);

        address destination = address(token);
        uint256 value = 0;
        // Try to transfer more than balance
        bytes memory data = abi.encodeWithSelector(token.transfer.selector, recipient, 100_000 ether);
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory signature = _signExecuteForEOA(ownerPrivateKey, owner, destination, value, data, nonce, deadline);

        vm.expectRevert(); // Propagates the ERC20 error
        delegatedOwner.execute(destination, value, data, nonce, deadline, signature);
    }

    function test_Execute_ERC20Transfer_RecipientReceivesTokens() public {
        uint256 transferAmount = 100 ether;

        // Simulate EIP-7702: owner's EOA now has DelegatedAccount code
        _simulateEIP7702Delegation(owner);
        DelegatedAccount delegatedOwner = _getDelegatedEOA(owner);

        // With EIP-7702, the tokens are at the owner's address (their EOA)
        // The owner already has tokens from setUp()

        uint256 ownerBalanceBefore = token.balanceOf(owner);
        uint256 recipientBalanceBefore = token.balanceOf(recipient);

        // Build ERC20 transfer call
        address destination = address(token);
        uint256 value = 0;
        bytes memory data = abi.encodeWithSelector(token.transfer.selector, recipient, transferAmount);
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory signature = _signExecuteForEOA(ownerPrivateKey, owner, destination, value, data, nonce, deadline);

        // Execute - the call originates from owner's address (with delegated code)
        delegatedOwner.execute(destination, value, data, nonce, deadline, signature);

        // Verify recipient received tokens
        assertEq(token.balanceOf(recipient), recipientBalanceBefore + transferAmount, "Recipient should receive tokens");
        // Verify owner's balance decreased
        assertEq(token.balanceOf(owner), ownerBalanceBefore - transferAmount, "Owner balance should decrease");
    }

    function test_Execute_ERC20TransferFrom_UserTokensTransferred() public {
        // This test demonstrates using transferFrom with EIP-7702
        // The delegated EOA calls transferFrom to move tokens from owner to recipient
        uint256 transferAmount = 100 ether;

        // Simulate EIP-7702: owner's EOA now has DelegatedAccount code
        _simulateEIP7702Delegation(owner);
        DelegatedAccount delegatedOwner = _getDelegatedEOA(owner);

        // Owner approves themselves (the delegated EOA) - not strictly needed for transfer()
        // but demonstrates transferFrom pattern
        vm.prank(owner);
        token.approve(owner, transferAmount);

        uint256 ownerBalanceBefore = token.balanceOf(owner);
        uint256 recipientBalanceBefore = token.balanceOf(recipient);

        // Build ERC20 transferFrom call: move tokens from owner to recipient
        address destination = address(token);
        uint256 value = 0;
        bytes memory data = abi.encodeWithSelector(token.transferFrom.selector, owner, recipient, transferAmount);
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory signature = _signExecuteForEOA(ownerPrivateKey, owner, destination, value, data, nonce, deadline);

        // Execute
        delegatedOwner.execute(destination, value, data, nonce, deadline, signature);

        // Verify recipient received tokens
        assertEq(token.balanceOf(recipient), recipientBalanceBefore + transferAmount, "Recipient should receive tokens");
        // Verify owner's balance decreased
        assertEq(token.balanceOf(owner), ownerBalanceBefore - transferAmount, "Owner balance should decrease");
    }

    // ============ EIP-1271 Tests ============

    /// @dev SKIPPED: EIP-1271 with EIP-7702 cannot be tested via vm.etch
    ///      because vm.etch replaces the smart wallet code with DelegatedAccount code,
    ///      making EIP-1271 verification impossible. In production EIP-7702, the delegation
    ///      is per-transaction and doesn't permanently replace the account's code.
    function test_Execute_SmartWalletSignature() public {
        // Skip this test - see dev comment above
        vm.skip(true);

        // For EIP-1271 with EIP-7702, the smart wallet's address would be delegated
        // and the signature verification uses EIP-1271 on address(this)
        _simulateEIP7702Delegation(address(smartWallet));
        DelegatedAccount delegatedWallet = _getDelegatedEOA(address(smartWallet));

        MockTarget mockTarget = new MockTarget();

        address destination = address(mockTarget);
        uint256 value = 0;
        bytes memory data = abi.encodeWithSelector(MockTarget.doSomething.selector);
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        // Sign with owner's key (smart wallet owner)
        bytes memory signature = _signExecuteForEOA(ownerPrivateKey, address(smartWallet), destination, value, data, nonce, deadline);

        // Execute - signature verification should use EIP-1271
        delegatedWallet.execute(destination, value, data, nonce, deadline, signature);

        // Verify nonce incremented
        assertEq(delegatedWallet.getNonce(address(smartWallet)), 1);
        assertTrue(mockTarget.wasCalled());
    }

    // ============ Token Transfer Tests ============

    function test_TransferToken() public {
        // transferToken is a separate function that doesn't require EIP-7702
        // It uses msg.sender directly
        uint256 amount = 100 ether;

        vm.startPrank(user);
        token.approve(address(delegatedAccount), amount);

        vm.expectEmit(true, true, true, true);
        emit TokenTransferred(address(token), user, recipient, amount);

        delegatedAccount.transferToken(address(token), recipient, amount);
        vm.stopPrank();

        assertEq(token.balanceOf(recipient), amount);
    }

    function test_TransferToken_InvalidToken() public {
        vm.prank(user);
        vm.expectRevert(DelegatedAccount.InvalidToken.selector);
        delegatedAccount.transferToken(address(0), recipient, 100 ether);
    }

    function test_TransferToken_InvalidDestination() public {
        vm.prank(user);
        vm.expectRevert(DelegatedAccount.InvalidDestination.selector);
        delegatedAccount.transferToken(address(token), address(0), 100 ether);
    }

    function test_TransferToken_InsufficientBalance() public {
        uint256 amount = 10_000 ether; // More than balance

        vm.startPrank(user);
        token.approve(address(delegatedAccount), amount);

        vm.expectRevert(); // SafeERC20 will revert
        delegatedAccount.transferToken(address(token), recipient, amount);
        vm.stopPrank();
    }

    // ============ ETH Handling Tests ============

    function test_Execute_WithETHValue() public {
        _simulateEIP7702Delegation(owner);
        DelegatedAccount delegatedOwner = _getDelegatedEOA(owner);

        MockTarget mockTarget = new MockTarget();

        // Fund the owner's EOA (which now has delegated code) with ETH
        vm.deal(owner, 10 ether);

        address destination = address(mockTarget);
        uint256 value = 1 ether;
        bytes memory data = abi.encodeWithSelector(MockTarget.receiveEth.selector);
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory signature = _signExecuteForEOA(ownerPrivateKey, owner, destination, value, data, nonce, deadline);

        uint256 ownerBalanceBefore = owner.balance;
        uint256 targetBalanceBefore = address(mockTarget).balance;

        // Execute transfer with ETH value
        delegatedOwner.execute(destination, value, data, nonce, deadline, signature);

        // Verify ETH was transferred
        assertEq(owner.balance, ownerBalanceBefore - value, "Owner ETH balance should decrease");
        assertEq(address(mockTarget).balance, targetBalanceBefore + value, "Target should receive ETH");
        assertEq(mockTarget.ethReceived(), value, "Target should record ETH received");
        assertTrue(mockTarget.wasCalled(), "Target function should be called");
    }

    function test_Execute_InsufficientETH() public {
        _simulateEIP7702Delegation(owner);
        DelegatedAccount delegatedOwner = _getDelegatedEOA(owner);

        MockTarget mockTarget = new MockTarget();

        // Don't fund the owner - they have 0 ETH
        vm.deal(owner, 0);

        address destination = address(mockTarget);
        uint256 value = 1 ether; // Try to send 1 ETH with 0 balance
        bytes memory data = abi.encodeWithSelector(MockTarget.receiveEth.selector);
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory signature = _signExecuteForEOA(ownerPrivateKey, owner, destination, value, data, nonce, deadline);

        // Should fail due to insufficient balance
        vm.expectRevert();
        delegatedOwner.execute(destination, value, data, nonce, deadline, signature);

        // Nonce should not increment on failure
        assertEq(delegatedOwner.getNonce(owner), 0, "Nonce should not increment on failure");
    }

    function test_ReceiveETH() public {
        _simulateEIP7702Delegation(owner);

        // Test that the delegated EOA can receive ETH via receive()
        uint256 sendAmount = 5 ether;
        uint256 balanceBefore = owner.balance;

        // Send ETH to the delegated EOA
        (bool success,) = owner.call{ value: sendAmount }("");
        assertTrue(success, "ETH transfer should succeed");

        assertEq(owner.balance, balanceBefore + sendAmount, "Owner should receive ETH");
    }

    function test_Execute_ETHTransferToEOA() public {
        _simulateEIP7702Delegation(owner);
        DelegatedAccount delegatedOwner = _getDelegatedEOA(owner);

        // Test sending ETH to an EOA (not a contract)
        address payable ethRecipient = payable(makeAddr("ethRecipient"));

        // Fund the owner's EOA with ETH
        vm.deal(owner, 10 ether);

        uint256 value = 2 ether;
        bytes memory data = ""; // Empty data for simple ETH transfer
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory signature = _signExecuteForEOA(ownerPrivateKey, owner, ethRecipient, value, data, nonce, deadline);

        uint256 ownerBalanceBefore = owner.balance;
        uint256 recipientBalanceBefore = ethRecipient.balance;

        // Execute ETH transfer
        delegatedOwner.execute(ethRecipient, value, data, nonce, deadline, signature);

        // Verify ETH was transferred
        assertEq(owner.balance, ownerBalanceBefore - value, "Owner ETH balance should decrease");
        assertEq(ethRecipient.balance, recipientBalanceBefore + value, "Recipient should receive ETH");
    }

    // ============ Nonce Tests ============

    function test_GetNonce_InitialValue() public {
        _simulateEIP7702Delegation(owner);
        _simulateEIP7702Delegation(user);

        DelegatedAccount delegatedOwner = _getDelegatedEOA(owner);
        DelegatedAccount delegatedUser = _getDelegatedEOA(user);

        assertEq(delegatedOwner.getNonce(owner), 0);
        assertEq(delegatedUser.getNonce(user), 0);
    }

    function test_GetNonce_IncrementsAfterExecution() public {
        _simulateEIP7702Delegation(owner);
        DelegatedAccount delegatedOwner = _getDelegatedEOA(owner);

        MockTarget mockTarget = new MockTarget();

        address destination = address(mockTarget);
        uint256 value = 0;
        bytes memory data = abi.encodeWithSelector(MockTarget.doSomething.selector);
        uint256 deadline = block.timestamp + 1 hours;

        for (uint256 i = 0; i < 5; i++) {
            bytes memory signature = _signExecuteForEOA(
                ownerPrivateKey,
                owner,
                destination,
                value,
                data,
                i, // nonce
                deadline
            );

            delegatedOwner.execute(destination, value, data, i, deadline, signature);
            assertEq(delegatedOwner.getNonce(owner), i + 1);
        }
    }

    // ============ Helper Functions ============

    /**
     * @notice Sign an execute intent for an EIP-7702 delegated EOA
     * @dev The signature is over the Intent struct (without account parameter).
     *      The domain separator uses the implementation contract address.
     * @param privateKey The private key to sign with
     * @param destination Target contract
     * @param value ETH value
     * @param data Calldata
     * @param nonce Replay protection nonce
     * @param deadline Signature expiry
     */
    function _signExecuteForEOA(
        uint256 privateKey,
        address, /* unused - kept for API compatibility */
        address destination,
        uint256 value,
        bytes memory data,
        uint256 nonce,
        uint256 deadline
    )
        internal
        view
        returns (bytes memory)
    {
        // Compute domain separator using implementation contract address
        bytes32 domainSep = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("DelegatedAccount"),
                keccak256("1"),
                block.chainid,
                address(delegatedAccount) // Implementation contract address
            )
        );

        // Intent structure (without account parameter)
        bytes32 structHash =
            keccak256(abi.encode(INTENT_TYPEHASH, destination, value, keccak256(data), nonce, deadline));

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSep, structHash));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    /**
     * @notice Legacy helper for signing (uses implementation contract's domain separator)
     * @dev Kept for backward compatibility with some tests
     */
    function _signExecute(
        uint256 privateKey,
        address, /* account - not used in new signature format */
        address destination,
        uint256 value,
        bytes memory data,
        uint256 nonce,
        uint256 deadline
    )
        internal
        view
        returns (bytes memory)
    {
        bytes32 structHash =
            keccak256(abi.encode(INTENT_TYPEHASH, destination, value, keccak256(data), nonce, deadline));

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", delegatedAccount.domainSeparator(), structHash));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }
}
