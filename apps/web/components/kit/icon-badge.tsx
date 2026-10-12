import { cn } from 'cn';
import type { LucideIcon } from 'lucide-react';
import type * as React from 'react';

type Props = Omit<React.ComponentProps<'button'>, 'children'> & {
  icon: LucideIcon;
  /** Number shown in the badge; 0 hides it. Values over 99 show "99+". */
  count?: number;
  /** Show a plain dot instead of a count. */
  dot?: boolean;
  /** Names the button ("Notifications"). The count is added for screen readers. */
  'aria-label': string;
};

/** Icon button with a notification badge (bell, cart, inbox). Always give it a label. */
export function IconBadge({ icon: Icon, count = 0, dot, className, type = 'button', ...props }: Props) {
  const showCount = !dot && count > 0;
  const label = showCount ? `${props['aria-label']}, ${count} new` : props['aria-label'];
  return (
    <button
      type={type}
      {...props}
      aria-label={label}
      className={cn(
        'focus-visible:ring-ring/50 hover:bg-accent relative inline-flex size-10 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-[3px]',
        className
      )}>
      <Icon className="size-5" aria-hidden />
      {dot ? <span aria-hidden className="bg-destructive border-background absolute top-1.5 right-1.5 size-2.5 rounded-full border-2" /> : null}
      {showCount ? (
        <span
          aria-hidden
          className="bg-destructive text-destructive-foreground border-background absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 px-1 text-[10px] leading-none font-bold tabular-nums">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </button>
  );
}
