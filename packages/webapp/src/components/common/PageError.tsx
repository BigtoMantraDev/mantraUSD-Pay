import { AlertTriangle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface PageErrorProps {
  /** The error object */
  error?: Error;
  /** Custom title */
  title?: string;
  /** Custom message */
  message?: string;
  /** Callback for reload/retry action */
  onRetry?: () => void;
  /** Label for retry button */
  retryLabel?: string;
  /** Whether to show technical error details (dev mode) */
  showDetails?: boolean;
  /** Optional className for the container */
  className?: string;
}

/**
 * A full-page error component that displays a friendly error message
 * with an option to reload or retry.
 */
export function PageError({
  error,
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again.',
  onRetry,
  retryLabel = 'Reload Page',
  showDetails = import.meta.env.DEV,
  className,
}: PageErrorProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center min-h-[400px] p-6',
        className,
      )}
    >
      <Card className="max-w-md w-full text-center">
        <CardHeader className="pb-2">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-zinc-600">{message}</p>

          {showDetails && error && (
            <div className="text-left p-3 bg-zinc-50 rounded-lg border">
              <p className="text-xs font-medium text-zinc-500 mb-1">
                Error Details
              </p>
              <p className="text-sm font-mono text-red-600 break-all">
                {error.message}
              </p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-700">
                    Show stack trace
                  </summary>
                  <pre className="mt-2 text-xs text-zinc-600 overflow-auto max-h-40 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <Button onClick={handleRetry} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            {retryLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
