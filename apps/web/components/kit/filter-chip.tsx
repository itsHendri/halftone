'use client';
import { cn } from 'cn';
import type { LucideIcon } from 'lucide-react';
import type * as React from 'react';

type ChipProps = {
  label: string;
  /** S, M or L (--chip-h-*); M by default. */
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onClick?: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
  className?: string;
};

const HEIGHT = { sm: 'h-(--chip-h-sm)', md: 'h-(--chip-h-md)', lg: 'h-(--chip-h-lg)' } as const;

/**
 * A filter chip, drawn from the theme's Chip (semantic.component.chip, --chip-*): its size, border, gap, label
 * (type-chip: the text style and weight) and icon. Selected is a role: inverted (foreground on background) by
 * default, so it reads as a filter rather than an action.
 */
export function FilterChip({ label, selected, onClick, icon: Icon, size = 'md', disabled, className }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'focus-visible:ring-ring/50 type-chip inline-flex shrink-0 items-center gap-(--chip-gap) rounded-chip border-(length:--chip-border-w) px-(--chip-x) transition-colors outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50',
        HEIGHT[size],
        selected
          ? 'bg-chip-selected-bg border-chip-selected-border text-chip-selected-fg hover:bg-chip-selected-pressed active:bg-chip-selected-pressed'
          : 'bg-chip-unselected-bg border-chip-unselected-border text-chip-unselected-fg hover:bg-chip-unselected-pressed active:bg-chip-unselected-pressed',
        className
      )}>
      {Icon ? <Icon className="size-(--chip-icon)" aria-hidden /> : null}
      {label}
    </button>
  );
}

/** A row of FilterChips: scrolls sideways when it overflows. */
export function FilterChipRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]', className)}>{children}</div>;
}
