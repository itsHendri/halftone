import type { Metadata } from 'next';
import Link from 'next/link';
import { BrowserFrame } from '@/components/browser-frame';
import { PhoneFrame } from '@/components/phone-frame';
import { kit } from '@/lib/kit';

export const metadata: Metadata = {
  title: 'Screens',
  description: `Sample apps and screens built only from the ${kit.name} mobile and web kits, running live.`,
};

const MOBILE = [
  { path: '/shop', title: 'Shop: browse', note: 'Filter chips, product tiles, the shop’s own tab bar.' },
  { path: '/shop/cart', title: 'Shop: cart', note: 'List rows, quantity steppers, a sticky checkout bar.' },
  { path: '/habits', title: 'Habits: today', note: 'Progress rings, selectable cards, daily goals.' },
  { path: '/habits/insights', title: 'Habits: insights', note: 'Charts and stat tiles on the same tokens.' },
  { path: '/kitchen-sink?open=inputs', title: 'Kitchen Sink: inputs', note: 'Every field, toggle and picker in the kit.' },
  { path: '/foundations?open=color', title: 'Foundations: colour', note: 'The semantic tokens, light and dark.' },
];

const WEB = [
  { path: '/dashboard', title: 'Dashboard: overview', note: 'AppShell, stat tiles, a stacked chart, recent invoices.' },
  { path: '/dashboard/invoices', title: 'Dashboard: invoices', note: 'Status tabs, search, a sortable table, row actions and a dialog.' },
  { path: '/landing', title: 'Landing page', note: 'Hero, proof, features, pricing, FAQ, one call to action.' },
  { path: '/assistant', title: 'Assistant', note: 'Thinking, a tool call, a streamed answer, an approval before it acts.' },
];

export default function ScreensPage() {
  return (
    <main className="mx-auto flex w-full max-w-site flex-col gap-16 px-4 py-12 md:px-6 md:py-16">
      <header className="flex max-w-3xl flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Screens</h1>
        <p className="text-muted-foreground text-lg leading-8">
          The sample apps are built only from the kits and are the worked examples an agent follows. Every frame below is
          the real app running in the browser: scroll, click and type in it. They follow this site&apos;s theme.
        </p>
      </header>
      {/* Jump to either half; sticks under the top bar (apps/docs/design/navigation-wireframes.md). */}
      <nav aria-label="Platforms" className="bg-fd-background/80 sticky top-14 z-20 -mx-1 -my-12 flex gap-2 px-1 py-3 backdrop-blur-sm">
        <a href="#mobile" className="border-border hover:bg-accent rounded-full border px-3.5 py-1 text-sm font-medium">
          Mobile · {MOBILE.length}
        </a>
        <a href="#web" className="border-border hover:bg-accent rounded-full border px-3.5 py-1 text-sm font-medium">
          Web · {WEB.length}
        </a>
      </nav>

      <section aria-labelledby="mobile" className="flex scroll-mt-32 flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 id="mobile" className="scroll-mt-32 text-2xl font-semibold tracking-tight">
            Mobile
          </h2>
          <p className="text-muted-foreground text-sm">
            On a phone: clone the kit and run it in Expo Go or a development build. See{' '}
            <Link href="/docs/mobile" className="underline underline-offset-4">
              Native setup
            </Link>
            .
          </p>
        </div>
        <ul className="grid justify-items-center gap-12 sm:grid-cols-2 lg:grid-cols-3">
          {MOBILE.map((s) => (
            <li key={s.path} className="flex flex-col items-center gap-3">
              <PhoneFrame path={s.path} title={`${s.title}, live`} width={270} />
              <div className="max-w-[270px] text-center">
                <p className="font-medium">{s.title}</p>
                <p className="text-muted-foreground text-sm">{s.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="web" className="flex scroll-mt-32 flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 id="web" className="scroll-mt-32 text-2xl font-semibold tracking-tight">
            Web
          </h2>
          <p className="text-muted-foreground text-sm">
            Northwind, a made-up invoicing product, three ways. Run it yourself with{' '}
            <Link href="/docs/web" className="underline underline-offset-4">
              Web setup
            </Link>
            .
          </p>
        </div>
        <ul className="grid gap-12 lg:grid-cols-2">
          {WEB.map((s) => (
            <li key={s.path} className="flex min-w-0 flex-col gap-3">
              <BrowserFrame path={s.path} title={`${s.title}, live`} />
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-muted-foreground text-sm">{s.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
