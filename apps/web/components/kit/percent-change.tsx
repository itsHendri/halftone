import { cn } from 'cn';
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

type Props = {
  /** Percentage, e.g. 2.35 for +2.35%. */
  value: number;
  decimals?: number;
  showIcon?: boolean;
  className?: string;
};

/** Signed percentage with a trend icon, coloured by sign. */
export function PercentChange({ value, decimals = 2, showIcon = true, className }: Props) {
  const flat = value === 0;
  const up = value > 0;
  const tone = flat ? 'text-muted-foreground' : up ? 'text-success' : 'text-destructive';
  const Icon = up ? TrendingUpIcon : TrendingDownIcon;
  return (
    <span className={cn('inline-flex items-center gap-1 text-sm font-medium tabular-nums', tone, className)}>
      {showIcon && !flat ? <Icon className="size-3.5" aria-hidden /> : null}
      {up ? '+' : ''}
      {value.toFixed(decimals)}%
    </span>
  );
}
