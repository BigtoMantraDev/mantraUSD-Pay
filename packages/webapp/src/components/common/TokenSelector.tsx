import * as React from 'react';
import { Check, ChevronDown, Search, Coins } from 'lucide-react';
import { formatUnits } from 'viem';
import type { Address } from 'viem';
import { useAccount } from 'wagmi';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { cn } from '@/lib/utils';

export interface Token {
  /** Token contract address (undefined for native token) */
  address?: Address;
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Token decimals */
  decimals: number;
  /** Token logo URL */
  logoUrl?: string;
}

export interface TokenSelectorProps {
  /** List of tokens to display */
  tokens: Token[];
  /** Currently selected token */
  selectedToken?: Token;
  /** Called when a token is selected */
  onSelect: (token: Token) => void;
  /** Placeholder text when no token is selected */
  placeholder?: string;
  /** Disable the selector */
  disabled?: boolean;
  /** Show token balances */
  showBalances?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Token selector dropdown with search, logos, and optional balance display.
 *
 * @example
 * ```tsx
 * const tokens: Token[] = [
 *   { symbol: 'OM', name: 'MANTRA', decimals: 18 },
 *   { address: '0x...', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
 * ];
 *
 * <TokenSelector
 *   tokens={tokens}
 *   selectedToken={selected}
 *   onSelect={setSelected}
 *   showBalances
 * />
 * ```
 */
export function TokenSelector({
  tokens,
  selectedToken,
  onSelect,
  placeholder = 'Select token',
  disabled = false,
  showBalances = false,
  className,
}: TokenSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filteredTokens = React.useMemo(() => {
    if (!search) return tokens;
    const searchLower = search.toLowerCase();
    return tokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(searchLower) ||
        token.name.toLowerCase().includes(searchLower),
    );
  }, [tokens, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('justify-between min-w-[140px] bg-white', className)}
        >
          {selectedToken ? (
            <div className="flex items-center gap-2">
              <TokenIcon token={selectedToken} size="sm" />
              <span className="font-medium">{selectedToken.symbol}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search tokens..."
              value={search}
              onValueChange={setSearch}
              className="border-0 focus:ring-0"
            />
          </div>
          <CommandList>
            <CommandEmpty>No token found.</CommandEmpty>
            <CommandGroup>
              {filteredTokens.map((token) => (
                <TokenOption
                  key={token.address ?? 'native'}
                  token={token}
                  isSelected={
                    selectedToken?.address === token.address &&
                    selectedToken?.symbol === token.symbol
                  }
                  showBalance={showBalances}
                  onSelect={() => {
                    onSelect(token);
                    setOpen(false);
                    setSearch('');
                  }}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface TokenOptionProps {
  token: Token;
  isSelected: boolean;
  showBalance: boolean;
  onSelect: () => void;
}

function TokenOption({
  token,
  isSelected,
  showBalance,
  onSelect,
}: TokenOptionProps) {
  const { address } = useAccount();

  const { balance, isLoading } = useTokenBalance({
    tokenAddress: token.address,
    owner: address,
  });

  const formattedBalance = React.useMemo(() => {
    if (balance === undefined) return undefined;
    const formatted = formatUnits(balance, token.decimals);
    return Number(formatted).toLocaleString(undefined, {
      maximumFractionDigits: 4,
    });
  }, [balance, token.decimals]);

  return (
    <CommandItem
      value={`${token.symbol} ${token.name}`}
      onSelect={onSelect}
      className="flex items-center justify-between py-3 cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <TokenIcon token={token} size="md" />
        <div className="flex flex-col">
          <span className="font-medium">{token.symbol}</span>
          <span className="text-xs text-muted-foreground">{token.name}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {showBalance && address && (
          <span className="text-sm text-muted-foreground">
            {isLoading ? '...' : (formattedBalance ?? '—')}
          </span>
        )}
        {isSelected && <Check className="h-4 w-4 text-primary" />}
      </div>
    </CommandItem>
  );
}

interface TokenIconProps {
  token: Token;
  size?: 'sm' | 'md' | 'lg';
}

function TokenIcon({ token, size = 'md' }: TokenIconProps) {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  if (token.logoUrl) {
    return (
      <img
        src={token.logoUrl}
        alt={token.symbol}
        className={cn(sizeClasses[size], 'rounded-full')}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeClasses[size],
        'rounded-full bg-primary/10 flex items-center justify-center',
      )}
    >
      <Coins className="h-1/2 w-1/2 text-primary" />
    </div>
  );
}

export { TokenIcon };
