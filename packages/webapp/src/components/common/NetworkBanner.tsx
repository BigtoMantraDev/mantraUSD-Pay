import { AlertTriangle, Info } from 'lucide-react';

import { useAppConfig } from '@/hooks/useAppConfig';
import { cn } from '@/lib/utils';

export interface NetworkBannerProps {
  /** Optional className for the banner */
  className?: string;
}

/**
 * A banner that warns users when they're on a testnet or unsupported network.
 * Only shows when there's something to warn about.
 */
export function NetworkBanner({ className }: NetworkBannerProps) {
  const appConfig = useAppConfig();

  // Don't show anything on supported mainnet
  if (appConfig.isSupported && !appConfig.isTestnet) {
    return null;
  }

  // Unsupported network - red warning
  if (!appConfig.isSupported) {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-2 px-4 py-2',
          'bg-red-500 text-white text-sm font-medium',
          className,
        )}
      >
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          You are connected to an unsupported network. Please switch to a
          supported network.
        </span>
      </div>
    );
  }

  // Testnet - yellow info
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 px-4 py-2',
        'bg-yellow-400 text-yellow-900 text-sm font-medium',
        className,
      )}
    >
      <Info className="h-4 w-4 shrink-0" />
      <span>
        You are on <strong>{appConfig.name}</strong> (testnet). Tokens have no
        real value.
      </span>
    </div>
  );
}
