'use client';
import { cn } from 'cn';
import { StarIcon } from 'lucide-react';

type Props = {
  /** 0 to `max`. Shown to the nearest half star. */
  value: number;
  /** Makes it an input: each star is a radio button. Omit to display. */
  onChange?: (value: number) => void;
  max?: number;
  /** Display only: the number beside the stars, and how many reviews (`4.6 · 120 reviews`). */
  showValue?: boolean;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  /** What is being rated, for screen readers ("Rate your order"). Default "Rating". */
  'aria-label'?: string;
  className?: string;
};

const PX = { sm: 'size-3.5', md: 'size-[18px]', lg: 'size-7' } as const;

function Star({ size, fraction }: { size: string; fraction: number }) {
  return (
    <span className={cn('relative inline-block', size)} aria-hidden>
      <StarIcon className={cn('text-muted-foreground absolute inset-0', size)} strokeWidth={1.75} />
      {fraction > 0 ? (
        <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fraction * 100}%` }}>
          <StarIcon className={cn('text-warning fill-warning', size)} strokeWidth={1.75} />
        </span>
      ) : null}
    </span>
  );
}

/**
 * Stars. Without `onChange` it shows a score (half stars, optional number and review count); with `onChange` it is
 * an input whose stars are radio buttons.
 */
export function Rating({ value, onChange, max = 5, showValue, count, size, className, ...props }: Props) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  if (onChange) {
    const px = PX[size ?? 'lg'];
    return (
      <div role="radiogroup" aria-label={props['aria-label'] ?? 'Rating'} className={cn('flex', className)}>
        {stars.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
            onClick={() => onChange(n)}
            className="focus-visible:ring-ring/50 flex size-11 items-center justify-center rounded-md outline-none hover:opacity-80 focus-visible:ring-[3px]">
            <Star size={px} fraction={n <= value ? 1 : 0} />
          </button>
        ))}
      </div>
    );
  }
  const px = PX[size ?? 'sm'];
  const half = Math.round(value * 2) / 2;
  return (
    <div role="img" aria-label={`Rated ${value} out of ${max}${count ? `, ${count} reviews` : ''}`} className={cn('flex items-center gap-1.5', className)}>
      <span className="flex gap-0.5">
        {stars.map((n) => (
          <Star key={n} size={px} fraction={Math.max(0, Math.min(1, half - (n - 1)))} />
        ))}
      </span>
      {showValue || count ? (
        <span className={cn('text-muted-foreground', size === 'md' || size === 'lg' ? 'text-sm' : 'text-xs')}>
          {[showValue ? value.toFixed(1) : null, count ? `${count} reviews` : null].filter(Boolean).join(' · ')}
        </span>
      ) : null}
    </div>
  );
}
