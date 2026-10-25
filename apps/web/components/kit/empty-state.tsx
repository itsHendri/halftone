import type { LucideIcon } from 'lucide-react';
import { cn } from 'cn';
import type * as React from 'react';

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Usually one Button: the way out of the empty state. */
  action?: React.ReactNode;
  /** `compact` for inside a card or table; `default` for a whole page. */
  variant?: 'default' | 'compact';
  className?: string;
};

/** What a list, table or page shows when there is nothing yet. Always offer the next step. */
export function EmptyState({ icon: Icon, title, description, action, variant = 'default', className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-center',
        variant === 'default' ? 'px-6 py-16' : 'px-4 py-8',
        className
      )}>
      <span className={cn('bg-muted text-muted-foreground flex items-center justify-center rounded-full', variant === 'default' ? 'size-14' : 'size-10')}>
        <Icon className={variant === 'default' ? 'size-6' : 'size-5'} aria-hidden />
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        {/* As the mobile kit draws it: the H4 text style, or small muted text in a compact one. */}
        <p className={variant === 'default' ? 'type-h4' : 'text-muted-foreground text-sm font-medium'}>{title}</p>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
