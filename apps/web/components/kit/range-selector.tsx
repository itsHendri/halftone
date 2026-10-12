'use client';
import { cn } from 'cn';

type Props<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group ("Chart range"). */
  'aria-label'?: string;
  className?: string;
};

/**
 * Trackless range picker for a chart: 1D · 1W · 1M · 1Y · ALL. Equal-width buttons; the selected one inverts. Use
 * SegmentedControl instead when the options switch content rather than a time window.
 */
export function RangeSelector<T extends string>({ options, value, onChange, className, ...props }: Props<T>) {
  return (
    <div role="radiogroup" aria-label={props['aria-label'] ?? 'Range'} className={cn('flex items-center gap-2', className)}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              'focus-visible:ring-ring/50 h-9 flex-1 rounded-md px-2 text-sm font-semibold transition-colors outline-none focus-visible:ring-[3px]',
              selected ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'
            )}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
