import * as React from 'react';
import { Droplets, ExternalLink } from 'lucide-react';
import { parseEther, formatEther } from 'viem';
import type { Address, Abi } from 'viem';
import { useAccount, useBalance } from 'wagmi';

import { AddressDisplay } from '@/components/common/AddressDisplay';
import { ConnectGuard } from '@/components/common/ConnectGuard';
import { TransactionDialog } from '@/components/common/TransactionDialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useTransactionFlow } from '@/hooks/useTransactionFlow';
import { cn } from '@/lib/utils';

/**
 * Example faucet ABI - replace with your actual faucet contract ABI
 */
const FAUCET_ABI = [
  {
    name: 'drip',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'dripAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export interface FaucetCardProps {
  /** Faucet contract address */
  faucetAddress: Address;
  /** Token symbol */
  tokenSymbol?: string;
  /** Amount to drip (in wei) - if not using contract's dripAmount */
  dripAmount?: bigint;
  /** Cooldown period in seconds */
  cooldownSeconds?: number;
  /** Additional class name */
  className?: string;
}

/**
 * FaucetCard - Example feature component demonstrating best practices.
 *
 * This component shows:
 * - ConnectGuard for wallet requirement
 * - TransactionDialog for proper tx flow
 * - useAppConfig for chain-aware configuration
 * - useTransactionFlow for state management
 * - Proper loading and error states
 *
 * @example
 * ```tsx
 * <FaucetCard
 *   faucetAddress="0x..."
 *   tokenSymbol="OM"
 *   dripAmount={parseEther('10')}
 * />
 * ```
 */
export function FaucetCard({
  faucetAddress,
  tokenSymbol = 'OM',
  dripAmount = parseEther('10'),
  cooldownSeconds = 86400, // 24 hours
  className,
}: FaucetCardProps) {
  const { address } = useAccount();
  const config = useAppConfig();

  // Get user's current balance
  const { data: balance, refetch: refetchBalance } = useBalance({
    address,
  });

  // Transaction flow for the drip
  const { state, openReview, confirm, reset, isPending, isSuccess } =
    useTransactionFlow({
      onSuccess: () => {
        // Refetch balance after successful drip
        refetchBalance();
      },
    });

  const handleDrip = () => {
    confirm({
      address: faucetAddress,
      abi: FAUCET_ABI as Abi,
      functionName: 'drip',
      args: [],
    });
  };

  const formattedDripAmount = formatEther(dripAmount);
  const formattedCooldown = formatCooldown(cooldownSeconds);

  return (
    <Card className={cn('bg-white/90 backdrop-blur-sm shadow-lg', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-blue-100 p-2">
            <Droplets className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Testnet Faucet</CardTitle>
            <CardDescription>
              Get free {tokenSymbol} tokens for testing
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <ConnectGuard message="Connect your wallet to claim tokens">
          {/* Faucet Info */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Drip Amount</span>
              <span className="font-medium">
                {formattedDripAmount} {tokenSymbol}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cooldown</span>
              <span className="font-medium">{formattedCooldown}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your Balance</span>
              <span className="font-medium">
                {balance
                  ? `${Number(formatEther(balance.value)).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${balance.symbol}`
                  : '—'}
              </span>
            </div>
          </div>

          {/* Faucet Contract Link */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Faucet Contract:</span>
            <a
              href={config.getExplorerAddressUrl(faucetAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <AddressDisplay address={faucetAddress} showCopy={false} />
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Claim Button */}
          <Button
            onClick={openReview}
            disabled={isPending}
            className="w-full"
            size="lg"
          >
            <Droplets className="mr-2 h-4 w-4" />
            {isPending
              ? 'Claiming...'
              : `Claim ${formattedDripAmount} ${tokenSymbol}`}
          </Button>

          {/* Success message */}
          {isSuccess && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center text-sm text-green-700">
              🎉 Successfully claimed {formattedDripAmount} {tokenSymbol}!
            </div>
          )}
        </ConnectGuard>
      </CardContent>

      {/* Transaction Dialog */}
      <TransactionDialog
        open={
          state.status === 'review' ||
          state.status === 'signing' ||
          state.status === 'pending'
        }
        onOpenChange={(open) => !open && reset()}
        title={`Claim ${tokenSymbol}`}
        description={`You are about to claim ${formattedDripAmount} ${tokenSymbol} from the testnet faucet.`}
        status={state.status}
        txHash={state.txHash}
        error={state.error}
        onConfirm={handleDrip}
        onReset={reset}
        confirmLabel="Claim Tokens"
      />
    </Card>
  );
}

/**
 * Format cooldown seconds into human-readable string
 */
function formatCooldown(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  return `${Math.floor(seconds / 86400)} days`;
}

/**
 * Export a barrel file for features
 */
export default FaucetCard;
