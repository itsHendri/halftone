import type { Metadata } from 'next';
import Link from 'next/link';
import { BrowserFrame } from '@/components/browser-frame';
import { type PairScreen, ScreenPair } from '@/components/screen-pair';
import { kit } from '@/lib/kit';

export const metadata: Metadata = {
  title: 'Screens',
  description: `Three sample products built only from the ${kit.name} kits, each live on a phone and in a browser.`,
};

type Product = { id: string; name: string; blurb: string; screens: PairScreen[] };

/** Each sample product, with the screens both kits have. Routes are each kit's own. */
const PRODUCTS: Product[] = [
  {
    id: 'shop',
    name: 'Shop',
    blurb: 'A small store: browse and filter, a product page, the cart, a three-step checkout and order tracking.',
    screens: [
      { label: 'Browse', native: '/shop', web: '/shop', note: 'Search, filter chips and product tiles with generated art.' },
      { label: 'Product', native: '/shop/product/lamp', web: '/shop/product/lamp', note: 'A rating, a segmented colour picker, a quantity stepper and the add-to-cart action.' },
      { label: 'Cart', native: '/shop/cart', web: '/shop/cart', note: 'List rows with quantity steppers and a summary card. Free delivery over $40.' },
      { label: 'Orders', native: '/shop/orders', web: '/shop/orders', note: 'Each order with a status badge; open one for its timeline.' },
    ],
  },
  {
    id: 'habits',
    name: 'Habits',
    blurb: 'A habit tracker: today’s progress, a habit’s own page, charts, a calendar of perfect days and settings.',
    screens: [
      { label: 'Today', native: '/habits', web: '/habits', note: 'A progress ring, stat tiles and the day’s habits with checkboxes.' },
      { label: 'Habit', native: '/habits/habit/water', web: '/habits/habit?id=water', note: 'Today’s count, the streak, the last 30 days, a reminder and the daily goal.' },
      { label: 'Insights', native: '/habits/insights', web: '/habits/insights', note: 'A week/month switch over bar, line and donut charts on the chart tokens.' },
      { label: 'Calendar', native: '/habits/calendar', web: '/habits/calendar', note: 'The month, with every perfect day marked.' },
    ],
  },
  {
    id: 'northwind',
    name: 'Northwind',
    blurb: 'A made-up invoicing product for small studios: what’s outstanding, the invoices and the settings.',
    screens: [
      { label: 'Overview', native: '/northwind', web: '/dashboard', note: 'Outstanding and overdue, paid by month, the latest invoices. On the web, inside an app shell.' },
      { label: 'Invoices', native: '/northwind/invoices', web: '/dashboard/invoices', note: 'Status filters and search. A list on the phone, a sortable table with bulk actions on the web.' },
      { label: 'Settings', native: '/northwind/settings', web: '/dashboard/settings', note: 'Payment terms, reminders and the studio.' },
    ],
  },
];

const NORTHWIND_WEB = [
  { path: '/landing', title: 'Landing page', note: 'Hero, proof, features, pricing, FAQ, one call to action.' },
  { path: '/assistant', title: 'Assistant', note: 'Thinking, a tool call, a streamed answer, an approval before it acts.' },
];

export default function ScreensPage() {
  return (
    <main className="mx-auto flex w-full max-w-site flex-col gap-16 px-4 py-12 md:px-6 md:py-16">
      <header className="flex max-w-3xl flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Screens</h1>
        <p className="text-muted-foreground text-lg leading-8">
          Three sample products, each built twice from the same tokens: once with the Native kit, once with the Web kit.
          They are the worked examples an agent follows. Every frame is the real app running in the browser, so you can
          scroll, click and type in it, and it follows this site&apos;s theme. Pick a screen to move both devices to it.
        </p>
        <p className="text-muted-foreground text-sm">
          Run them yourself: <Link href="/docs/mobile" className="underline underline-offset-4">Native setup</Link> ·{' '}
          <Link href="/docs/web" className="underline underline-offset-4">Web setup</Link>
        </p>
      </header>
      {/* Jump to a product; sticks under the top bar (apps/docs/design/navigation-wireframes.md). */}
      <nav aria-label="Products" className="bg-background/80 sticky top-14 z-20 -mx-1 -my-12 flex flex-wrap gap-2 px-1 py-3 backdrop-blur-sm">
        {PRODUCTS.map((p) => (
          <a key={p.id} href={`#${p.id}`} className="border-border hover:bg-accent rounded-full border px-3.5 py-1 text-sm font-medium">
            {p.name}
          </a>
        ))}
      </nav>

      {PRODUCTS.map((p) => (
        <section key={p.id} aria-labelledby={p.id} className="flex scroll-mt-32 flex-col gap-6">
          <div className="flex max-w-3xl flex-col gap-2">
            <h2 id={p.id} className="scroll-mt-32 text-2xl font-semibold tracking-tight">
              {p.name}
            </h2>
            <p className="text-muted-foreground">{p.blurb}</p>
          </div>
          <ScreenPair product={p.name} screens={p.screens} />
          {p.id === 'northwind' ? (
            <div className="flex flex-col gap-4 pt-4">
              <h3 className="text-lg font-semibold">On the web, Northwind also has</h3>
              <ul className="grid gap-12 lg:grid-cols-2">
                {NORTHWIND_WEB.map((s) => (
                  <li key={s.path} className="flex min-w-0 flex-col gap-3">
                    <BrowserFrame path={s.path} title={`Northwind ${s.title.toLowerCase()}, live`} />
                    <div>
                      <p className="font-medium">{s.title}</p>
                      <p className="text-muted-foreground text-sm">{s.note}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ))}
    </main>
  );
}
