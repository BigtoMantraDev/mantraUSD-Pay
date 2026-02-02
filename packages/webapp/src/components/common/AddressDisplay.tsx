import { shortenAddress } from '@/lib/shortenAddress';
import { cn } from '@/lib/utils';

import { CopyButton } from './CopyButton';

export interface AddressDisplayProps {
  /** The full address to display */
  address: string;
  /** Number of characters to show at the start (default: 6) */
  startChars?: number;
  /** Number of characters to show at the end (default: 4) */
  endChars?: number;
  /** Whether to show the copy button (default: true) */
  showCopy?: boolean;
  /** Optional className for the container */
  className?: string;
  /** Optional className for the address text */
  textClassName?: string;
  /** Optional link to explorer (if provided, address becomes a link) */
  explorerUrl?: string;
}

/**
 * Displays a shortened blockchain address with optional copy functionality.
 * Can optionally link to a block explorer.
 */
export function AddressDisplay({
  address,
  startChars = 6,
  endChars = 4,
  showCopy = true,
  className,
  textClassName,
  explorerUrl,
}: AddressDisplayProps) {
  const shortened = shortenAddress(address, startChars, endChars);

  const addressElement = explorerUrl ? (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'font-mono text-sm hover:underline text-primary',
        textClassName,
      )}
      title={address}
    >
      {shortened}
    </a>
  ) : (
    <span className={cn('font-mono text-sm', textClassName)} title={address}>
      {shortened}
    </span>
  );

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      {addressElement}
      {showCopy && <CopyButton value={address} size="sm" />}
    </div>
  );
}
