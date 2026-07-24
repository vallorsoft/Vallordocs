import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Loading spinner (PRD 4. fejezet – Vizuális visszajelzés: betöltés). Purely
 * presentational; screen readers get the label via the surrounding live region.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn('h-4 w-4 animate-spin text-muted-foreground', className)}
      aria-hidden
    />
  );
}
