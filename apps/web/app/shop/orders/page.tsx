import type { Metadata } from 'next';
import { OrdersView } from '@/components/shop/orders-view';

export const metadata: Metadata = { title: 'Orders · Shop' };

export default function OrdersPage() {
  return <OrdersView />;
}
