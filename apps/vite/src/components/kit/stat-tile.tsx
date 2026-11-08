import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { cn } from 'cn';
import { Card } from '@/components/ui/card';

type Props = {
  label: string;
  value: string;
  /** Signed change, e.g. 12.5 or -3. Shown as a percentage with a trend icon. */
  delta?: number;
  /** What the delta compares against: "vs last month". */
  deltaLabel?: string;
  /** Whether going down is good (churn, costs): flips the colour, not the arrow. */
  invert?: boolean;
  className?: string;
};

/** One KPI: label, big value, and an optional signed change. Use 2–4 in a row on a dashboard. */
export function StatTile({ label, value, delta, deltaLabel, invert, className }: Props) {
  const up = (delta ?? 0) >= 0;
  const good = invert ? !up : up;
  const Trend = up ? TrendingUpIcon : TrendingDownIcon;
  return (
    <Card className={cn('gap-2 p-5', className)}>
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {delta !== undefined ? (
        <p className="flex items-center gap-1.5 text-sm">
          <span className={cn('inline-flex items-center gap-1 font-medium', good ? 'text-success' : 'text-destructive')}>
            <Trend className="size-4" aria-hidden />
            {up ? '+' : '−'}
            {Math.abs(delta)}%
          </span>
          {deltaLabel ? <span className="text-muted-foreground">{deltaLabel}</span> : null}
        </p>
      ) : null}
    </Card>
  );
}
