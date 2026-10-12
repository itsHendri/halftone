'use client';
import { cn } from 'cn';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import * as React from 'react';

type Props = {
  /** The hero figure, already formatted: "$60.00", "12,480 steps". */
  value: string;
  /** Small label above the value. */
  label?: string;
  /** Line under the value: a delta, a date, a status. */
  caption?: string;
  captionTone?: 'default' | 'positive' | 'negative';
  /** Offer the eye toggle that hides the value. */
  maskable?: boolean;
  /** Controlled mask state. Omit to let the component own it. */
  masked?: boolean;
  onMaskedChange?: (next: boolean) => void;
  align?: 'start' | 'center';
  className?: string;
};

const CAPTION = { default: 'text-muted-foreground', positive: 'text-success', negative: 'text-destructive' } as const;

/**
 * The hero number at the top of a page: a balance, a total, a score. `maskable` adds the eye toggle that replaces
 * the figure with dots, for anything someone might not want visible over their shoulder.
 */
export function ValueHeader({ value, label, caption, captionTone = 'default', maskable, masked, onMaskedChange, align = 'start', className }: Props) {
  const [own, setOwn] = React.useState(false);
  const isMasked = masked ?? own;
  const toggle = () => {
    const next = !isMasked;
    if (masked === undefined) setOwn(next);
    onMaskedChange?.(next);
  };
  return (
    <div className={cn('flex flex-col gap-1', align === 'center' && 'items-center text-center', className)}>
      {label ? <p className="text-muted-foreground text-sm font-medium">{label}</p> : null}
      <div className="flex items-center gap-3">
        <p className="text-4xl font-bold tracking-tight tabular-nums">
          {isMasked ? (
            <>
              <span aria-hidden>••••••</span>
              <span className="sr-only">Value hidden</span>
            </>
          ) : (
            value
          )}
        </p>
        {maskable ? (
          <button
            type="button"
            onClick={toggle}
            aria-label={isMasked ? 'Show value' : 'Hide value'}
            aria-pressed={isMasked}
            className="bg-muted text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 flex size-8 items-center justify-center rounded-full outline-none focus-visible:ring-[3px]">
            {isMasked ? <EyeOffIcon className="size-4" aria-hidden /> : <EyeIcon className="size-4" aria-hidden />}
          </button>
        ) : null}
      </div>
      {/* Kept while masked so the block does not change height. */}
      {caption ? <p className={cn('text-sm font-medium', CAPTION[captionTone], isMasked && 'invisible')}>{caption}</p> : null}
    </div>
  );
}
