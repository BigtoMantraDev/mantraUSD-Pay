import { useState, useEffect, useCallback } from 'react';
import { type Address, isAddress } from 'viem';
import { useAccount } from 'wagmi';

import { TokenInput } from '@/components/common/TokenInput';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useNonce,
  useEIP712Sign,
  useRelayTransaction,
  useTokenBalance,
  useSignAuthorization,
  type FeeQuote,
  type ExecuteData,
} from '@/hooks';

import { FeeDisplay } from './FeeDisplay';
import { RelayStatus } from './RelayStatus';

interface TransferFormProps {
  /** Token address to transfer */
  tokenAddress: Address;
  /** Token symbol for display */
  tokenSymbol: string;
  /** Callback on successful transfer */
  onSuccess?: (txHash: `0x${string}`) => void;
}

/**
 * Complete transfer form with gasless relay
 * Handles amount input, recipient validation, fee display, and signing
 */
export function TransferForm({
  tokenAddress,
  tokenSymbol,
  onSuccess,
}: TransferFormProps) {
  const { address: userAddress } = useAccount();

  // Form state
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amountWei, setAmountWei] = useState<bigint | undefined>();
  const [feeQuote, setFeeQuote] = useState<FeeQuote | null>(null);

  // Transaction state
  const [status, setStatus] = useState<
    'idle' | 'authorizing' | 'signing' | 'relaying' | 'success' | 'error'
  >('idle');
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Hooks
  const balance = useTokenBalance({
    owner: userAddress,
    tokenAddress,
  });
  const {
    data: nonce,
    isLoading: nonceLoading,
    error: nonceError,
  } = useNonce(userAddress);
  const { signExecuteData, signBatchedIntent } = useEIP712Sign();
  const relayMutation = useRelayTransaction();
  const {
    getOrSignAuthorization,
    getCachedAuthorization,
    isSupported: authSupported,
  } = useSignAuthorization();

  // Validation
  const isValidRecipient = recipient && isAddress(recipient);
  const hasBalance =
    balance?.balance !== undefined && amountWei && amountWei <= balance.balance;
  const isFeeQuoteValid =
    feeQuote && feeQuote.deadline > Math.floor(Date.now() / 1000);
  const canSubmit =
    amountWei &&
    isValidRecipient &&
    hasBalance &&
    isFeeQuoteValid &&
    nonce !== undefined &&
    status === 'idle';

  // Calculate total (amount + fee)
  const totalAmount =
    amountWei && feeQuote ? amountWei + BigInt(feeQuote.feeAmount) : undefined;
  const hasTotalBalance =
    balance?.balance !== undefined &&
    totalAmount &&
    totalAmount <= balance.balance;

  // Reset error on form change
  useEffect(() => {
    if (status === 'error') {
      setStatus('idle');
      setErrorMessage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, recipient]);

  // Handle submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!canSubmit || !userAddress || nonce === undefined || !feeQuote) {
        return;
      }

      try {
        // Step 1: Get or sign EIP-7702 authorization (per-session)
        // If wallet doesn't support EIP-7702, we proceed without authorization
        let authorization = getCachedAuthorization();
        console.log('[Transfer] Cached authorization:', authorization);
        console.log('[Transfer] authSupported:', authSupported);

        if (!authorization && authSupported !== false) {
          setStatus('authorizing');
          console.log('[Transfer] Requesting new authorization...');
          const authResult = await getOrSignAuthorization();
          authorization = authResult.authorization;
          console.log('[Transfer] Authorization result:', authResult);

          // If signing failed with an error (not just unsupported), show it
          if (authResult.error && authResult.supported) {
            throw new Error(authResult.error);
          }
        }

        if (!authorization) {
          console.warn(
            '[Transfer] No authorization available - transaction will fail! ' +
              'Wallet may not support EIP-7702.',
          );
        }

        // Step 2: Sign EIP-712 intent
        setStatus('signing');
        const executeData: ExecuteData = {
          owner: userAddress,
          token: tokenAddress,
          amount: amountWei!,
          to: recipient as Address,
          feeAmount: BigInt(feeQuote.feeAmount),
          feeToken: feeQuote.feeToken,
          deadline: BigInt(feeQuote.deadline),
          nonce: nonce,
        };

        // Use batch signing for fee-enabled transactions
        // This signs both the user transfer and fee transfer atomically
        const ownerSignature = await signBatchedIntent(executeData, feeQuote);

        // Step 3: Relay with EIP-7702 authorization (if available)
        setStatus('relaying');
        const result = await relayMutation.mutateAsync({
          executeData,
          ownerSignature,
          feeSignature: feeQuote.signature,
          authorization: authorization ?? undefined,
        });

        setTxHash(result.txHash);
        setStatus('success');
        onSuccess?.(result.txHash);
      } catch (err) {
        setStatus('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'Transaction failed',
        );
      }
    },
    [
      canSubmit,
      userAddress,
      nonce,
      feeQuote,
      tokenAddress,
      amountWei,
      recipient,
      getCachedAuthorization,
      authSupported,
      getOrSignAuthorization,
      signBatchedIntent,
      relayMutation,
      onSuccess,
    ],
  );

  // Reset form
  const handleReset = () => {
    setAmount('');
    setRecipient('');
    setAmountWei(undefined);
    setFeeQuote(null);
    setStatus('idle');
    setTxHash(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-4">
      {status === 'idle' || status === 'error' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <Card>
            <CardHeader>
              <CardTitle>Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <TokenInput
                value={amount}
                onChange={setAmount}
                onValueChange={setAmountWei}
                symbol={tokenSymbol}
                decimals={balance.decimals ?? 6}
              />
            </CardContent>
          </Card>

          {/* Recipient Input */}
          <Card>
            <CardHeader>
              <CardTitle>Recipient</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="recipient">Address</Label>
                <Input
                  id="recipient"
                  type="text"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className={
                    recipient && !isValidRecipient ? 'border-destructive' : ''
                  }
                />
                {recipient && !isValidRecipient && (
                  <p className="text-sm text-destructive">Invalid address</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fee Display */}
          {amountWei && recipient && isValidRecipient && (
            <FeeDisplay
              tokenAddress={tokenAddress}
              amount={amountWei.toString()}
              recipient={recipient as Address}
              sender={userAddress}
              onFeeQuoteLoaded={setFeeQuote}
            />
          )}

          {/* Total Display */}
          {totalAmount && (
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-semibold">
                    {(
                      Number(totalAmount) / Math.pow(10, balance.decimals ?? 6)
                    ).toFixed(6)}{' '}
                    {tokenSymbol}
                  </span>
                </div>
                {!hasTotalBalance && (
                  <p className="text-sm text-destructive mt-2">
                    Insufficient balance (including fee)
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {status === 'error' && errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Nonce Error Display */}
          {nonceError && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load nonce: {nonceError.message || 'Unknown error'}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {!userAddress
              ? 'Connect Wallet'
              : nonceLoading
                ? 'Loading Nonce...'
                : nonceError
                  ? 'Nonce Error - Check Network'
                  : !amountWei
                    ? 'Enter Amount'
                    : !isValidRecipient
                      ? 'Enter Valid Recipient'
                      : !hasBalance
                        ? 'Insufficient Balance'
                        : !feeQuote
                          ? 'Loading Fee...'
                          : !isFeeQuoteValid
                            ? 'Fee Quote Expired - Refresh'
                            : 'Sign & Send'}
          </Button>
        </form>
      ) : (
        <RelayStatus
          status={status}
          txHash={txHash}
          errorMessage={errorMessage}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
