import {
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  AlertCircle,
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

export interface TransactionDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog is closed */
  onOpenChange: (open: boolean) => void;
  /** Current transaction status */
  status: TransactionStatus;
  /** Transaction hash (when available) */
  txHash?: `0x${string}`;
  /** Error object (when status is 'error') */
  error?: Error;
  /** Title shown during review phase */
  title?: string;
  /** Description shown during review phase */
  description?: string;
  /** Custom content to show during review (e.g., transaction details) */
  reviewContent?: ReactNode;
  /** Callback when user confirms the transaction */
  onConfirm: () => void;
  /** Callback to reset/close after completion */
  onReset: () => void;
  /** Label for the confirm button */
  confirmLabel?: string;
  /** Whether to disable closing during pending states */
  preventClose?: boolean;
}

/**
 * A dialog that guides users through the transaction flow:
 * Review → Signing → Pending → Success/Error
 */
export function TransactionDialog({
  open,
  onOpenChange,
  status,
  txHash,
  error,
  title = 'Confirm Transaction',
  description,
  reviewContent,
  onConfirm,
  onReset,
  confirmLabel = 'Confirm',
  preventClose = true,
}: TransactionDialogProps) {
  const appConfig = useAppConfig();

  const explorerUrl = txHash ? appConfig.getExplorerTxUrl(txHash) : undefined;

  // Prevent closing during active transaction states
  const handleOpenChange = (newOpen: boolean) => {
    if (preventClose && (status === 'signing' || status === 'pending')) {
      return;
    }
    onOpenChange(newOpen);
    if (!newOpen && (status === 'success' || status === 'error')) {
      onReset();
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'signing':
        return (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-sm text-zinc-500">
              Please confirm in your wallet...
            </p>
          </div>
        );
      case 'pending':
        return (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-sm text-zinc-500">Transaction pending...</p>
          </div>
        );
      case 'success':
        return (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-sm text-zinc-500">Transaction successful!</p>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center gap-3">
            <XCircle className="h-12 w-12 text-red-500" />
            <p className="text-sm text-red-600 text-center max-w-sm">
              {error?.message || 'Transaction failed'}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          'sm:max-w-md',
          (status === 'signing' || status === 'pending') && '[&>button]:hidden', // Hide close button during active states
        )}
      >
        <DialogHeader>
          <DialogTitle>
            {status === 'success'
              ? 'Transaction Complete'
              : status === 'error'
                ? 'Transaction Failed'
                : title}
          </DialogTitle>
          {status === 'review' && description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="py-6">
          {status === 'review' ? (
            reviewContent || (
              <div className="flex items-center gap-2 p-4 bg-zinc-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-zinc-400 shrink-0" />
                <p className="text-sm text-zinc-600">
                  Review the transaction details before confirming.
                </p>
              </div>
            )
          ) : (
            <div className="flex justify-center">{getStatusIcon()}</div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {status === 'review' && (
            <>
              <Button onClick={onConfirm} className="w-full">
                {confirmLabel}
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

          {(status === 'success' || status === 'error') && (
            <>
              {explorerUrl && status === 'success' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    window.open(explorerUrl, '_blank', 'noopener,noreferrer')
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Explorer
                </Button>
              )}
              <Button
                variant={status === 'error' ? 'default' : 'ghost'}
                onClick={() => {
                  onReset();
                  onOpenChange(false);
                }}
                className="w-full"
              >
                {status === 'error' ? 'Try Again' : 'Close'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
