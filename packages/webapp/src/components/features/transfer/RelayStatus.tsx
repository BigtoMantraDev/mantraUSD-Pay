import { CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';

import { AddressDisplay } from '@/components/common/AddressDisplay';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppConfig } from '@/hooks';

interface RelayStatusProps {
  /** Current transaction status */
  status: 'authorizing' | 'signing' | 'relaying' | 'success' | 'error';
  /** Transaction hash (if available) */
  txHash?: `0x${string}` | null;
  /** Error message (if status is error) */
  errorMessage?: string | null;
  /** Callback to reset form */
  onReset?: () => void;
  /** Optional retry callback */
  onRetry?: () => void;
}

/**
 * Displays transaction progress during relay flow
 * Shows: authorizing → signing → relaying → confirming → success/error
 */
export function RelayStatus({
  status,
  txHash,
  errorMessage,
  onReset,
  onRetry,
}: RelayStatusProps) {
  const config = useAppConfig();

  const getStatusConfig = () => {
    switch (status) {
      case 'authorizing':
        return {
          icon: <Loader2 className="h-12 w-12 animate-spin text-primary" />,
          title: 'Authorize Delegation',
          description:
            'Sign once to enable gasless transactions for this session',
        };
      case 'signing':
        return {
          icon: <Loader2 className="h-12 w-12 animate-spin text-primary" />,
          title: 'Waiting for Signature',
          description: 'Please sign the transaction in your wallet',
        };
      case 'relaying':
        return {
          icon: <Loader2 className="h-12 w-12 animate-spin text-primary" />,
          title: 'Submitting Transaction',
          description: 'Relaying your transaction to the network...',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="h-12 w-12 text-green-500" />,
          title: 'Transfer Successful!',
          description: 'Your gasless transfer has been completed',
        };
      case 'error':
        return {
          icon: <XCircle className="h-12 w-12 text-destructive" />,
          title: 'Transfer Failed',
          description: errorMessage || 'An error occurred during the transfer',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const explorerUrl = txHash
    ? `${config.urls.explorer}/tx/${txHash}`
    : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Icon & Message */}
        <div className="flex flex-col items-center space-y-4 text-center">
          {statusConfig.icon}
          <div>
            <h3 className="text-lg font-semibold">{statusConfig.title}</h3>
            <p className="text-sm text-muted-foreground">
              {statusConfig.description}
            </p>
          </div>
        </div>

        {/* Transaction Hash */}
        {txHash && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Transaction Hash</Label>
            <div className="flex items-center gap-2">
              <AddressDisplay address={txHash} showCopy />
              {explorerUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {status === 'error' && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {status === 'success' && onReset && (
            <Button onClick={onReset} className="w-full">
              New Transfer
            </Button>
          )}
          {status === 'error' && (
            <>
              {onRetry && (
                <Button onClick={onRetry} className="flex-1">
                  Retry
                </Button>
              )}
              {onReset && (
                <Button onClick={onReset} variant="outline" className="flex-1">
                  Start Over
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Label helper (could be imported from ui/label if available)
function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <label className={className}>{children}</label>;
}
