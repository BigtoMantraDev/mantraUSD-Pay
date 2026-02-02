import { useAppKit } from '@reown/appkit/react';
import { ExternalLink, LogOut, Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useAccount, useBalance, useDisconnect } from 'wagmi';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useAppConfig } from '@/hooks/useAppConfig';
import { shortenAddress } from '@/lib/shortenAddress';
import { cn } from '@/lib/utils';

import { BalanceDisplay } from './BalanceDisplay';

export interface WalletConnectPillProps {
  /** Optional className for the container */
  className?: string;
  /** Vertical layout for narrow containers like mobile drawers */
  vertical?: boolean;
}

/**
 * A wallet connection pill that shows:
 * - Disconnected: "Connect Wallet" button
 * - Connected: Glass pill with balance and address, plus popover menu
 */
export function WalletConnectPill({
  className,
  vertical = false,
}: WalletConnectPillProps) {
  const { open } = useAppKit();
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const appConfig = useAppConfig();

  const [copied, setCopied] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleCopyAddress = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [address]);

  const handleViewExplorer = useCallback(() => {
    if (!address) return;
    const url = appConfig.getExplorerAddressUrl(address);
    window.open(url, '_blank', 'noopener,noreferrer');
    setPopoverOpen(false);
  }, [address, appConfig]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setPopoverOpen(false);
  }, [disconnect]);

  // Disconnected state
  if (!isConnected) {
    return (
      <Button
        onClick={() => open()}
        disabled={isConnecting}
        className={cn('font-bold uppercase tracking-wide', className)}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  // Connected state - Vertical layout for mobile drawer
  if (vertical) {
    return (
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'flex flex-col items-center gap-2 w-full px-4 py-3 rounded-xl',
              'bg-white/10 backdrop-blur-md border border-white/20',
              'hover:bg-white/20 transition-colors cursor-pointer',
              'text-white text-sm',
              className,
            )}
          >
            {/* Top row: Network indicator + Address */}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'h-2 w-2 rounded-full shrink-0',
                  appConfig.isTestnet ? 'bg-yellow-400' : 'bg-green-500',
                )}
              />
              <span className="font-mono text-white/90">
                {address ? shortenAddress(address, 6, 4) : '...'}
              </span>
            </div>

            {/* Bottom row: Balance */}
            {balance && (
              <BalanceDisplay
                value={balance.value}
                decimals={balance.decimals}
                symbol={balance.symbol}
                size="sm"
                displayDecimals={3}
                className="text-white/70"
              />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-56 p-2 text-zinc-950"
          align="center"
          side="top"
          sideOffset={8}
        >
          <div className="space-y-1">
            <button
              onClick={handleCopyAddress}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-zinc-100 transition-colors"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span>{copied ? 'Copied!' : 'Copy Address'}</span>
            </button>
            <button
              onClick={handleViewExplorer}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-zinc-100 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>View on Explorer</span>
            </button>
            <Separator className="my-1" />
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-red-50 text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Disconnect</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Connected state - Horizontal layout (default)
  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full',
            'bg-white/10 backdrop-blur-md border border-white/20',
            'hover:bg-white/20 transition-colors cursor-pointer',
            'text-white text-sm',
            className,
          )}
        >
          {/* Network indicator */}
          <span
            className={cn(
              'h-2 w-2 rounded-full shrink-0',
              appConfig.isTestnet ? 'bg-yellow-400' : 'bg-green-500',
            )}
          />

          {/* Balance */}
          {balance && (
            <>
              <BalanceDisplay
                value={balance.value}
                decimals={balance.decimals}
                symbol={balance.symbol}
                size="sm"
                displayDecimals={3}
                className="text-white"
              />
              <Separator orientation="vertical" className="h-4 bg-white/30" />
            </>
          )}

          {/* Address */}
          <span className="font-mono">
            {address ? shortenAddress(address, 6, 4) : '...'}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-2 text-zinc-950"
        align="end"
        sideOffset={8}
      >
        <div className="space-y-1">
          <button
            onClick={handleCopyAddress}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-zinc-100 transition-colors"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span>{copied ? 'Copied!' : 'Copy Address'}</span>
          </button>
          <button
            onClick={handleViewExplorer}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-zinc-100 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>View on Explorer</span>
          </button>
          <Separator className="my-1" />
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-red-50 text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Disconnect</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
