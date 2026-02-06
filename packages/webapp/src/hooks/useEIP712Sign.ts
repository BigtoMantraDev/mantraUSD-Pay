import { type Address, type TypedDataDomain, encodeFunctionData } from 'viem';
import { useSignTypedData } from 'wagmi';

import { useAppConfig } from './useAppConfig';
import { type ExecuteData } from './useRelayTransaction';
import { type FeeQuote } from './useFeeQuote';

/**
 * EIP-712 typed data structure for Intent
 * This matches the contract's INTENT_TYPEHASH (without account parameter)
 */
const INTENT_TYPES = {
  Intent: [
    { name: 'destination', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

/**
 * EIP-712 typed data structure for BatchedIntent
 * This matches the contract's BATCHED_INTENT_TYPEHASH
 */
const BATCHED_INTENT_TYPES = {
  BatchedIntent: [
    { name: 'calls', type: 'Call[]' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
  Call: [
    { name: 'destination', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes' },
  ],
} as const;

/**
 * Call structure for batch execution
 */
interface Call {
  destination: Address;
  value: bigint;
  data: `0x${string}`;
}

/**
 * Hook to sign ExecuteData using EIP-712 for EIP-7702 delegation
 *
 * The verifyingContract is the DelegatedAccount implementation contract.
 * Even though the code runs at the user's EOA via EIP-7702 delegation,
 * signatures reference the implementation for consistency.
 *
 * @example
 * const { signExecuteData } = useEIP712Sign();
 * const signature = await signExecuteData(executeData);
 */
export function useEIP712Sign() {
  const config = useAppConfig();

  const signTypedData = useSignTypedData();

  /**
   * Get the EIP-712 domain
   * Uses DelegatedAccount implementation as verifyingContract
   */
  const getDomain = (): TypedDataDomain => ({
    name: 'DelegatedAccount',
    version: '1',
    chainId: config.chainId,
    verifyingContract: config.contracts.delegatedAccount,
  });

  /**
   * Sign execute data with EIP-712
   * Converts ExecuteData to Intent format expected by contract
   * @param executeData - Data to sign
   * @returns Promise<`0x${string}`> - Signature in hex format
   */
  const signExecuteData = async (
    executeData: ExecuteData,
  ): Promise<`0x${string}`> => {
    // Encode ERC20 transfer call
    const transferData = encodeFunctionData({
      abi: [
        {
          name: 'transfer',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [{ name: '', type: 'bool' }],
        },
      ],
      functionName: 'transfer',
      args: [executeData.to, executeData.amount],
    });

    // Convert to Intent structure (matches contract's INTENT_TYPEHASH)
    const intent = {
      destination: executeData.token,
      value: 0n,
      data: transferData,
      nonce: executeData.nonce,
      deadline: executeData.deadline,
    };

    // Get domain with DelegatedAccount as verifyingContract
    const domain = getDomain();

    return signTypedData.signTypedDataAsync({
      domain,
      types: INTENT_TYPES,
      primaryType: 'Intent',
      message: intent,
    });
  };

  /**
   * Sign batched intent with EIP-712 for transfers with fees
   * Creates batch with user transfer + fee transfer to relayer
   * @param executeData - Execute data containing transfer details
   * @param feeQuote - Fee quote from backend containing fee amount and relayer address
   * @returns Promise<`0x${string}`> - Signature in hex format
   */
  const signBatchedIntent = async (
    executeData: ExecuteData,
    feeQuote: FeeQuote,
  ): Promise<`0x${string}`> => {
    // Encode user's ERC20 transfer call
    const userTransferData = encodeFunctionData({
      abi: [
        {
          name: 'transfer',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [{ name: '', type: 'bool' }],
        },
      ],
      functionName: 'transfer',
      args: [executeData.to, executeData.amount],
    });

    // Encode fee transfer call to relayer
    const feeTransferData = encodeFunctionData({
      abi: [
        {
          name: 'transfer',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [{ name: '', type: 'bool' }],
        },
      ],
      functionName: 'transfer',
      args: [feeQuote.relayerAddress, BigInt(feeQuote.feeAmount)],
    });

    // Build calls array: user transfer first, then fee transfer
    const calls: Call[] = [
      {
        destination: executeData.token,
        value: 0n,
        data: userTransferData,
      },
      {
        destination: feeQuote.feeToken,
        value: 0n,
        data: feeTransferData,
      },
    ];

    // Create BatchedIntent message
    const batchedIntent = {
      calls,
      nonce: executeData.nonce,
      deadline: executeData.deadline,
    };

    const domain = getDomain();

    return signTypedData.signTypedDataAsync({
      domain,
      types: BATCHED_INTENT_TYPES,
      primaryType: 'BatchedIntent',
      message: batchedIntent,
    });
  };

  // Default domain for reference
  const domain = getDomain();

  return {
    ...signTypedData,
    signExecuteData,
    signBatchedIntent,
    getDomain,
    domain,
  };
}

/**
 * Type-safe signature encoding helpers
 * EIP-712 signatures are already in the correct format from wagmi
 */
export function encodeSignature(signature: `0x${string}`): {
  r: `0x${string}`;
  s: `0x${string}`;
  v: number;
} {
  // Signature format: 0x + r(64) + s(64) + v(2)
  if (signature.length !== 132) {
    throw new Error('Invalid signature length');
  }

  const r = `0x${signature.slice(2, 66)}` as `0x${string}`;
  const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
  const v = parseInt(signature.slice(130, 132), 16);

  return { r, s, v };
}
