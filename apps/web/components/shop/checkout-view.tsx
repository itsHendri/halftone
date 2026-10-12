'use client';
import { TruckIcon, ZapIcon } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { SummaryCard } from '@/components/kit/key-value-list';
import { SelectableCard } from '@/components/kit/selectable-card';
import { Stepper } from '@/components/kit/stepper';
import { SuccessScreen } from '@/components/kit/success-screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cartTotal, DELIVERY, money, productById } from './data';
import { shop, useShop } from './store';

type Step = 'address' | 'delivery' | 'review' | 'done';
const STEPS = ['address', 'delivery', 'review'] as const;

/** Multi-step checkout: one route, a Step state machine, one Stepper (DESIGN_SYSTEM.md › Patterns). */
export function CheckoutView() {
  const { cart } = useShop();
  const [step, setStep] = React.useState<Step>('address');
  const [name, setName] = React.useState('Jane Doe');
  const [address, setAddress] = React.useState('12 Orchard Lane');
  const [city, setCity] = React.useState('Cape Town');
  const [delivery, setDelivery] = React.useState<(typeof DELIVERY)[number]['id']>('standard');
  const [orderId, setOrderId] = React.useState('');
  const shipping = DELIVERY.find((d) => d.id === delivery)!;
  const total = cartTotal(cart) + shipping.price;

  if (step === 'done') {
    return (
      <SuccessScreen title="Order placed" body={`Order ${orderId} is being prepared. We will let you know when it ships.`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href={`/shop/order?id=${orderId}`}>Track order</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/shop">Keep shopping</Link>
          </Button>
        </div>
      </SuccessScreen>
    );
  }

  const next = () => setStep(STEPS[STEPS.indexOf(step as (typeof STEPS)[number]) + 1]);
  const back = () => setStep(STEPS[STEPS.indexOf(step as (typeof STEPS)[number]) - 1]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
      <Stepper current={STEPS.indexOf(step) + 1} total={3} labels={['Address', 'Delivery', 'Review']} />
      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (step !== 'review') return next();
          setOrderId(shop.placeOrder(shipping.price).id);
          setStep('done');
        }}>
        {step === 'address' ? (
          <fieldset className="flex flex-col gap-4">
            <legend className="sr-only">Delivery address</legend>
            <div className="flex flex-col gap-2">
              <Label htmlFor="co-name">Full name</Label>
              <Input id="co-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="co-address">Street address</Label>
              <Input id="co-address" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="address-line1" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="co-city">City</Label>
              <Input id="co-city" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" required />
            </div>
          </fieldset>
        ) : null}
        {step === 'delivery' ? (
          <div role="radiogroup" aria-label="Delivery" className="flex flex-col gap-3">
            {DELIVERY.map((d) => (
              <SelectableCard key={d.id} icon={d.id === 'express' ? ZapIcon : TruckIcon} title={d.label} description={d.description} detail={d.price ? money(d.price) : 'Free'} selected={delivery === d.id} onClick={() => setDelivery(d.id)} />
            ))}
          </div>
        ) : null}
        {step === 'review' ? (
          <SummaryCard
            title="Order summary"
            rows={[
              ...cart.map((l) => ({ label: `${productById(l.productId)?.name} × ${l.qty}`, value: money((productById(l.productId)?.price ?? 0) * l.qty) })),
              { label: shipping.label, value: shipping.price ? money(shipping.price) : 'Free', valueClassName: shipping.price ? undefined : 'text-success' },
              { label: 'Deliver to', value: `${name}, ${address}, ${city}` },
              { label: 'Total', value: money(total) },
            ]}
          />
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {step === 'address' ? (
            <Button asChild variant="outline">
              <Link href="/shop/cart">Back to cart</Link>
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={back}>
              Back
            </Button>
          )}
          <Button type="submit" disabled={step === 'review' && cart.length === 0}>
            {step === 'review' ? `Pay ${money(total)}` : 'Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
}
