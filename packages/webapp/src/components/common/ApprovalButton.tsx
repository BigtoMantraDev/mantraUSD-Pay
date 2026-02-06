import * as React from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import type { Address, Abi } from 'viem';
import { erc20Abi, maxUint256 } from 'viem';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';

import { Button, type ButtonProps } from '@/components/ui/button';
import { useTokenAllowance } from '@/hooks/useTokenAllowance';
import { cn } from '@/lib/utils';

export interface ApprovalButtonProps extends Omit<
  ButtonProps,
  'onClick' | 'onError'
> {
  /** Token contract address to approve */
  tokenAddress: Address;
  /** Spender address (contract that will spend tokens) */
  spenderAddress: Address;
  /** Amount to approve (in wei). Defaults to max uint256 for unlimited */
  amount?: bigint;
  /** Called when approval is complete */
  onApprovalComplete?: () => void;
  /** Text to show when approval is needed */
  approveText?: string;
  /** Text to show when already approved */
  approvedText?: string;
  /** Force show even when already approved */
  forceShow?: boolean;
  /** Called when approval fails */
  onApprovalError?: (error: Error) => void;
}

type ApprovalState = 'idle' | 'approving' | 'confirming' | 'approved' | 'error';

/**
 * Button that handles ERC20 approve flow automatically.
 * Shows approval status and only appears when approval is needed.
 *
 * @example
 * ```tsx
 * <ApprovalButton
 *   tokenAddress={usdcAddress}
 *   spenderAddress={stakingContract}
 *   amount={parseUnits('100', 6)}
 *   onApprovalComplete={() => setStep('stake')}
 * >
 *   Approve USDC
 * </ApprovalButton>
 * ```
 */
export function ApprovalButton({
  tokenAddress,
  spenderAddress,
  amount = maxUint256,
  onApprovalComplete,
  onApprovalError,
  approveText,
  approvedText = 'Approved',
  forceShow = false,
  children,
  className,
  disabled,
  ...props
}: ApprovalButtonProps) {
  const { address } = useAccount();
  const [state, setState] = React.useState<ApprovalState>('idle');
  const [, setError] = React.useState<Error | null>(null);

  const {
    allowance,
    hasSufficientAllowance,
    isLoading: isCheckingAllowance,
    refetch: refetchAllowance,
  } = useTokenAllowance({
    tokenAddress,
    owner: address,
    spender: spenderAddress,
    watch: true,
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

  // Check if already approved
  const isApproved = React.useMemo(() => {
    if (allowance === undefined) return false;
    return hasSufficientAllowance(amount);
  }, [allowance, hasSufficientAllowance, amount]);

  // Update state based on wagmi hooks
  React.useEffect(() => {
    if (isWritePending) {
      setState('approving');
    } else if (isConfirming && hash) {
      setState('confirming');
    } else if (isConfirmed) {
      setState('approved');
      refetchAllowance();
      onApprovalComplete?.();
    }
  }, [
    isWritePending,
    isConfirming,
    isConfirmed,
    hash,
    refetchAllowance,
    onApprovalComplete,
  ]);

  // Handle errors
  React.useEffect(() => {
    const err = writeError || receiptError;
    if (err) {
      setState('error');
      setError(err);
      onApprovalError?.(err);
    }
  }, [writeError, receiptError, onApprovalError]);

  // Reset when amount or token changes
  React.useEffect(() => {
    if (state === 'approved' || state === 'error') {
      setState('idle');
      setError(null);
      resetWrite();
    }
  }, [tokenAddress, spenderAddress, amount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Don't render if already approved (unless forceShow)
  if (isApproved && !forceShow && state !== 'approved') {
    return null;
  }

  const handleApprove = () => {
    setState('approving');
    setError(null);

    writeContract({
      address: tokenAddress,
      abi: erc20Abi as Abi,
      functionName: 'approve',
      args: [spenderAddress, amount],
    });
  };

  const getButtonContent = () => {
    switch (state) {
      case 'approving':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Waiting for signature...
          </>
        );
      case 'confirming':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Confirming...
          </>
        );
      case 'approved':
        return (
          <>
            <Check className="mr-2 h-4 w-4" />
            {approvedText}
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="mr-2 h-4 w-4" />
            Try Again
          </>
        );
      default:
        if (isCheckingAllowance) {
          return (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          );
        }
        if (isApproved) {
          return (
            <>
              <Check className="mr-2 h-4 w-4" />
              {approvedText}
            </>
          );
        }
        return children || approveText || 'Approve';
    }
  };

  const isDisabled =
    disabled ||
    isCheckingAllowance ||
    state === 'approving' ||
    state === 'confirming' ||
    (isApproved && state !== 'error');

  return (
    <Button
      onClick={handleApprove}
      disabled={isDisabled}
      className={cn(
        state === 'approved' && 'bg-green-600 hover:bg-green-700',
        state === 'error' && 'bg-red-600 hover:bg-red-700',
        className,
      )}
      {...props}
    >
      {getButtonContent()}
    </Button>
  );
}
