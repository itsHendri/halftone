import { ArrowRightIcon, BlocksIcon, BotIcon, LayoutDashboardIcon, MegaphoneIcon, PaletteIcon, ShoppingBagIcon, TargetIcon, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { CATEGORY_META } from '@/registry/categories';
import { COMPONENTS } from '@/registry/components';

const BROWSE = [
  { href: '/components', icon: BlocksIcon, title: 'Components', body: `${COMPONENTS.length} components in ${CATEGORY_META.length} categories, each with a live demo.` },
  { href: '/foundations', icon: PaletteIcon, title: 'Foundations', body: 'Colour, radius, spacing and type, from tokens/tokens.json.' },
];

// samples:start (npm run eject-samples removes everything up to samples:end)
const SAMPLES = [
  { href: '/dashboard', icon: LayoutDashboardIcon, title: 'Dashboard', body: 'A SaaS app: overview with a chart, an invoices table with filters and a dialog, settings forms.' },
  { href: '/landing', icon: MegaphoneIcon, title: 'Landing page', body: 'Marketing: hero, proof, features, pricing, FAQ and a closing call to action.' },
  { href: '/assistant', icon: BotIcon, title: 'Assistant', body: 'An AI conversation: thinking, a tool call, a streamed answer and an approval before it acts.' },
  { href: '/shop', icon: ShoppingBagIcon, title: 'Shop', body: 'A small store: browse and filter, a product page, a cart, a three-step checkout and order tracking.' },
  { href: '/habits', icon: TargetIcon, title: 'Habits', body: 'A habit tracker: today’s progress, charts, a calendar of perfect days, settings.' },
];
// samples:end

const STEPS = [
  ['Pick from what exists', 'Pages are composed only from registry components. Search Components; DESIGN_SYSTEM.md has the rules for each.'],
  ['Use token names, not values', 'bg-primary, text-muted-foreground, p-4, rounded-lg. Colours follow light and dark automatically.'],
  ['Hand it a brief', 'The transcript-to-prototype skill turns a conversation into pages, using the same rules.'],
];

export default function KitHome() {
  return (
    <div className="flex flex-col gap-12">
      <header className="flex max-w-3xl flex-col gap-3">
        <h1 className="text-4xl font-semibold tracking-tight">Halftone · web</h1>
        <p className="text-muted-foreground text-lg leading-8">
          A themeable Next.js and shadcn/ui starter for web prototypes: dashboards, marketing pages and AI product
          interfaces. Everything a page needs is already here and previewed live.
        </p>
      </header>

      <section aria-labelledby="browse" className="flex flex-col gap-4">
        <h2 id="browse" className="type-large">
          Browse
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {BROWSE.map((l) => (
            <LinkCard key={l.href} {...l} />
          ))}
        </div>
      </section>

      {/* samples:start */}
      <section aria-labelledby="samples" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="samples" className="type-large">
            Sample apps
          </h2>
          <p className="text-muted-foreground text-sm">
            Made-up products, built only from the kit. Remove one with npm run eject-samples -- &lt;name&gt;, or every one
            with npm run eject-samples.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SAMPLES.map((l) => (
            <LinkCard key={l.href} {...l} />
          ))}
        </div>
      </section>
      {/* samples:end */}

      <section aria-labelledby="how" className="flex flex-col gap-4">
        <h2 id="how" className="type-large">
          How it works
        </h2>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="flex flex-col gap-2">
              <span className="bg-primary/10 text-foreground flex size-8 items-center justify-center rounded-full text-sm font-semibold">{i + 1}</span>
              <p className="font-semibold">{title}</p>
              <p className="text-muted-foreground text-sm leading-6">{body}</p>
            </li>
          ))}
        </ol>
        <p className="text-muted-foreground text-sm">DESIGN_SYSTEM.md and AGENTS.md hold the full rules.</p>
      </section>
    </div>
  );
}

function LinkCard({ href, icon: Icon, title, body }: { href: string; icon: LucideIcon; title: string; body: string }) {
  return (
    <Link href={href} className="group focus-visible:ring-ring rounded-xl focus-visible:outline-none focus-visible:ring-2">
      <Card className="group-hover:bg-accent h-full flex-row items-start gap-4 p-5 transition-colors">
        <Icon className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="flex flex-1 flex-col gap-1">
          <span className="flex items-center gap-1 font-semibold">
            {title} <ArrowRightIcon className="size-4" aria-hidden />
          </span>
          <span className="text-muted-foreground text-sm">{body}</span>
        </div>
      </Card>
    </Link>
  );
}
