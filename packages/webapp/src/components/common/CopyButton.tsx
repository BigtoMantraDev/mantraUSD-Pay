import { Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface CopyButtonProps {
  /** The text to copy to clipboard */
  value: string;
  /** Optional className for the button */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Label for accessibility */
  label?: string;
}

/**
 * A button that copies text to clipboard with visual feedback.
 * Shows a checkmark icon for 2 seconds after successful copy.
 */
export function CopyButton({
  value,
  className,
  size = 'sm',
  label = 'Copy to clipboard',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [value]);

  const iconSize = size === 'sm' ? 14 : 16;
  const buttonSize = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            aria-label={label}
            className={cn(
              buttonSize,
              'shrink-0 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100',
              copied && 'text-green-600 hover:text-green-600',
              className,
            )}
          >
            {copied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{copied ? 'Copied!' : 'Copy'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
