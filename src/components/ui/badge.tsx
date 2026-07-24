import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Badge (PRD 4. fejezet – AI státusz, státuszok). Small status pill used in
 * tables and cards. The semantic variants encode success/pending/error states so
 * document, trip and AI statuses read consistently everywhere.
 */
const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/10 text-primary',
        neutral: 'border-transparent bg-muted text-muted-foreground',
        success:
          'border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
        warning:
          'border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400',
        danger:
          'border-transparent bg-destructive/15 text-destructive dark:text-red-400',
        info: 'border-transparent bg-sky-500/15 text-sky-600 dark:text-sky-400',
        outline: 'border-border text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
