// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { DelegatedAccount } from "../src/DelegatedAccount.sol";
import { IDelegatedAccount } from "../src/interfaces/IDelegatedAccount.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";
import { MockSmartWallet } from "./mocks/MockSmartWallet.sol";
import { Test, console } from "forge-std/Test.sol";

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

    bytes32 public constant EXECUTE_TYPEHASH =
        keccak256("ExecuteData(address account,address destination,uint256 value,bytes data,uint256 nonce,uint256 deadline)");

    event Executed(address indexed account, address indexed destination, uint256 value, uint256 nonce, bool success);

    event TokenTransferred(address indexed token, address indexed from, address indexed to, uint256 amount);

    function setUp() public {
        // Create test accounts
        ownerPrivateKey = 0xA11CE;
        owner = vm.addr(ownerPrivateKey);
        userPrivateKey = 0xB0B;
        user = vm.addr(userPrivateKey);
        recipient = makeAddr("recipient");

        // Deploy contracts
        delegatedAccount = new DelegatedAccount();
        token = new MockERC20("Test Token", "TEST", 18);
        smartWallet = new MockSmartWallet(owner);

        // Setup token balances
        token.mint(owner, 1000 ether);
        token.mint(user, 1000 ether);
    }

    // ============ EIP-712 Domain Tests ============

    function test_DomainSeparator() public view {
        bytes32 expectedDomainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("DelegatedAccount"),
                keccak256("1"),
                block.chainid,
                address(delegatedAccount)
            )
        );

        assertEq(delegatedAccount.DOMAIN_SEPARATOR(), expectedDomainSeparator);
    }

    // ============ Execute Tests ============

    function test_Execute_ValidSignature() public {
        // Use a simple mock contract that just returns success
        MockTarget mockTarget = new MockTarget();

        address destination = address(mockTarget);
        uint256 value = 0;
        bytes memory data = abi.encodeWithSelector(MockTarget.doSomething.selector);
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory signature = _signExecute(ownerPrivateKey, owner, destination, value, data, nonce, deadline);

        // Execute - can be called by anyone (e.g., relayer), but signature must be from owner
        vm.expectEmit(true, true, false, true);
        emit Executed(owner, destination, value, nonce, true);

        delegatedAccount.execute(owner, destination, value, data, nonce, deadline, signature);

        // Verify nonce incremented
        assertEq(delegatedAccount.getNonce(owner), 1);
        // Verify the call was made
        assertTrue(mockTarget.wasCalled());
    }

    function test_Execute_InvalidSignature() public {
        address destination = address(token);
        uint256 value = 0;
        bytes memory data = abi.encodeWithSelector(token.transfer.selector, recipient, 100 ether);
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        // Sign with user's key, but try to execute for owner's account
        // The signature will recover to user's address, which won't match owner
        bytes memory signature = _signExecute(
            userPrivateKey, // Signer
            owner,          // Account in signature (won't match recovered signer)
            destination,
            value,
            data,
            nonce,
            deadline
        );

        vm.expectRevert(DelegatedAccount.InvalidSignature.selector);
        delegatedAccount.execute(owner, destination, value, data, nonce, deadline, signature);
    }

    function test_Execute_InvalidNonce() public {
        address destination = address(token);
        uint256 value = 0;
        bytes memory data = abi.encodeWithSelector(token.transfer.selector, recipient, 100 ether);
        uint256 wrongNonce = 5; // Should be 0
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory signature = _signExecute(ownerPrivateKey, owner, destination, value, data, wrongNonce, deadline);

        vm.expectRevert(DelegatedAccount.InvalidNonce.selector);
        delegatedAccount.execute(owner, destination, value, data, wrongNonce, deadline, signature);
    }

    function test_Execute_ReplayAttack() public {
        MockTarget mockTarget = new MockTarget();

        address destination = address(mockTarget);
        uint256 value = 0;
        bytes memory data = abi.encodeWithSelector(MockTarget.doSomething.selector);
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory signature = _signExecute(ownerPrivateKey, owner, destination, value, data, nonce, deadline);

        // First execution should succeed
        delegatedAccount.execute(owner, destination, value, data, nonce, deadline, signature);

        // Replay should fail
        vm.expectRevert(DelegatedAccount.InvalidNonce.selector);
        delegatedAccount.execute(owner, destination, value, data, nonce, deadline, signature);
    }

    function test_Execute_ExpiredDeadline() public {
        address destination = address(token);
        uint256 value = 0;
        bytes memory data = abi.encodeWithSelector(token.transfer.selector, recipient, 100 ether);
        uint256 nonce = 0;
        uint256 deadline = block.timestamp - 1; // Already expired

        bytes memory signature = _signExecute(ownerPrivateKey, owner, destination, value, data, nonce, deadline);

        vm.expectRevert(DelegatedAccount.SignatureExpired.selector);
        delegatedAccount.execute(owner, destination, value, data, nonce, deadline, signature);
    }

    function test_Execute_DeadlineAtCurrentBlock() public {
        MockTarget mockTarget = new MockTarget();

        address destination = address(mockTarget);
        uint256 value = 0;
        bytes memory data = abi.encodeWithSelector(MockTarget.doSomething.selector);
        uint256 nonce = 0;
        uint256 deadline = block.timestamp; // Inclusive deadline

        bytes memory signature = _signExecute(ownerPrivateKey, owner, destination, value, data, nonce, deadline);

        // Should succeed - deadline is inclusive
        delegatedAccount.execute(owner, destination, value, data, nonce, deadline, signature);

        assertTrue(mockTarget.wasCalled());
    }

    function test_Execute_ZeroAddressDestination() public {
        address destination = address(0);
        uint256 value = 0;
        bytes memory data = "";
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory signature = _signExecute(ownerPrivateKey, owner, destination, value, data, nonce, deadline);

        vm.expectRevert(DelegatedAccount.InvalidDestination.selector);
        delegatedAccount.execute(owner, destination, value, data, nonce, deadline, signature);
    }

    function test_Execute_SelfCallPrevention() public {
        address destination = address(delegatedAccount);
        uint256 value = 0;
        bytes memory data = "";
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory signature = _signExecute(ownerPrivateKey, owner, destination, value, data, nonce, deadline);

        vm.expectRevert(DelegatedAccount.InvalidDestination.selector);
        delegatedAccount.execute(owner, destination, value, data, nonce, deadline, signature);
    }

    function test_Execute_TargetCallFailure() public {
        address destination = address(token);
        uint256 value = 0;
        // Try to transfer more than balance
        bytes memory data = abi.encodeWithSelector(token.transfer.selector, recipient, 10_000 ether);
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory signature = _signExecute(ownerPrivateKey, owner, destination, value, data, nonce, deadline);

        vm.expectRevert(); // Propagates the ERC20 error
        delegatedAccount.execute(owner, destination, value, data, nonce, deadline, signature);
    }

    function test_Execute_ERC20Transfer_RecipientReceivesTokens() public {
        uint256 transferAmount = 100 ether;

        // In EIP-7702 context, the user's EOA delegates to DelegatedAccount
        // The execute() call forwards to token.transfer() where msg.sender is the delegating EOA
        // In our test without true EIP-7702, we simulate by:
        // 1. Giving tokens to the DelegatedAccount contract address (simulating user's EOA with delegated code)
        // 2. Having owner sign and "execute" as if their address had delegated code

        // For this test, we'll use a different approach:
        // Give tokens to the "delegatedAccount" address to simulate EIP-7702 delegation
        // where the user's EOA (with DelegatedAccount code) holds the tokens
        token.mint(address(delegatedAccount), transferAmount);

        uint256 contractBalanceBefore = token.balanceOf(address(delegatedAccount));
        uint256 recipientBalanceBefore = token.balanceOf(recipient);

        // Build ERC20 transfer call
        address destination = address(token);
        uint256 value = 0;
        bytes memory data = abi.encodeWithSelector(token.transfer.selector, recipient, transferAmount);
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory signature = _signExecute(ownerPrivateKey, owner, destination, value, data, nonce, deadline);

        // Execute - owner signs, anyone can relay
        // The actual transfer comes from address(delegatedAccount) since that's where execute() runs
        delegatedAccount.execute(owner, destination, value, data, nonce, deadline, signature);

        // Verify recipient received tokens
        assertEq(token.balanceOf(recipient), recipientBalanceBefore + transferAmount, "Recipient should receive tokens");
        // Verify contract balance decreased
        assertEq(
            token.balanceOf(address(delegatedAccount)), contractBalanceBefore - transferAmount, "Contract balance should decrease"
        );
    }

    function test_Execute_ERC20TransferFrom_UserTokensTransferred() public {
        // This test demonstrates the typical gasless relay pattern:
        // User approves DelegatedAccount, then signs execute for transferFrom
        uint256 transferAmount = 100 ether;

        // Owner approves DelegatedAccount to spend their tokens
        vm.prank(owner);
        token.approve(address(delegatedAccount), transferAmount);

        uint256 ownerBalanceBefore = token.balanceOf(owner);
        uint256 recipientBalanceBefore = token.balanceOf(recipient);

        // Build ERC20 transferFrom call: move tokens from owner to recipient
        address destination = address(token);
        uint256 value = 0;
        bytes memory data = abi.encodeWithSelector(token.transferFrom.selector, owner, recipient, transferAmount);
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory signature = _signExecute(ownerPrivateKey, owner, destination, value, data, nonce, deadline);

        // Execute
        delegatedAccount.execute(owner, destination, value, data, nonce, deadline, signature);

        // Verify recipient received tokens
        assertEq(token.balanceOf(recipient), recipientBalanceBefore + transferAmount, "Recipient should receive tokens");
        // Verify owner's balance decreased
        assertEq(token.balanceOf(owner), ownerBalanceBefore - transferAmount, "Owner balance should decrease");
    }

    // ============ EIP-1271 Tests ============

    function test_Execute_SmartWalletSignature() public {
        MockTarget mockTarget = new MockTarget();

        address destination = address(mockTarget);
        uint256 value = 0;
        bytes memory data = abi.encodeWithSelector(MockTarget.doSomething.selector);
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        // Sign with owner's key (smart wallet owner) for the smart wallet account
        bytes memory signature = _signExecute(ownerPrivateKey, address(smartWallet), destination, value, data, nonce, deadline);

        // Execute - signature verification should use EIP-1271
        delegatedAccount.execute(address(smartWallet), destination, value, data, nonce, deadline, signature);

        // Verify nonce incremented
        assertEq(delegatedAccount.getNonce(address(smartWallet)), 1);
        assertTrue(mockTarget.wasCalled());
    }

    // ============ Token Transfer Tests ============

    function test_TransferToken() public {
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
        MockTarget mockTarget = new MockTarget();
        
        // Fund the DelegatedAccount contract with ETH
        vm.deal(address(delegatedAccount), 10 ether);

        address destination = address(mockTarget);
        uint256 value = 1 ether;
        bytes memory data = abi.encodeWithSelector(MockTarget.receiveEth.selector);
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory signature = _signExecute(ownerPrivateKey, owner, destination, value, data, nonce, deadline);

        uint256 contractBalanceBefore = address(delegatedAccount).balance;
        uint256 targetBalanceBefore = address(mockTarget).balance;

        // Execute transfer with ETH value
        delegatedAccount.execute(owner, destination, value, data, nonce, deadline, signature);

        // Verify ETH was transferred
        assertEq(address(delegatedAccount).balance, contractBalanceBefore - value, "Contract ETH balance should decrease");
        assertEq(address(mockTarget).balance, targetBalanceBefore + value, "Target should receive ETH");
        assertEq(mockTarget.ethReceived(), value, "Target should record ETH received");
        assertTrue(mockTarget.wasCalled(), "Target function should be called");
    }

    function test_Execute_InsufficientETH() public {
        MockTarget mockTarget = new MockTarget();
        
        // Don't fund the contract - it has 0 ETH

        address destination = address(mockTarget);
        uint256 value = 1 ether; // Try to send 1 ETH with 0 balance
        bytes memory data = abi.encodeWithSelector(MockTarget.receiveEth.selector);
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory signature = _signExecute(ownerPrivateKey, owner, destination, value, data, nonce, deadline);

        // Should fail due to insufficient balance
        vm.expectRevert();
        delegatedAccount.execute(owner, destination, value, data, nonce, deadline, signature);
        
        // Nonce should not increment on failure
        assertEq(delegatedAccount.getNonce(owner), 0, "Nonce should not increment on failure");
    }

    function test_ReceiveETH() public {
        // Test that the contract can receive ETH via receive()
        uint256 sendAmount = 5 ether;
        uint256 balanceBefore = address(delegatedAccount).balance;

        // Send ETH to the contract
        (bool success,) = address(delegatedAccount).call{value: sendAmount}("");
        assertTrue(success, "ETH transfer should succeed");

        assertEq(address(delegatedAccount).balance, balanceBefore + sendAmount, "Contract should receive ETH");
    }

    function test_Execute_ETHTransferToEOA() public {
        // Test sending ETH to an EOA (not a contract)
        address payable ethRecipient = payable(makeAddr("ethRecipient"));
        
        // Fund the DelegatedAccount contract with ETH
        vm.deal(address(delegatedAccount), 10 ether);

        uint256 value = 2 ether;
        bytes memory data = ""; // Empty data for simple ETH transfer
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory signature = _signExecute(ownerPrivateKey, owner, ethRecipient, value, data, nonce, deadline);

        uint256 contractBalanceBefore = address(delegatedAccount).balance;
        uint256 recipientBalanceBefore = ethRecipient.balance;

        // Execute ETH transfer
        delegatedAccount.execute(owner, ethRecipient, value, data, nonce, deadline, signature);

        // Verify ETH was transferred
        assertEq(address(delegatedAccount).balance, contractBalanceBefore - value, "Contract ETH balance should decrease");
        assertEq(ethRecipient.balance, recipientBalanceBefore + value, "Recipient should receive ETH");
    }

    // ============ Nonce Tests ============

    function test_GetNonce_InitialValue() public view {
        assertEq(delegatedAccount.getNonce(owner), 0);
        assertEq(delegatedAccount.getNonce(user), 0);
        assertEq(delegatedAccount.getNonce(recipient), 0);
    }

    function test_GetNonce_IncrementsAfterExecution() public {
        MockTarget mockTarget = new MockTarget();

        address destination = address(mockTarget);
        uint256 value = 0;
        bytes memory data = abi.encodeWithSelector(MockTarget.doSomething.selector);
        uint256 deadline = block.timestamp + 1 hours;

        for (uint256 i = 0; i < 5; i++) {
            bytes memory signature = _signExecute(
                ownerPrivateKey,
                owner,
                destination,
                value,
                data,
                i, // nonce
                deadline
            );

            delegatedAccount.execute(owner, destination, value, data, i, deadline, signature);
            assertEq(delegatedAccount.getNonce(owner), i + 1);
        }
    }

    // ============ Helper Functions ============

    function _signExecute(
        uint256 privateKey,
        address account,
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
        bytes32 structHash = keccak256(abi.encode(EXECUTE_TYPEHASH, account, destination, value, keccak256(data), nonce, deadline));

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", delegatedAccount.DOMAIN_SEPARATOR(), structHash));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }
}
