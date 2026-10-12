'use client';
import { cn } from 'cn';
import { MinusIcon, PlusIcon } from 'lucide-react';

type Props = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** What is being counted, for screen readers ("Guests"). */
  'aria-label'?: string;
  className?: string;
};

/** − value + control for quantities, guests, tickets. */
export function QuantityStepper({ value, onChange, min = 0, max = Number.POSITIVE_INFINITY, step = 1, disabled, className, ...props }: Props) {
  const canDec = !disabled && value - step >= min;
  const canInc = !disabled && value + step <= max;
  const label = props['aria-label'] ?? 'Quantity';
  const btn = 'hover:bg-accent focus-visible:ring-ring/50 flex size-9 items-center justify-center rounded-md outline-none focus-visible:ring-[3px] disabled:opacity-40';
  return (
    <div role="group" aria-label={label} className={cn('bg-muted inline-flex h-9 items-center rounded-md', disabled && 'opacity-50', className)}>
      <button type="button" aria-label={`Decrease ${label.toLowerCase()}`} disabled={!canDec} onClick={() => onChange(value - step)} className={btn}>
        <MinusIcon className="size-4" aria-hidden />
      </button>
      <output aria-live="polite" className="min-w-8 text-center text-sm font-semibold tabular-nums">
        {value}
      </output>
      <button type="button" aria-label={`Increase ${label.toLowerCase()}`} disabled={!canInc} onClick={() => onChange(value + step)} className={btn}>
        <PlusIcon className="size-4" aria-hidden />
      </button>
    </div>
  );
}
