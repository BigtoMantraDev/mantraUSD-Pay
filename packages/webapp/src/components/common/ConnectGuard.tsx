import * as React from 'react';
import { useAppKit } from '@reown/appkit/react';
import { Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface ConnectGuardProps {
  /** Content to show when wallet is connected */
  children: React.ReactNode;
  /** Custom message when disconnected */
  message?: string;
  /** Custom button text */
  buttonText?: string;
  /** Render as inline element instead of card */
  inline?: boolean;
  /** Additional class name for the wrapper */
  className?: string;
  /** Fallback content to show when disconnected (overrides default UI) */
  fallback?: React.ReactNode;
}

/**
 * Wrapper component that shows a "Connect Wallet" prompt when disconnected.
 * Renders children normally when wallet is connected.
 *
 * @example
 * ```tsx
 * // Basic usage - wraps protected content
 * <ConnectGuard>
 *   <StakeForm />
 * </ConnectGuard>
 *
 * // Custom message
 * <ConnectGuard message="Connect your wallet to view your portfolio">
 *   <Portfolio />
 * </ConnectGuard>
 *
 * // Inline variant
 * <ConnectGuard inline>
 *   <TransferButton />
 * </ConnectGuard>
 *
 * // Custom fallback
 * <ConnectGuard fallback={<LoginPage />}>
 *   <Dashboard />
 * </ConnectGuard>
 * ```
 */
export function ConnectGuard({
  children,
  message = 'Connect your wallet to continue',
  buttonText = 'Connect Wallet',
  inline = false,
  className,
  fallback,
}: ConnectGuardProps) {
  const { isConnected, isConnecting } = useAccount();

  // Show children when connected
  if (isConnected) {
    return <>{children}</>;
  }

  // Custom fallback overrides default UI
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show connecting state
  if (isConnecting) {
    return (
      <div className={cn('flex items-center justify-center p-4', className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Wallet className="h-5 w-5 animate-pulse" />
          <span>Connecting...</span>
        </div>
      </div>
    );
  }

  // Inline variant - just the button
  if (inline) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <span className="text-sm text-muted-foreground">{message}</span>
        <ConnectWalletButton text={buttonText} />
      </div>
    );
  }

  // Card variant - full connect prompt
  return (
    <Card className={cn('bg-white/80 backdrop-blur-sm', className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <Wallet className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-primary mb-2">
          Wallet Required
        </h3>
        <p className="text-muted-foreground mb-6 max-w-sm">{message}</p>
        <ConnectWalletButton text={buttonText} />
      </CardContent>
    </Card>
  );
}

interface ConnectWalletButtonProps {
  text: string;
}

function ConnectWalletButton({ text }: ConnectWalletButtonProps) {
  const { open } = useAppKit();

  return (
    <Button onClick={() => open()} size="lg" className="gap-2">
      <Wallet className="h-4 w-4" />
      {text}
    </Button>
  );
}

/**
 * Higher-order component version of ConnectGuard.
 *
 * @example
 * ```tsx
 * const ProtectedComponent = withConnectGuard(MyComponent, {
 *   message: 'Connect to access this feature',
 * });
 * ```
 */
export function withConnectGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardProps?: Omit<ConnectGuardProps, 'children'>,
) {
  return function WrappedComponent(props: P) {
    return (
      <ConnectGuard {...guardProps}>
        <Component {...props} />
      </ConnectGuard>
    );
  };
}
