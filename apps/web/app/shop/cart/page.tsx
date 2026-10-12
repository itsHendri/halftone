import type { Metadata } from 'next';
import { CartView } from '@/components/shop/cart-view';

export const metadata: Metadata = { title: 'Cart · Shop' };

export default function CartPage() {
  return <CartView />;
}
