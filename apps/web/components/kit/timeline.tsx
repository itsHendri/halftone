import { cn } from 'cn';
import { CheckIcon } from 'lucide-react';

export type TimelineItem = {
  title: string;
  /** When it happened, or is expected: "12 Jun, 10:02", "Expected Fri". */
  time?: string;
  description?: string;
  state: 'done' | 'current' | 'upcoming';
};

type Props = {
  items: TimelineItem[];
  /** The colour of what is done: `success` for orders and deliveries, `primary` for neutral processes. */
  tone?: 'success' | 'primary';
  className?: string;
};

const SPOKEN = { done: 'done', current: 'in progress', upcoming: 'not yet' } as const;

/**
 * Vertical status steps joined by a line: an order, a delivery, an application. Done steps are filled with a tick,
 * the current one is ringed, upcoming ones are hollow and muted.
 */
export function Timeline({ items, tone = 'success', className }: Props) {
  const fill = tone === 'success' ? 'bg-success' : 'bg-primary';
  const ring = tone === 'success' ? 'border-success' : 'border-primary';
  return (
    <ol className={className}>
      {items.map((item, i) => {
        const last = i === items.length - 1;
        const next = items[i + 1];
        return (
          <li key={`${item.title}-${i}`} className="flex gap-3">
            <span className="flex flex-col items-center" aria-hidden>
              <span
                className={cn(
                  'flex size-6 items-center justify-center rounded-full',
                  item.state === 'done' && fill,
                  item.state === 'current' && cn('bg-background border-2', ring),
                  item.state === 'upcoming' && 'bg-background border-muted-foreground border-2'
                )}>
                {item.state === 'done' ? (
                  <CheckIcon className={cn('size-3.5', tone === 'success' ? 'text-success-foreground' : 'text-primary-foreground')} strokeWidth={3} />
                ) : item.state === 'current' ? (
                  <span className={cn('size-2.5 rounded-full', fill)} />
                ) : null}
              </span>
              {!last ? <span className={cn('min-h-4 w-0.5 flex-1', next && next.state !== 'upcoming' ? fill : 'bg-border')} /> : null}
            </span>
            <span className={cn('flex flex-1 flex-col gap-0.5 pt-0.5', !last && 'pb-5')}>
              <span className={item.state === 'upcoming' ? 'text-muted-foreground' : 'font-medium'}>
                {item.title}
                <span className="sr-only">, {SPOKEN[item.state]}</span>
              </span>
              {item.time ? <span className="text-muted-foreground text-sm">{item.time}</span> : null}
              {item.description ? <span className="text-muted-foreground text-sm">{item.description}</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
