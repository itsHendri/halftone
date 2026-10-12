import { cn } from 'cn';
import * as React from 'react';

type Props = {
  /** 1-indexed current step. */
  current: number;
  total: number;
  /** Optional labels; must have `total` entries to render. */
  labels?: string[];
  variant?: 'numbered' | 'compact';
  className?: string;
};

/** Progress for multi-step flows (onboarding, checkout). Distinct from PagerDots. */
export function Stepper({ current, total, labels, variant = 'numbered', className }: Props) {
  const step = Math.max(1, Math.min(current, total));

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <div role="progressbar" aria-label="Progress" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step} aria-valuetext={`Step ${step} of ${total}`} className="bg-muted h-1 overflow-hidden rounded-full">
          <div className="bg-primary h-full rounded-full" style={{ width: `${(step / total) * 100}%` }} />
        </div>
        <p className="text-muted-foreground text-sm">
          Step {step} of {total}
        </p>
      </div>
    );
  }

  const hasLabels = !!labels && labels.length === total;
  return (
    <ol className={cn('flex items-start', className)} aria-label={`Step ${step} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <React.Fragment key={n}>
            {i > 0 ? <li aria-hidden className={cn('mx-1.5 mt-3 h-0.5 flex-1 rounded-full', n <= step ? 'bg-primary' : 'bg-border')} /> : null}
            {/* One column per step so the label sits under its own circle. */}
            <li aria-current={active ? 'step' : undefined} className={cn('flex shrink-0 flex-col items-center', hasLabels ? 'w-16' : 'w-6')}>
              <span
                className={cn(
                  'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
                  done ? 'bg-primary text-primary-foreground' : active ? 'bg-background border-primary text-foreground border-2' : 'bg-muted text-muted-foreground'
                )}>
                {n}
              </span>
              {hasLabels ? <span className={cn('mt-2 w-full truncate text-center text-xs', active ? 'text-foreground font-medium' : 'text-muted-foreground')}>{labels[i]}</span> : null}
            </li>
          </React.Fragment>
        );
      })}
    </ol>
  );
}
