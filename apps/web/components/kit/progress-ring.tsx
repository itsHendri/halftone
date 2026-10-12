import { cn } from 'cn';
import type * as React from 'react';

type Props = {
  /** 0–100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  tone?: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  /** Centre content, e.g. the percentage. */
  children?: React.ReactNode;
  /** What the ring measures ("Today's habits"). Read with the percentage. */
  'aria-label'?: string;
  className?: string;
};

const STROKE = { primary: 'stroke-primary', success: 'stroke-success', warning: 'stroke-warning', destructive: 'stroke-destructive', info: 'stroke-info' } as const;

/** Circular determinate progress: goals, storage, step completion. */
export function ProgressRing({ value, size = 64, strokeWidth = 6, tone = 'primary', children, className, ...props }: Props) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={props['aria-label'] ?? 'Progress'}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} className="stroke-muted" strokeWidth={strokeWidth} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} className={STROKE[tone]} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" strokeDasharray={`${(pct / 100) * c} ${c}`} />
      </svg>
      {children}
    </div>
  );
}
