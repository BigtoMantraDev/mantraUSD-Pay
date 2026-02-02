import { useState, useCallback } from 'react';
import type { Abi, Address } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

export type TransactionStatus =
  | 'idle'
  | 'review'
  | 'signing'
  | 'pending'
  | 'success'
  | 'error';

export interface TransactionFlowState {
  status: TransactionStatus;
  txHash?: `0x${string}`;
  error?: Error;
}

export interface UseTransactionFlowOptions {
  /** Callback when transaction is confirmed */
  onSuccess?: (txHash: `0x${string}`) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

export interface UseTransactionFlowReturn {
  /** Current state of the transaction flow */
  state: TransactionFlowState;
  /** Open the review dialog */
  openReview: () => void;
  /** Confirm and execute the transaction */
  confirm: (params: {
    address: Address;
    abi: Abi;
    functionName: string;
    args?: readonly unknown[];
    value?: bigint;
  }) => void;
  /** Reset the flow to idle state */
  reset: () => void;
  /** Manually set an error */
  setError: (error: Error) => void;
  /** Whether a transaction is in progress */
  isPending: boolean;
  /** Whether the transaction was successful */
  isSuccess: boolean;
  /** Whether an error occurred */
  isError: boolean;
}

/**
 * A hook that manages the complete transaction flow:
 * idle → review → signing → pending → success/error
 */
export function useTransactionFlow(
  options: UseTransactionFlowOptions = {},
): UseTransactionFlowReturn {
  const { onSuccess, onError } = options;

  const [state, setState] = useState<TransactionFlowState>({
    status: 'idle',
  });

  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Update state based on wagmi hooks
  const deriveStatus = useCallback((): TransactionStatus => {
    if (state.status === 'review') return 'review';
    if (writeError || receiptError) return 'error';
    if (isConfirmed) return 'success';
    if (isConfirming) return 'pending';
    if (isWritePending) return 'signing';
    if (hash && !isConfirmed && !isConfirming) return 'pending';
    return state.status;
  }, [
    state.status,
    writeError,
    receiptError,
    isConfirmed,
    isConfirming,
    isWritePending,
    hash,
  ]);

  // Sync derived status
  const currentStatus = deriveStatus();

  // Handle success callback
  if (currentStatus === 'success' && hash && state.status !== 'success') {
    setState((prev) => ({ ...prev, status: 'success', txHash: hash }));
    onSuccess?.(hash);
  }

  // Handle error
  const currentError = writeError || receiptError;
  if (currentStatus === 'error' && currentError && state.status !== 'error') {
    setState((prev) => ({
      ...prev,
      status: 'error',
      error: currentError as Error,
    }));
    onError?.(currentError as Error);
  }

  const openReview = useCallback(() => {
    setState({ status: 'review' });
  }, []);

  const confirm = useCallback(
    (params: {
      address: Address;
      abi: Abi;
      functionName: string;
      args?: readonly unknown[];
      value?: bigint;
    }) => {
      setState((prev) => ({ ...prev, status: 'signing' }));
      writeContract({
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args,
        value: params.value,
      });
    },
    [writeContract],
  );

  const reset = useCallback(() => {
    setState({ status: 'idle' });
    resetWrite();
  }, [resetWrite]);

  const setError = useCallback(
    (error: Error) => {
      setState({ status: 'error', error });
      onError?.(error);
    },
    [onError],
  );

  return {
    state: {
      status: currentStatus,
      txHash: hash,
      error: currentError as Error | undefined,
    },
    openReview,
    confirm,
    reset,
    setError,
    isPending:
      currentStatus === 'signing' ||
      currentStatus === 'pending' ||
      currentStatus === 'review',
    isSuccess: currentStatus === 'success',
    isError: currentStatus === 'error',
  };
}
