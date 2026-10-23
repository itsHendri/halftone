'use client';
import { ShoppingCartIcon } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/kit/empty-state';
import { ImageTile } from '@/components/kit/image-tile';
import { SummaryCard } from '@/components/kit/key-value-list';
import { ListGroup } from '@/components/kit/list-group';
import { ListRow } from '@/components/kit/list-row';
import { QuantityStepper } from '@/components/kit/quantity-stepper';
import { Button } from '@/components/ui/button';
import { cartTotal, FREE_DELIVERY_FROM, iconFor, money, productById, SMALL_ORDER_FEE } from './data';
import { shop, useShop } from './store';

export function CartView() {
  const { cart } = useShop();
  const subtotal = cartTotal(cart);
  const fee = subtotal >= FREE_DELIVERY_FROM ? 0 : SMALL_ORDER_FEE;

  if (cart.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCartIcon}
        title="Your cart is empty"
        description="Anything you add from the shop shows up here."
        action={
          <Button asChild>
            <Link href="/shop">Browse the shop</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <h1 className="type-h3">Cart</h1>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <ListGroup>
          {cart.map((line) => {
            const p = productById(line.productId);
            if (!p) return null;
            return (
              <ListRow
                key={line.productId}
                leading={<ImageTile seed={p.seed} fallbackIcon={iconFor(p)} ratio={1} className="w-16 shrink-0" />}
                title={p.name}
                subtitle={`${money(p.price)} each`}
                trailing={<QuantityStepper aria-label={`${p.name} quantity`} value={line.qty} onChange={(q) => shop.setQty(p.id, q)} min={0} max={9} />}
              />
            );
          })}
        </ListGroup>
        <div className="flex flex-col gap-3">
          <SummaryCard
            title="Summary"
            rows={[
              { label: 'Subtotal', value: money(subtotal) },
              { label: 'Delivery', value: fee ? money(fee) : 'Free', valueClassName: fee ? undefined : 'text-success' },
              { label: 'Total', value: money(subtotal + fee) },
            ]}
          />
          <Button asChild size="lg">
            <Link href="/shop/checkout">Checkout</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
