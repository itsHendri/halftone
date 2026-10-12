import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OrderView } from '@/components/shop/order-view';

export const metadata: Metadata = { title: 'Order · Shop' };

/** `/shop/order?id=A1042`: a query, not a segment, so orders placed in the session open in the static export. */
export default function OrderPage() {
  return (
    <Suspense>
      <OrderView />
    </Suspense>
  );
}
