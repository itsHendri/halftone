'use client';
import { ChevronLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';
import { SummaryCard } from '@/components/kit/key-value-list';
import { Rating } from '@/components/kit/rating';
import { Timeline, type TimelineItem } from '@/components/kit/timeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { money, productById } from './data';
import { OrderBadge } from './orders-view';
import { useShop } from './store';

const STEPS = ['processing', 'shipped', 'delivered'] as const;
const LABEL = { processing: 'Order confirmed', shipped: 'On its way', delivered: 'Delivered' } as const;
/** Mock times per step; a real app gets these from the order. */
const WHEN = { processing: 'Placed', shipped: 'With the courier', delivered: 'Left at the front door' } as const;

/** One order: its status as a Timeline, a rating once delivered, and the items. `?id=` picks it. */
export function OrderView() {
  const id = useSearchParams().get('id');
  const { orders } = useShop();
  const o = orders.find((x) => x.id === id) ?? orders[0];
  const [stars, setStars] = React.useState(0);
  const reached = STEPS.indexOf(o.status);
  const steps: TimelineItem[] = STEPS.map((s, i) => ({
    title: LABEL[s],
    time: i === 0 ? `${WHEN[s]} ${o.placedAt}` : i <= reached ? WHEN[s] : i === reached + 1 ? 'Next' : undefined,
    state: i < reached || (i === reached && s === 'delivered') ? 'done' : i === reached ? 'current' : 'upcoming',
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
        <Link href="/shop/orders">
          <ChevronLeftIcon aria-hidden />
          Orders
        </Link>
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Order {o.id}</h1>
        <OrderBadge status={o.status} />
      </div>
      <div className="grid items-start gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Timeline items={steps} />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-6">
          <SummaryCard
            title="Items"
            rows={[...o.items.map((l) => ({ label: `${productById(l.productId)?.name} × ${l.qty}`, value: money((productById(l.productId)?.price ?? 0) * l.qty) })), { label: 'Total', value: money(o.total) }]}
          />
          {o.status === 'delivered' ? (
            <Card>
              <CardHeader>
                <CardTitle>How was your order?</CardTitle>
              </CardHeader>
              <CardContent>
                <Rating
                  aria-label="Rate your order"
                  value={stars}
                  onChange={(n) => {
                    setStars(n);
                    toast.success(`Thanks, you rated it ${n} of 5`);
                  }}
                />
              </CardContent>
            </Card>
          ) : null}
          <Button variant="outline" className="self-start" onClick={() => toast('Support chat is not part of the sample')}>
            Get help
          </Button>
        </div>
      </div>
    </div>
  );
}
