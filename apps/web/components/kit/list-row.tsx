'use client';
import { cn } from 'cn';
import { CheckIcon, ChevronRightIcon } from 'lucide-react';
import type * as React from 'react';

type Props = {
  /** Leading visual: usually an IconCircle or Avatar. */
  leading?: React.ReactNode;
  /** Turns the row into a choice. The whole row is the control, so pass `onClick` too. */
  select?: { mode: 'radio' | 'checkbox'; selected: boolean };
  title: string;
  subtitle?: string;
  /** Right-aligned value. */
  value?: string;
  valueClassName?: string;
  /** Small line under the value. */
  sublabel?: string;
  sublabelClassName?: string;
  /** Custom trailing content; replaces value and sublabel. */
  trailing?: React.ReactNode;
  /** Show a chevron (navigation rows). */
  chevron?: boolean;
  onClick?: () => void;
  /** Or a link: the row navigates. */
  href?: string;
  disabled?: boolean;
  /** Suppress the bottom divider (last row in a card). ListGroup sets it for you. */
  last?: boolean;
  className?: string;
};

/** The canonical list row: leading · title/subtitle · value/sublabel or trailing. Never rebuild this inline. */
export function ListRow({ leading, select, title, subtitle, value, valueClassName, sublabel, sublabelClassName, trailing, chevron, onClick, href, disabled, last, className }: Props) {
  const body = (
    <>
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{title}</span>
        {subtitle ? <span className="text-muted-foreground block truncate text-sm">{subtitle}</span> : null}
      </span>
      {trailing ??
        (value || sublabel ? (
          <span className="flex flex-col items-end">
            {value ? <span className={cn('font-semibold tabular-nums', valueClassName)}>{value}</span> : null}
            {sublabel ? <span className={cn('text-muted-foreground text-sm', sublabelClassName)}>{sublabel}</span> : null}
          </span>
        ) : null)}
      {select ? (
        <span
          aria-hidden
          className={cn(
            'flex size-5 shrink-0 items-center justify-center border-2',
            select.mode === 'radio' ? 'rounded-full' : 'rounded-sm',
            select.selected ? 'border-foreground bg-foreground' : 'border-border'
          )}>
          {select.selected ? select.mode === 'radio' ? <span className="bg-background size-2 rounded-full" /> : <CheckIcon className="text-background size-3.5" strokeWidth={3} /> : null}
        </span>
      ) : null}
      {chevron ? <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" aria-hidden /> : null}
    </>
  );
  const base = cn('flex min-h-14 w-full items-center gap-3 py-3 text-left', !last && 'border-border border-b', disabled && 'pointer-events-none opacity-50', className);
  // No side offset for the hover: the row's divider must line up with the rows around it.
  const interactive = 'hover:bg-accent/50 focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px] focus-visible:ring-inset';
  if (href) {
    return (
      <a href={href} aria-disabled={disabled} className={cn(base, interactive)}>
        {body}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" role={select?.mode} aria-checked={select ? select.selected : undefined} disabled={disabled} onClick={onClick} className={cn(base, interactive)}>
        {body}
      </button>
    );
  }
  return <div className={base}>{body}</div>;
}
