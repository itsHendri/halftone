'use client';
import { PackageIcon } from 'lucide-react';
import { EmptyState } from '@/components/kit/empty-state';
import { IconCircle } from '@/components/kit/icon-circle';
import { ListGroup } from '@/components/kit/list-group';
import { ListRow } from '@/components/kit/list-row';
import { StatusDot } from '@/components/kit/status-dot';
import { Badge } from '@/components/ui/badge';
import { cartCount, money, type OrderStatus } from './data';
import { useShop } from './store';

export const ORDER_TONE: Record<OrderStatus, 'warning' | 'info' | 'success'> = { processing: 'warning', shipped: 'info', delivered: 'success' };

/** A status as an outline Badge with a coloured dot: the word stays in foreground text for contrast. */
export function OrderBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className="capitalize">
      <StatusDot tone={ORDER_TONE[status]} size="sm" />
      {status}
    </Badge>
  );
}

export function OrdersView() {
  const { orders } = useShop();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
      {orders.length ? (
        <ListGroup>
          {orders.map((o) => (
            <ListRow
              key={o.id}
              leading={<IconCircle as={PackageIcon} />}
              title={`Order ${o.id}`}
              subtitle={`${o.placedAt} · ${cartCount(o.items)} item${cartCount(o.items) === 1 ? '' : 's'} · ${money(o.total)}`}
              trailing={<OrderBadge status={o.status} />}
              chevron
              href={`/shop/order?id=${o.id}`}
            />
          ))}
        </ListGroup>
      ) : (
        <EmptyState icon={PackageIcon} title="No orders yet" description="Your orders and their delivery status will appear here." />
      )}
    </div>
  );
}
