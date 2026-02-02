import { TooltipProvider } from '@radix-ui/react-tooltip';
import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
} from '@tanstack/react-query';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useMemo } from 'react';
import { WagmiProvider } from 'wagmi';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Navbar } from '@/components/common/Navbar';
import { CartoonBackground } from '@/components/scene/CartoonBackground';
import { Toaster } from '@/components/ui/toaster';
import { wagmiConfig } from '@/config/wagmi';
import { useToast } from '@/hooks/use-toast';

function App() {
  const { toast } = useToast();

  const queryClient = useMemo(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onError: (error) =>
            toast({
              variant: 'destructive',
              title: error.name,
              description: error.message,
            }),
        }),
      }),
    [toast],
  );

  return (
    <>
      {/* Background - z-[-1] */}
      <CartoonBackground />

      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <TooltipProvider>
            {/* Fixed Navbar - z-50 */}
            <div className="fixed top-0 left-0 right-0 z-50 p-2 sm:p-4 md:p-6">
              <div className="container mx-auto">
                <Navbar />
              </div>
            </div>

            {/* Content - z-10 */}
            <div className="relative z-10 pt-24 sm:pt-32 pb-20 px-2 sm:px-4 lg:px-6">
              <div className="mx-auto max-w-7xl">
                <ErrorBoundary>
                  <Outlet />
                </ErrorBoundary>
              </div>
            </div>
          </TooltipProvider>
        </WagmiProvider>
      </QueryClientProvider>

      <Toaster />
    </>
  );
}

export const Route = createRootRoute({
  component: App,
});
