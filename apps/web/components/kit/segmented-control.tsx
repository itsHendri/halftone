'use client';
import { cn } from 'cn';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type Props<T extends string> = {
  segments: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group for screen readers ("View"). */
  'aria-label'?: string;
  className?: string;
};

/** A sliding thumb over 2–4 mutually exclusive options. For content panes use Tabs. */
export function SegmentedControl<T extends string>({ segments, value, onChange, className, ...props }: Props<T>) {
  const reduced = useReducedMotion();
  const index = Math.max(
    0,
    segments.findIndex((s) => s.value === value)
  );
  return (
    <div role="radiogroup" aria-label={props['aria-label']} className={cn('bg-muted relative flex rounded-lg p-[3px]', className)}>
      <span
        aria-hidden
        className={cn('bg-card absolute inset-y-[3px] left-[3px] rounded-md shadow-sm', !reduced && 'transition-transform duration-200 ease-out')}
        style={{ width: `calc((100% - 6px) / ${segments.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(s.value)}
            className={cn(
              'focus-visible:ring-ring/50 relative h-8 flex-1 truncate rounded-md px-3 text-sm outline-none focus-visible:ring-[3px]',
              active ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
            )}>
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
