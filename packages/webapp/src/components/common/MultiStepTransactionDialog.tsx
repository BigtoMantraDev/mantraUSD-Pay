import {
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Circle,
} from 'lucide-react';
import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppConfig } from '@/hooks/useAppConfig';
import type { TransactionStatus } from '@/hooks/useTransactionFlow';
import { cn } from '@/lib/utils';

export interface TransactionStep {
  /** Unique identifier for the step */
  id: string;
  /** Display label for the step */
  label: string;
  /** Optional description */
  description?: string;
  /** Current status of this step */
  status: TransactionStatus;
  /** Transaction hash if available */
  txHash?: `0x${string}`;
  /** Error if step failed */
  error?: Error;
}

export interface MultiStepTransactionDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog is closed */
  onOpenChange: (open: boolean) => void;
  /** Array of transaction steps */
  steps: TransactionStep[];
  /** Index of the current active step */
  currentStepIndex: number;
  /** Title for the dialog */
  title?: string;
  /** Description shown during review phase */
  description?: string;
  /** Custom content to show during review (e.g., transaction details) */
  reviewContent?: ReactNode;
  /** Callback when user confirms the current step */
  onConfirm: () => void;
  /** Callback to reset/close after completion or on error */
  onReset: () => void;
  /** Whether all steps are complete */
  isComplete: boolean;
  /** Whether to disable closing during pending states */
  preventClose?: boolean;
}

/**
 * A dialog for multi-step transaction flows (e.g., approve + execute).
 * Shows a progress indicator and handles each step sequentially.
 */
export function MultiStepTransactionDialog({
  open,
  onOpenChange,
  steps,
  currentStepIndex,
  title = 'Transaction',
  description,
  reviewContent,
  onConfirm,
  onReset,
  isComplete,
  preventClose = true,
}: MultiStepTransactionDialogProps) {
  const appConfig = useAppConfig();
  const currentStep = steps[currentStepIndex];

  // Check if any step is in an active state
  const isAnyStepActive = steps.some(
    (step) => step.status === 'signing' || step.status === 'pending',
  );

  // Check if there's an error
  const hasError = steps.some((step) => step.status === 'error');

  // Prevent closing during active transaction states
  const handleOpenChange = (newOpen: boolean) => {
    if (preventClose && isAnyStepActive) {
      return;
    }
    onOpenChange(newOpen);
    if (!newOpen && (isComplete || hasError)) {
      onReset();
    }
  };

  const getStepIcon = (step: TransactionStep, index: number) => {
    const isActive = index === currentStepIndex;
    const isPast = index < currentStepIndex;

    switch (step.status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'signing':
      case 'pending':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      default:
        if (isPast) {
          return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        }
        return (
          <Circle
            className={cn(
              'h-5 w-5',
              isActive ? 'text-primary' : 'text-zinc-300',
            )}
          />
        );
    }
  };

  const getStepStatus = (step: TransactionStep): string => {
    switch (step.status) {
      case 'signing':
        return 'Waiting for signature...';
      case 'pending':
        return 'Confirming...';
      case 'success':
        return 'Complete';
      case 'error':
        return step.error?.message || 'Failed';
      default:
        return '';
    }
  };

  const showReviewContent =
    currentStep?.status === 'idle' || currentStep?.status === 'review';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn('sm:max-w-lg', isAnyStepActive && '[&>button]:hidden')}
      >
        <DialogHeader>
          <DialogTitle>
            {isComplete
              ? 'Transaction Complete'
              : hasError
                ? 'Transaction Failed'
                : title}
          </DialogTitle>
          {showReviewContent && description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        {/* Steps Progress */}
        <div className="py-4">
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-colors',
                  index === currentStepIndex && !isComplete && !hasError
                    ? 'bg-zinc-50'
                    : 'bg-transparent',
                )}
              >
                {getStepIcon(step, index)}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'font-medium text-sm',
                      step.status === 'error'
                        ? 'text-red-600'
                        : step.status === 'success'
                          ? 'text-green-600'
                          : index <= currentStepIndex
                            ? 'text-zinc-900'
                            : 'text-zinc-400',
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && index === currentStepIndex && (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {step.description}
                    </p>
                  )}
                  {getStepStatus(step) && (
                    <p
                      className={cn(
                        'text-xs mt-0.5',
                        step.status === 'error'
                          ? 'text-red-500'
                          : 'text-zinc-500',
                      )}
                    >
                      {getStepStatus(step)}
                    </p>
                  )}
                  {step.txHash && step.status === 'success' && (
                    <a
                      href={appConfig.getExplorerTxUrl(step.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                    >
                      View transaction
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Review Content (shown before first step starts) */}
        {showReviewContent && reviewContent && (
          <div className="pb-4">{reviewContent}</div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {showReviewContent && (
            <>
              <Button onClick={onConfirm} className="w-full">
                Start Transaction
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </>
          )}

          {isComplete && (
            <Button
              onClick={() => {
                onReset();
                onOpenChange(false);
              }}
              className="w-full"
            >
              Done
            </Button>
          )}

          {hasError && !isAnyStepActive && (
            <>
              <Button onClick={onConfirm} className="w-full">
                Retry
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  onReset();
                  onOpenChange(false);
                }}
                className="w-full"
              >
                Cancel
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
