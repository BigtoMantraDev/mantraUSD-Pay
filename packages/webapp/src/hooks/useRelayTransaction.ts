import { useMutation } from '@tanstack/react-query';
import { type Address, encodeFunctionData } from 'viem';

import { useAppConfig } from './useAppConfig';
import type { SignedAuthorization } from './useSignAuthorization';

/**
 * Execute data for EIP-712 signed transaction
 */
export interface ExecuteData {
  /** Token owner address */
  owner: Address;
  /** Token to transfer */
  token: Address;
  /** Amount to transfer in wei */
  amount: bigint;
  /** Recipient address */
  to: Address;
  /** Fee amount in wei */
  feeAmount: bigint;
  /** Fee token address */
  feeToken: Address;
  /** Transaction deadline (seconds) */
  deadline: bigint;
  /** Owner's nonce for replay protection */
  nonce: bigint;
}

/**
 * Relay request payload
 */
export interface RelayRequest {
  /** Execute data */
  executeData: ExecuteData;
  /** Owner's EIP-712 signature */
  ownerSignature: `0x${string}`;
  /** Backend's fee quote signature */
  feeSignature: `0x${string}`;
  /** EIP-7702 authorization (optional - for first-time or session-expired users) */
  authorization?: SignedAuthorization;
}

/**
 * Relay response from backend
 */
export interface RelayResponse {
  /** Transaction hash */
  txHash: `0x${string}`;
  /** Status message */
  status: 'pending' | 'confirmed' | 'failed';
}

/**
 * Hook to relay signed transaction to backend
 * Returns mutation for submitting relay request
 *
 * Supports EIP-7702 authorization for gasless transactions:
 * - First-time users must provide authorization to delegate their EOA
 * - Returning users with valid session can skip authorization
 */
export function useRelayTransaction() {
  const config = useAppConfig();

  return useMutation({
    mutationFn: async (request: RelayRequest): Promise<RelayResponse> => {
      // Encode ERC20 transfer function call
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
        args: [request.executeData.to, request.executeData.amount],
      });

      // Convert to backend expected format with EIP-7702 authorization
      const payload: Record<string, unknown> = {
        userAddress: request.executeData.owner,
        signature: request.ownerSignature,
        intent: {
          destination: request.executeData.token,
          value: '0x0',
          data: transferData,
          nonce: request.executeData.nonce.toString(),
          deadline: request.executeData.deadline.toString(),
        },
        chainId: config.chainId,
      };

      // Include EIP-7702 authorization if provided
      if (request.authorization) {
        payload.authorization = {
          chainId: request.authorization.chainId,
          contractAddress: request.authorization.contractAddress,
          nonce: request.authorization.nonce,
          r: request.authorization.r,
          s: request.authorization.s,
          yParity: request.authorization.yParity,
        };
      }

      const response = await fetch(`${config.backend.url}/relay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: 'Failed to relay transaction',
        }));
        throw new Error(error.message || 'Failed to relay transaction');
      }

      return response.json();
    },
    retry: false, // Don't retry on failure (signature may be invalid)
  });
}
