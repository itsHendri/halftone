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

/**
 * A filter chip, drawn from the theme's Chip (semantic.component.chip, --chip-*). Selected is a role: inverted
 * (foreground on background) by default, so it reads as a filter rather than an action.
 */
export function FilterChip({ label, selected, onClick, icon: Icon, disabled, className }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'focus-visible:ring-ring/50 type-chip inline-flex h-(--chip-h-md) shrink-0 items-center gap-1.5 rounded-chip border px-(--chip-x) font-medium transition-colors outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50',
        selected
          ? 'bg-chip-selected-bg border-chip-selected-border text-chip-selected-fg hover:bg-chip-selected-pressed active:bg-chip-selected-pressed'
          : 'bg-chip-unselected-bg border-chip-unselected-border text-chip-unselected-fg hover:bg-chip-unselected-pressed active:bg-chip-unselected-pressed',
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
