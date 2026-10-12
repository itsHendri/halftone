import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import type * as React from 'react';

const dotVariants = cva('inline-block shrink-0 rounded-full', {
  variants: {
    tone: {
      success: 'bg-success',
      warning: 'bg-warning',
      destructive: 'bg-destructive',
      info: 'bg-info',
      primary: 'bg-primary',
      muted: 'bg-muted-foreground',
    },
    size: { sm: 'size-2', md: 'size-2.5', lg: 'size-3' },
  },
  defaultVariants: { tone: 'success', size: 'md' },
});

/** Small semantic status indicator (online, pending, error). Pair it with text: colour alone is not a label. */
export function StatusDot({ tone, size, className, ...props }: React.ComponentProps<'span'> & VariantProps<typeof dotVariants>) {
  return <span aria-hidden className={cn(dotVariants({ tone, size }), className)} {...props} />;
}
