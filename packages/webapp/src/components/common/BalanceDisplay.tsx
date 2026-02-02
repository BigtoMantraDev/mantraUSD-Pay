import { formatUnits } from 'viem';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface BalanceDisplayProps {
  /** The balance value (as bigint or string from contract) */
  value?: bigint | string;
  /** Token decimals (default: 18) */
  decimals?: number;
  /** Token symbol to display after the value */
  symbol?: string;
  /** Whether the balance is loading */
  isLoading?: boolean;
  /** Number of decimal places to show (default: 4) */
  displayDecimals?: number;
  /** Use compact notation for large numbers (e.g., 1.2M) */
  compact?: boolean;
  /** Optional className for the container */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Formats and displays a token balance with loading state support.
 * Supports compact notation for large numbers.
 */
export function BalanceDisplay({
  value,
  decimals = 18,
  symbol,
  isLoading = false,
  displayDecimals = 4,
  compact = false,
  className,
  size = 'md',
}: BalanceDisplayProps) {
  if (isLoading) {
    const skeletonWidth =
      size === 'sm' ? 'w-16' : size === 'lg' ? 'w-28' : 'w-20';
    const skeletonHeight =
      size === 'sm' ? 'h-4' : size === 'lg' ? 'h-7' : 'h-5';
    return (
      <Skeleton className={cn(skeletonWidth, skeletonHeight, className)} />
    );
  }

  if (value === undefined || value === null) {
    return <span className={cn('text-zinc-400', className)}>—</span>;
  }

  const bigIntValue = typeof value === 'string' ? BigInt(value) : value;
  const formatted = formatUnits(bigIntValue, decimals);
  const numValue = parseFloat(formatted);

  let displayValue: string;

  if (compact && numValue >= 1_000_000) {
    displayValue = new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(numValue);
  } else if (compact && numValue >= 1_000) {
    displayValue = new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(numValue);
  } else {
    // For small numbers, show more precision if needed
    const effectiveDecimals =
      numValue < 0.01 && numValue > 0 ? Math.min(8, decimals) : displayDecimals;

    displayValue = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: effectiveDecimals,
    }).format(numValue);
  }

  const textSize =
    size === 'sm'
      ? 'text-sm'
      : size === 'lg'
        ? 'text-xl font-semibold'
        : 'text-base';

  return (
    <span className={cn('tabular-nums', textSize, className)}>
      {displayValue}
      {symbol && <span className="ml-1 text-zinc-500">{symbol}</span>}
    </span>
  );
}
