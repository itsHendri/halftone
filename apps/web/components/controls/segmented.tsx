'use client';
import { cn } from 'cn';
import * as React from 'react';

export type SegmentedOption<T extends string = string> = { value: T; label: string; title?: string };

/**
 * Two to four short, mutually exclusive choices in a panel row: a radio group with a neutral thumb (selected reads by
 * its raised fill, weight and shadow, never a brand colour). Arrows move and choose, as a radio group does. Longer
 * lists are a ControlSelect.
 */
export function ControlSegmented<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  /** Names the group for screen readers. */
  label: string;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const at = options.findIndex((o) => o.value === value);
  const move = (from: number, by: number) => {
    const i = (from + by + options.length) % options.length;
    onChange(options[i].value);
    refs.current[i]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className={cn('bg-muted flex min-w-0 gap-0.5 rounded-md p-0.5', className)}>
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            title={o.title}
            tabIndex={selected || (at < 0 && i === 0) ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                move(i, 1);
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                move(i, -1);
              }
            }}
            className={cn(
              'focus-visible:ring-ring/50 h-6 min-w-0 flex-1 truncate rounded px-2 text-xs whitespace-nowrap outline-none focus-visible:ring-[3px]',
              selected ? 'bg-card text-foreground font-semibold shadow-sm' : 'text-muted-foreground hover:text-foreground font-medium'
            )}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
