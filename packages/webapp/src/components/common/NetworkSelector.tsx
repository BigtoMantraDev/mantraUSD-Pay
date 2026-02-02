import { useChainId, useSwitchChain } from 'wagmi';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CHAIN_CONFIGS, SUPPORTED_CHAINS } from '@/config/chains';
import { cn } from '@/lib/utils';

export interface NetworkSelectorProps {
  /** Optional className for the trigger */
  className?: string;
  /** Whether to use glassmorphism style */
  glass?: boolean;
}

/**
 * A dropdown selector for switching between supported blockchain networks.
 * Shows status dots: Green (mainnet), Yellow (testnet).
 */
export function NetworkSelector({
  className,
  glass = false,
}: NetworkSelectorProps) {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  const currentConfig = CHAIN_CONFIGS[chainId];

  const handleValueChange = (value: string) => {
    const newChainId = parseInt(value, 10);
    if (newChainId !== chainId) {
      switchChain({ chainId: newChainId });
    }
  };

  return (
    <Select
      value={chainId.toString()}
      onValueChange={handleValueChange}
      disabled={isPending}
    >
      <SelectTrigger
        className={cn(
          'w-[180px]',
          glass &&
            'bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20',
          className,
        )}
      >
        <SelectValue>
          {currentConfig ? (
            <div className="flex items-center gap-2">
              <StatusDot isTestnet={currentConfig.isTestnet} />
              <span>{currentConfig.name}</span>
            </div>
          ) : (
            <span className="text-red-500">Unsupported</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_CHAINS.map((chain) => {
          const config = CHAIN_CONFIGS[chain.id];
          return (
            <SelectItem key={chain.id} value={chain.id.toString()}>
              <div className="flex items-center gap-2">
                <StatusDot isTestnet={config?.isTestnet ?? true} />
                <span>{config?.name ?? chain.name}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

function StatusDot({ isTestnet }: { isTestnet: boolean }) {
  return (
    <span
      className={cn(
        'h-2 w-2 rounded-full shrink-0',
        isTestnet ? 'bg-yellow-400' : 'bg-green-500',
      )}
    />
  );
}
