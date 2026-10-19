import { Logo } from '@/components/kit/logo';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FAQ, FEATURES, PLANS, STUDIOS } from '@/components/landing/data';
import { ProductShot } from '@/components/landing/product-shot';
import { FeatureGrid } from '@/components/kit/feature-grid';
import { Hero } from '@/components/kit/hero';
import { PricingCard } from '@/components/kit/pricing-card';
import { KitChip } from '@/components/site/kit-chip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Northwind · get paid on time' };

const NAV = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

/** Sample: a marketing page (the Marketing page pattern) built only from registry components. */
export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/landing" className="flex items-center gap-2 font-semibold">
            <Logo name="Northwind" />
          </Link>
          <nav aria-label="Page" className="hidden items-center gap-5 text-sm md:flex">
            {NAV.map((l) => (
              <a key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <KitChip />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/dashboard">Sign in</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-24 px-4 pb-24 sm:px-6">
        <Hero
          eyebrow="Invoicing for small studios"
          title="Get paid on time, without the chasing"
          description="Northwind sends your invoices, nudges late payers politely and shows you what’s coming in. You do the work; it does the admin."
          actions={
            <>
              <Button asChild size="lg">
                <Link href="/dashboard">Start your free trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#pricing">See pricing</a>
              </Button>
            </>
          }
          media={<ProductShot />}
        />

        <section aria-labelledby="proof" className="flex flex-col items-center gap-6 text-center">
          <h2 id="proof" className="text-muted-foreground text-sm font-medium">
            2,400 studios get paid with Northwind
          </h2>
          <ul className="flex flex-wrap justify-center gap-x-10 gap-y-3">
            {STUDIOS.map((s) => (
              <li key={s} className="text-muted-foreground text-lg font-semibold tracking-tight">
                {s}
              </li>
            ))}
          </ul>
          <figure className="mt-6 flex max-w-2xl flex-col gap-4">
            <blockquote className="text-xl leading-9 text-balance">
              “We used to spend Friday afternoons chasing money. Now the reminders go out on their own and our average
              invoice gets paid nine days sooner.”
            </blockquote>
            <figcaption className="text-muted-foreground text-sm">Priya Shah, founder of Lumen Labs</figcaption>
          </figure>
        </section>

        <section id="features" aria-labelledby="features-title" className="flex scroll-mt-20 flex-col gap-10">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 id="features-title" className="text-3xl font-semibold tracking-tight">
              The admin, handled
            </h2>
            <p className="text-muted-foreground text-lg leading-8">Three jobs nobody started a studio to do.</p>
          </div>
          <FeatureGrid features={FEATURES} />
        </section>

        <section id="pricing" aria-labelledby="pricing-title" className="flex scroll-mt-20 flex-col gap-10">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 id="pricing-title" className="text-3xl font-semibold tracking-tight">
              Simple pricing
            </h2>
            <p className="text-muted-foreground text-lg leading-8">Start free. Pay when it’s saving you time.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {PLANS.map((p) => (
              <PricingCard
                key={p.name}
                {...p}
                action={
                  <Button asChild className="w-full" variant={p.highlighted ? 'default' : 'outline'}>
                    <Link href="/dashboard">{p.price === '£0' ? 'Start for free' : `Try ${p.name} free`}</Link>
                  </Button>
                }
              />
            ))}
          </div>
        </section>

        <section id="faq" aria-labelledby="faq-title" className="grid scroll-mt-20 gap-10 lg:grid-cols-[1fr_2fr]">
          <h2 id="faq-title" className="text-3xl font-semibold tracking-tight">
            Questions
          </h2>
          <Accordion type="single" collapsible>
            {FAQ.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-base">{q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-7">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section aria-labelledby="cta-title" className="bg-muted/60 flex flex-col items-center gap-5 rounded-2xl px-6 py-16 text-center">
          <h2 id="cta-title" className="text-3xl font-semibold tracking-tight text-balance">
            Your next invoice could chase itself
          </h2>
          <p className="text-muted-foreground max-w-xl text-lg">Free for 30 days. No card, no setup call.</p>
          <Button asChild size="lg">
            <Link href="/dashboard">Start your free trial</Link>
          </Button>
        </section>
      </main>

      <footer className="border-border border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Northwind is a made-up product: a sample in Halftone.</p>
          <nav aria-label="Footer" className="flex gap-5">
            {NAV.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-foreground">
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
