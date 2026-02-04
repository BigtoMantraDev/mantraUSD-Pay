// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { DelegatedAccount } from "../src/DelegatedAccount.sol";
import { Script, console } from "forge-std/Script.sol";

/**
 * @title DeployDelegatedAccount
 * @notice Deployment script for DelegatedAccount contract
 * @dev Usage:
 *      # Deploy to local anvil
 *      forge script script/DeployDelegatedAccount.s.sol --rpc-url local --broadcast
 *
 *      # Deploy to MANTRA Dukong testnet
 *      forge script script/DeployDelegatedAccount.s.sol --rpc-url mantra_dukong --broadcast --verify
 *
 *      # Deploy to MANTRA mainnet
 *      forge script script/DeployDelegatedAccount.s.sol --rpc-url mantra_mainnet --broadcast --verify
 *
 *      Required env vars:
 *      - PRIVATE_KEY: Deployer private key
 *      - MANTRA_DUKONG_RPC_URL: Dukong testnet RPC (for testnet)
 *      - MANTRA_MAINNET_RPC_URL: Mainnet RPC (for mainnet)
 *      - BLOCKSCOUT_API_KEY: For contract verification (optional)
 */
contract DeployDelegatedAccount is Script {
    function setUp() public { }

    function run() public returns (DelegatedAccount delegatedAccount) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying DelegatedAccount...");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        delegatedAccount = new DelegatedAccount();

        vm.stopBroadcast();

        console.log("DelegatedAccount deployed at:", address(delegatedAccount));
        console.log("Domain Separator:", vm.toString(delegatedAccount.domainSeparator()));

        return delegatedAccount;
    }
}
