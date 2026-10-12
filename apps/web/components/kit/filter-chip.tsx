'use client';
import { cn } from 'cn';
import type { LucideIcon } from 'lucide-react';
import type * as React from 'react';

type ChipProps = {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
  className?: string;
};

/** Neutral-active filter chip. Selected = inverted (foreground on background), never the brand colour. */
export function FilterChip({ label, selected, onClick, icon: Icon, disabled, className }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'focus-visible:ring-ring/50 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50',
        selected ? 'bg-foreground border-foreground text-background' : 'bg-background border-border text-foreground hover:bg-accent',
        className
      )}>
      {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
      {label}
    </button>
  );
}

/** A row of FilterChips: scrolls sideways when it overflows. */
export function FilterChipRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]', className)}>{children}</div>;
}
