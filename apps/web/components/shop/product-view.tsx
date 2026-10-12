'use client';
import { ChevronLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';
import { ImageTile } from '@/components/kit/image-tile';
import { QuantityStepper } from '@/components/kit/quantity-stepper';
import { Rating } from '@/components/kit/rating';
import { SegmentedControl } from '@/components/kit/segmented-control';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { iconFor, money, type Product } from './data';
import { shop } from './store';

const COLOURS = [
  { value: 'sand', label: 'Sand' },
  { value: 'slate', label: 'Slate' },
  { value: 'moss', label: 'Moss' },
] as const;

export function ProductView({ product: p }: { product: Product }) {
  const router = useRouter();
  const [qty, setQty] = React.useState(1);
  const [colour, setColour] = React.useState<(typeof COLOURS)[number]['value']>('sand');
  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
        <Link href="/shop">
          <ChevronLeftIcon aria-hidden />
          All products
        </Link>
      </Button>
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <ImageTile seed={p.seed} fallbackIcon={iconFor(p)} ratio={4 / 3} />
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="capitalize">
                {p.category}
              </Badge>
              <Rating value={p.rating} showValue count={120} size="sm" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{p.name}</h1>
            <p className="text-2xl font-semibold tabular-nums">{money(p.price)}</p>
            <p className="text-muted-foreground">{p.blurb}</p>
          </div>
          <div className="flex flex-col gap-2">
            <span id="colour" className="text-sm font-medium">
              Colour
            </span>
            <SegmentedControl aria-label="Colour" segments={COLOURS} value={colour} onChange={setColour} className="max-w-sm" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <QuantityStepper aria-label="Quantity" value={qty} onChange={setQty} min={1} max={9} />
            <Button
              size="lg"
              className="flex-1 sm:flex-none"
              onClick={() => {
                shop.add(p.id, qty);
                toast.success(`Added ${qty} to your cart`, { action: { label: 'View cart', onClick: () => router.push('/shop/cart') } });
              }}>
              Add to cart · {money(p.price * qty)}
            </Button>
          </div>
          <Accordion type="single" collapsible>
            <AccordionItem value="details">
              <AccordionTrigger>Details</AccordionTrigger>
              <AccordionContent>Made from responsibly sourced materials. Two-year warranty included.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="shipping">
              <AccordionTrigger>Shipping and returns</AccordionTrigger>
              <AccordionContent>Free standard delivery over $40. 30-day returns, no questions asked.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </>
  );
}
