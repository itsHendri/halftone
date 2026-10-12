import type { Metadata } from 'next';
import { ShopShell } from '@/components/shop/shell';

export const metadata: Metadata = { title: 'Shop' };

/** Sample: a small store (browse, product, cart, checkout, orders), the web half of the native kit's shop. */
export default function ShopLayout({ children }: LayoutProps<'/shop'>) {
  return <ShopShell>{children}</ShopShell>;
}
