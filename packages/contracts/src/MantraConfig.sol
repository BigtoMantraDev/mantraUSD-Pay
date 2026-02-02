// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";

/**
 * @title MantraConfig
 * @notice Configuration helper for MANTRA chain deployments
 * @dev Provides chain-specific addresses and configuration for local, testnet, and mainnet
 */
contract MantraConfig is Script {
    // Chain identifiers
    uint256 public constant LOCAL_CHAIN_ID = 1337;
    uint256 public constant MANTRA_MAINNET_CHAIN_ID = 5888;
    uint256 public constant MANTRA_DUKONG_CHAIN_ID = 5887;

    // Important contract addresses struct
    struct ChainAddresses {
        address hsc;
        address create2Factory;
        address createx;
        address multicall3;
        address wrappedOM;
    }

    /**
     * @notice Get addresses for MANTRA Mainnet
     */
    function getMainnetAddresses() public pure returns (ChainAddresses memory) {
        return ChainAddresses({
            hsc: 0x0000F90827F1C53a10cb7A02335B175320002935,
            create2Factory: 0x4e59b44847b379578588920cA78FbF26c0B4956C,
            createx: 0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed,
            multicall3: 0xcA11bde05977b3631167028862bE2a173976CA11,
            wrappedOM: 0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598
        });
    }

    /**
     * @notice Get addresses for MANTRA Dukong Testnet
     */
    function getDukongAddresses() public pure returns (ChainAddresses memory) {
        return ChainAddresses({
            hsc: 0x0000F90827F1C53a10cb7A02335B175320002935,
            create2Factory: 0x4e59b44847b379578588920cA78FbF26c0B4956C,
            createx: 0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed,
            multicall3: 0xcA11bde05977b3631167028862bE2a173976CA11,
            wrappedOM: 0x10d26F0491fA11c5853ED7C1f9817b098317DC46
        });
    }

    /**
     * @notice Get addresses for Local Development
     * @dev Returns zero addresses for local deployment - deploy your own contracts
     */
    function getLocalAddresses() public pure returns (ChainAddresses memory) {
        return ChainAddresses({
            hsc: 0x0000F90827F1C53a10cb7A02335B175320002935,
            create2Factory: 0x4e59b44847b379578588920cA78FbF26c0B4956C,
            createx: 0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed,
            multicall3: 0xcA11bde05977b3631167028862bE2a173976CA11,
            wrappedOM: address(0)
        });
    }

    /**
     * @notice Get chain-specific addresses based on chain ID
     * @param chainId The chain ID to get addresses for
     */
    function getChainAddresses(uint256 chainId) public pure returns (ChainAddresses memory) {
        if (chainId == MANTRA_MAINNET_CHAIN_ID) {
            return getMainnetAddresses();
        } else if (chainId == MANTRA_DUKONG_CHAIN_ID) {
            return getDukongAddresses();
        } else if (chainId == LOCAL_CHAIN_ID) {
            return getLocalAddresses();
        } else {
            revert("Unsupported chain ID");
        }
    }

    /**
     * @notice Get chain-specific addresses for current chain
     */
    function getCurrentChainAddresses() public view returns (ChainAddresses memory) {
        return getChainAddresses(block.chainid);
    }

    /**
     * @notice Get chain name from chain ID
     */
    function getChainName(uint256 chainId) public pure returns (string memory) {
        if (chainId == MANTRA_MAINNET_CHAIN_ID) {
            return "MANTRA Mainnet";
        } else if (chainId == MANTRA_DUKONG_CHAIN_ID) {
            return "MANTRA Dukong Testnet";
        } else if (chainId == LOCAL_CHAIN_ID) {
            return "Local Development";
        } else {
            return "Unknown Chain";
        }
    }

    /**
     * @notice Check if chain is a testnet
     */
    function isTestnet(uint256 chainId) public pure returns (bool) {
        return chainId == MANTRA_DUKONG_CHAIN_ID || chainId == LOCAL_CHAIN_ID;
    }

    /**
     * @notice Get Blockscout explorer URL for an address
     */
    function getExplorerUrl(uint256 chainId, address addr) public pure returns (string memory) {
        string memory addressStr = vm.toString(addr);
        
        if (chainId == MANTRA_MAINNET_CHAIN_ID) {
            return string.concat("https://blockscout.mantrascan.io/address/", addressStr);
        } else if (chainId == MANTRA_DUKONG_CHAIN_ID) {
            return string.concat("https://explorer.dukong.io/address/", addressStr);
        } else {
            return string.concat("http://localhost:8545/address/", addressStr);
        }
    }

    /**
     * @notice Get Blockscout explorer URL for a transaction
     */
    function getTransactionUrl(uint256 chainId, bytes32 txHash) public pure returns (string memory) {
        string memory txHashStr = vm.toString(txHash);
        
        if (chainId == MANTRA_MAINNET_CHAIN_ID) {
            return string.concat("https://blockscout.mantrascan.io/tx/", txHashStr);
        } else if (chainId == MANTRA_DUKONG_CHAIN_ID) {
            return string.concat("https://explorer.dukong.io/tx/", txHashStr);
        } else {
            return string.concat("http://localhost:8545/tx/", txHashStr);
        }
    }
}
