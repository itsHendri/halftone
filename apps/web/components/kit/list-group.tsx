import { cn } from 'cn';
import * as React from 'react';
import { Card } from '@/components/ui/card';

type Props = {
  /** Optional title above the group. */
  title?: string;
  /** Small print under the group: what a setting affects, a legal note. */
  footnote?: string;
  /** `card` sits the rows on a surface; `plain` runs them straight on the background. */
  variant?: 'card' | 'plain';
  children: React.ReactNode;
  className?: string;
};

/** A group of ListRows with the divider bookkeeping handled: it sets `last` on the final row. */
export function ListGroup({ title, footnote, variant = 'card', children, className }: Props) {
  const items = React.Children.toArray(children).filter(React.isValidElement);
  const rows = items.map((child, i) => (i === items.length - 1 ? React.cloneElement(child as React.ReactElement<{ last?: boolean }>, { last: true }) : child));
  return (
    <section className={cn('flex flex-col gap-3', className)}>
      {title ? <h3 className="text-lg font-semibold">{title}</h3> : null}
      {variant === 'card' ? <Card className="w-full gap-0 px-4 py-0">{rows}</Card> : <div className="w-full">{rows}</div>}
      {footnote ? <p className="text-muted-foreground text-xs leading-5">{footnote}</p> : null}
    </section>
  );
}
