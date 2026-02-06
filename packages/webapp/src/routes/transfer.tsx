import { createFileRoute } from '@tanstack/react-router';

import { BackendStatus } from '@/components/common/BackendStatus';
import { ConnectGuard } from '@/components/common/ConnectGuard';
import { TransferForm } from '@/components/features/transfer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAppConfig, useTokenBalance } from '@/hooks';
import { formatTokenBalance } from '@/lib/formatTokenBalance';
import { useAccount } from 'wagmi';

/**
 * Transfer Page - Gasless Token Transfers
 * Allows users to send tokens without paying gas fees
 */
// @ts-ignore - Route tree type generation issue
export const Route = createFileRoute('/transfer')({
  component: TransferPage,
});

function TransferPage() {
  const config = useAppConfig();
  const { address } = useAccount();

  // Use mantraUSD token for transfers
  const tokenAddress = config.contracts.mantraUSD;
  const tokenSymbol = 'mantraUSD';

  // Fetch user's mantraUSD balance
  const { balance, decimals, isLoading: balanceLoading } = useTokenBalance({
    owner: address,
    tokenAddress,
  });

  return (
    <ConnectGuard>
      <div className="container max-w-2xl mx-auto py-8 px-4">
        {/* Backend Status Indicator */}
        <div className="mb-4">
          <BackendStatus />
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-2xl">Gasless Transfer</CardTitle>
            <CardDescription>
              Send {tokenSymbol} tokens without paying gas fees. The relayer
              covers transaction costs in exchange for a small service fee.
            </CardDescription>
            {/* Display Balance */}
            {address && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-900">
                    Your {tokenSymbol} Balance:
                  </span>
                  <span className="text-lg font-bold text-blue-700">
                    {balanceLoading
                      ? 'Loading...'
                      : balance !== undefined && decimals !== undefined
                        ? `${formatTokenBalance(balance.toString(), decimals)} ${tokenSymbol}`
                        : '0.00'}
                  </span>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <TransferForm
              tokenAddress={tokenAddress}
              tokenSymbol={tokenSymbol}
              onSuccess={(txHash) => {
                console.log('Transfer successful:', txHash);
              }}
            />
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">How it Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ol className="list-decimal list-inside space-y-1">
              <li>Enter the amount and recipient address</li>
              <li>View the relay fee quote (paid in {tokenSymbol})</li>
              <li>Sign the transfer with your wallet (no gas required)</li>
              <li>Our relayer submits the transaction and pays the gas fees</li>
              <li>Receive confirmation when the transfer completes</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </ConnectGuard>
  );
}
