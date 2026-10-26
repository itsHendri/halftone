import { CheckIcon } from 'lucide-react';
import { cn } from 'cn';
import type * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

type Props = {
  name: string;
  price: string;
  /** "per month", "per seat / month", "one-off". */
  period?: string;
  description?: string;
  features: string[];
  /** The plan's Button. */
  action: React.ReactNode;
  /** The recommended plan: a border and a badge. One per row. */
  highlighted?: boolean;
  badge?: string;
  className?: string;
};

/** One plan. Show 2–4 side by side; highlight one. */
export function PricingCard({ name, price, period, description, features, action, highlighted, badge = 'Most popular', className }: Props) {
  return (
    <Card className={cn('relative flex flex-col gap-6 p-6', highlighted && 'border-primary ring-primary-subtle ring-4', className)}>
      {highlighted ? <Badge className="absolute -top-3 left-6">{badge}</Badge> : null}
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold">{name}</h3>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </div>
      <p className="flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-tight">{price}</span>
        {period ? <span className="text-muted-foreground text-sm">{period}</span> : null}
      </p>
      <ul className="flex flex-col gap-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <CheckIcon className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-auto">{action}</div>
    </Card>
  );
}
