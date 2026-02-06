import { AlertCircle, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { type Address } from 'viem';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeeQuote, type FeeQuote } from '@/hooks';
import { formatTokenBalance } from '@/lib/formatTokenBalance';

interface FeeDisplayProps {
  /** Token address for transfer */
  tokenAddress?: Address;
  /** Amount to transfer in wei */
  amount?: string;
  /** Recipient address */
  recipient?: Address;
  /** Sender address (optional for better gas estimation) */
  sender?: Address;
  /** Callback when fee quote is loaded */
  onFeeQuoteLoaded?: (quote: FeeQuote) => void;
  /** Whether to enable fetching */
  enabled?: boolean;
}

/**
 * Displays fee quote from backend relayer
 * Shows amount, expiration countdown, and refresh button
 */
export function FeeDisplay({
  tokenAddress,
  amount,
  recipient,
  sender,
  onFeeQuoteLoaded,
  enabled = true,
}: FeeDisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const {
    data: feeQuote,
    isLoading,
    isError,
    error,
    refetch,
    dataUpdatedAt,
  } = useFeeQuote(tokenAddress, amount, recipient, sender, enabled);

  // Update time remaining every second
  useEffect(() => {
    if (!feeQuote) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = feeQuote.deadline - now;
      setTimeRemaining(Math.max(0, remaining));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [feeQuote]);

  // Notify parent when quote is loaded
  useEffect(() => {
    if (feeQuote && onFeeQuoteLoaded) {
      onFeeQuoteLoaded(feeQuote);
    }
  }, [feeQuote, onFeeQuoteLoaded]);

  // Calculate staleness (show warning after 8s of 10s stale time)
  const isStale =
    feeQuote && dataUpdatedAt && Date.now() - dataUpdatedAt > 8000;

  if (!enabled || (!tokenAddress && !amount)) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error?.message || 'Failed to fetch fee quote'}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="ml-2"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!feeQuote) {
    return null;
  }

  return (
    <Card className={isStale ? 'border-yellow-500' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Relay Fee</div>
            <div className="text-lg font-semibold">
              {formatTokenBalance(feeQuote.feeAmount, 6)} mantraUSD
            </div>
            {timeRemaining !== null && (
              <div
                className={`text-xs ${
                  timeRemaining < 60
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}
              >
                {timeRemaining > 0
                  ? `Expires in ${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`
                  : 'Quote expired'}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            title="Refresh fee quote"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
        {isStale && (
          <Alert variant="default" className="mt-3">
            <AlertDescription className="text-xs">
              Quote may be outdated. Click refresh for latest fee.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
