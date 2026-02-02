import * as React from 'react';
import { formatUnits, parseUnits } from 'viem';
import type { Address } from 'viem';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { cn } from '@/lib/utils';

export interface TokenInputProps {
  /** Current value as string (human-readable amount) */
  value: string;
  /** Called when value changes */
  onChange: (value: string) => void;
  /** Token contract address (undefined for native token) */
  tokenAddress?: Address;
  /** Owner address for balance lookup */
  ownerAddress?: Address;
  /** Token symbol override (uses fetched if not provided) */
  symbol?: string;
  /** Token decimals override (uses fetched if not provided) */
  decimals?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Disable input */
  disabled?: boolean;
  /** Show max button */
  showMaxButton?: boolean;
  /** Show balance */
  showBalance?: boolean;
  /** Additional class name */
  className?: string;
  /** Error message */
  error?: string;
  /** Label text */
  label?: string;
  /** Called when parsed bigint value changes (debounced) */
  onValueChange?: (value: bigint | undefined) => void;
}

/**
 * Token amount input with max button, balance display, and validation.
 * Handles decimal input parsing and formats to proper bigint for contract calls.
 *
 * @example
 * ```tsx
 * const [amount, setAmount] = useState('');
 *
 * <TokenInput
 *   value={amount}
 *   onChange={setAmount}
 *   tokenAddress={usdcAddress}
 *   ownerAddress={userAddress}
 *   showMaxButton
 *   showBalance
 *   onValueChange={(bigintValue) => console.log('Parsed:', bigintValue)}
 * />
 * ```
 */
export function TokenInput({
  value,
  onChange,
  tokenAddress,
  ownerAddress,
  symbol: symbolOverride,
  decimals: decimalsOverride,
  placeholder = '0.0',
  disabled = false,
  showMaxButton = true,
  showBalance = true,
  className,
  error,
  label,
  onValueChange,
}: TokenInputProps) {
  const {
    balance,
    decimals: fetchedDecimals,
    symbol: fetchedSymbol,
    isLoading,
  } = useTokenBalance({
    tokenAddress,
    owner: ownerAddress,
  });

  const decimals = decimalsOverride ?? fetchedDecimals;
  const symbol = symbolOverride ?? fetchedSymbol;

  // Format balance for display
  const formattedBalance = React.useMemo(() => {
    if (balance === undefined) return undefined;
    return formatUnits(balance, decimals);
  }, [balance, decimals]);

  // Parse and debounce value for onValueChange callback
  const debouncedValue = useDebounce(value, 300);

  React.useEffect(() => {
    if (!onValueChange) return;

    try {
      if (!debouncedValue || debouncedValue === '') {
        onValueChange(undefined);
        return;
      }
      const parsed = parseUnits(debouncedValue, decimals);
      onValueChange(parsed);
    } catch {
      onValueChange(undefined);
    }
  }, [debouncedValue, decimals, onValueChange]);

  // Handle input change with validation
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow empty input
    if (inputValue === '') {
      onChange('');
      return;
    }

    // Validate input format (numbers and single decimal point)
    const regex = /^[0-9]*\.?[0-9]*$/;
    if (!regex.test(inputValue)) return;

    // Limit decimal places
    const parts = inputValue.split('.');
    if (parts[1] && parts[1].length > decimals) return;

    onChange(inputValue);
  };

  // Handle max button
  const handleMax = () => {
    if (balance !== undefined) {
      onChange(formatUnits(balance, decimals));
    }
  };

  // Check if amount exceeds balance
  const exceedsBalance = React.useMemo(() => {
    if (!value || balance === undefined) return false;
    try {
      const parsed = parseUnits(value, decimals);
      return parsed > balance;
    } catch {
      return false;
    }
  }, [value, balance, decimals]);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium text-primary">{label}</label>
      )}

      <div className="relative">
        <Input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoCorrect="off"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            'pr-24 text-lg font-medium',
            error || exceedsBalance
              ? 'border-red-500 focus-visible:ring-red-500'
              : '',
          )}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {showMaxButton && balance !== undefined && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleMax}
              disabled={disabled}
              className="h-7 px-2 text-xs font-semibold text-primary/70 hover:text-primary"
            >
              MAX
            </Button>
          )}
          {symbol && (
            <span className="text-sm font-medium text-muted-foreground">
              {symbol}
            </span>
          )}
        </div>
      </div>

      {/* Balance display */}
      {showBalance && ownerAddress && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {isLoading ? (
              'Loading...'
            ) : formattedBalance !== undefined ? (
              <>
                Balance:{' '}
                <span className={cn(exceedsBalance && 'text-red-500')}>
                  {Number(formattedBalance).toLocaleString(undefined, {
                    maximumFractionDigits: 6,
                  })}
                </span>
                {symbol && ` ${symbol}`}
              </>
            ) : (
              '—'
            )}
          </span>
        </div>
      )}

      {/* Error message */}
      {(error || exceedsBalance) && (
        <p className="text-xs text-red-500">
          {error || 'Insufficient balance'}
        </p>
      )}
    </div>
  );
}
