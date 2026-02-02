import { createRoute } from '@tanstack/react-router';
import {
  AlertTriangle,
  Bug,
  Settings,
  Wallet,
  Network,
  Database,
  RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';

import { AddressDisplay } from '@/components/common/AddressDisplay';
import { PageError } from '@/components/common/PageError';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CHAIN_CONFIGS, SUPPORTED_CHAINS } from '@/config/chains';
import { useAppConfig } from '@/hooks/useAppConfig';

import { Route as rootRoute } from '../__root';

export const devtoolsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/devtools',
  component: DevTools,
});

function DevTools() {
  const chainId = useChainId();
  const { address, isConnected, connector } = useAccount();
  const appConfig = useAppConfig();
  const [showError, setShowError] = useState(false);

  if (showError) {
    return (
      <PageError
        error={new Error('This is a simulated error for testing purposes')}
        title="Simulated Error"
        message="This error was triggered from DevTools to test the error UI."
        onRetry={() => setShowError(false)}
        retryLabel="Dismiss Error"
      />
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-8 pb-32">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-md flex items-center gap-3">
          <Bug className="h-10 w-10" />
          DevTools
        </h1>
        <p className="text-xl text-white/80">
          Development utilities and debugging information.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wallet Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Status
            </CardTitle>
            <CardDescription>Current wallet connection info</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Status</span>
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            {address && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Address</span>
                <AddressDisplay address={address} />
              </div>
            )}
            {connector && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Connector</span>
                <span className="text-sm font-medium">{connector.name}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Network Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Network Status
            </CardTitle>
            <CardDescription>Current network and chain info</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Chain ID</span>
              <span className="font-mono text-sm">{chainId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Network</span>
              <span className="text-sm font-medium">{appConfig.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Type</span>
              <Badge variant={appConfig.isTestnet ? 'secondary' : 'default'}>
                {appConfig.isTestnet ? 'Testnet' : 'Mainnet'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Supported</span>
              <Badge
                variant={appConfig.isSupported ? 'default' : 'destructive'}
              >
                {appConfig.isSupported ? 'Yes' : 'No'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Config Dump */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Chain Configuration
            </CardTitle>
            <CardDescription>Current chain config values</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-zinc-50 p-4 rounded-lg overflow-auto max-h-64">
              {JSON.stringify(appConfig, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Supported Chains */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Supported Chains
            </CardTitle>
            <CardDescription>All configured chains</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {SUPPORTED_CHAINS.map((chain) => {
              const config = CHAIN_CONFIGS[chain.id];
              return (
                <div
                  key={chain.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-zinc-50"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        config?.isTestnet ? 'bg-yellow-400' : 'bg-green-500'
                      }`}
                    />
                    <span className="text-sm font-medium">
                      {config?.name ?? chain.name}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">
                    {chain.id}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Error Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Error Testing
            </CardTitle>
            <CardDescription>Test error handling UI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-600">
              Click the button below to trigger a test error and see the
              PageError component in action.
            </p>
            <Button
              variant="destructive"
              onClick={() => setShowError(true)}
              className="w-full"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Trigger Test Error
            </Button>
            <Separator />
            <p className="text-sm text-zinc-600">
              Or test an actual error boundary:
            </p>
            <ThrowErrorButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Button that throws an error to test error boundaries */
function ThrowErrorButton() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('Test error thrown from DevTools');
  }

  return (
    <Button
      variant="outline"
      onClick={() => setShouldThrow(true)}
      className="w-full"
    >
      <RefreshCw className="h-4 w-4 mr-2" />
      Throw Error (Tests ErrorBoundary)
    </Button>
  );
}
