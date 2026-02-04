// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC1271 } from "@openzeppelin/contracts/interfaces/IERC1271.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title MockSmartWallet
 * @notice EIP-1271 compliant smart wallet mock for testing
 */
contract MockSmartWallet is IERC1271 {
    using ECDSA for bytes32;

    bytes4 private constant EIP1271_MAGIC_VALUE = 0x1626ba7e;

    address public owner;

    constructor(address _owner) {
        owner = _owner;
    }

    function isValidSignature(bytes32 hash, bytes memory signature) external view override returns (bytes4 magicValue) {
        (address recovered, ECDSA.RecoverError error,) = hash.tryRecover(signature);

        if (error == ECDSA.RecoverError.NoError && recovered == owner) {
            return EIP1271_MAGIC_VALUE;
        }

        return 0xffffffff;
    }
}
