import { ArrowRightIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import { CopyPrompt } from "@/components/copy-prompt";
import { HeroField } from "@/components/halftone/hero-field";
import { MarkCard } from "@/components/halftone/mark-card";
import { BrowserFrame } from "@/components/browser-frame";
import { PhoneFrame } from "@/components/phone-frame";
import { phoneFrameHeight } from "@/lib/device";
import { ShowcaseFrame } from "@/components/showcase-frame";
import { KitBadges } from "@/components/kit-availability";
import { CATALOGUE, entriesIn, GROUPS, SIDES } from "@/lib/catalogue";
import { colorNames, kit } from "@/lib/kit";

const STEPS = [
  {
    title: "Give an agent a brief",
    body: "A meeting transcript, a few notes, or the brief wizard on this site. Your agent turns it into a brief and a screen list, then waits for your go-ahead before any code.",
  },
  {
    title: "It builds from the registry only",
    body: `${CATALOGUE.length} registered components across the native and web kits, each with an API, usage notes and a live demo. If something is missing, the agent says so instead of inventing it.`,
  },
  {
    title: "You get both, on one brand",
    body: "Light and dark, on your brand, on a phone and in a browser. Both kits read the same tokens, so a colour or radius changed once changes everywhere, and lint keeps every screen on them.",
  },
];

const GUARDRAILS = [
  [
    "One token file",
    `tokens.json (W3C format) builds the CSS variables, TypeScript theme, Figma variables and DESIGN.md. ${colorNames.length} semantic colours, no hex in screens.`,
  ],
  [
    "Contrast, checked on every build",
    "The token build checks every pairing where text sits on its surface, or a status colour is used as text, against WCAG AA in both themes, and names any that fall short. Halftone's own kits build strict, so they never ship below AA.",
  ],
  [
    "A registry agents can read",
    "DESIGN_SYSTEM.md, llms.txt and a shadcn registry are generated from one list, so the docs, the agent and the code never disagree.",
  ],
  [
    "Rules in lint",
    "Raw colours, imports outside the registry and stray UI libraries are ESLint errors in every screen, so an agent hears about them while it writes, not in review. qc-pass then looks at the screens in both themes.",
  ],
];

export default function HomePage() {
  return (
    <main className="flex w-full flex-col">
      {/* Hero */}
      {/* The lit dot grid (components/halftone) behind the hero: the halftone idea, in the drifting colour. */}
      <div className="relative isolate overflow-hidden">
        <HeroField />
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 pb-12 pt-14 text-center md:px-6 md:pt-20">
          <Link
            href="/themes"
            className="border-border bg-card hover:bg-accent focus-visible:ring-ring inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium focus-visible:outline-none focus-visible:ring-2"
          >
            New: the typeset is part of the theme{" "}
            <ArrowRightIcon className="size-3.5" aria-hidden />
          </Link>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            One brand. Phone and web. Built by your agent.
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg leading-8 text-balance">
            {kit.name} is two kits on one set of design tokens: Expo for the
            phone, Next.js for the web. Your agent builds from the components
            they ship, in your theme, light and dark, and lint stops it the
            moment it reaches for a raw colour or a component that isn&apos;t
            there.
          </p>
          <CopyPrompt className="w-full max-w-2xl text-left" />
          <p className="text-muted-foreground text-sm">
            Have a brief or a transcript?{" "}
            <Link
              href="/brief"
              className="text-foreground focus-visible:ring-ring rounded-sm font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2"
            >
              Start a prototype from it
            </Link>
          </p>
        </section>
        {/* The copy button above is the one primary action; these two follow it. The theme bar steps aside on phones. */}
        <div
          data-theme-bar-avoid
          className="border-border divide-border mx-auto mb-14 grid w-[calc(100%-2rem)] max-w-5xl divide-y overflow-hidden rounded-xl border sm:grid-cols-2 sm:divide-x sm:divide-y-0 md:mb-20"
        >
          <MarkCard
            href="/components"
            title={`Browse ${CATALOGUE.length} components`}
          >
            Every one is the kit running live, in your theme.
          </MarkCard>
          <MarkCard href="/docs" title="How it works">
            Brief in, prototype out, inside what the kit ships.
          </MarkCard>
        </div>
      </div>

      {/* The kits, live: every card below is a real registry component, themed by the bar at the bottom. */}
      <section
        aria-labelledby="live"
        className="border-border bg-muted/50 border-y"
      >
        <h2 id="live" className="sr-only">
          Live components
        </h2>
        {/* Components only: they work in both kits, so they explain the system without a device beside them. */}
        <div className="mx-auto w-full max-w-[1600px]">
          <ShowcaseFrame title="Web kit components, live" />
        </div>
      </section>
      <p className="text-muted-foreground mx-auto max-w-2xl px-4 pt-4 text-center text-sm">
        Every card is the web kit running live. Change the theme with the bar at
        the bottom, or open the{" "}
        <Link
          href="/themes"
          className="text-foreground underline underline-offset-4"
        >
          theme studio
        </Link>
        .
      </p>

      <div className="mx-auto flex w-full max-w-site flex-col gap-24 px-4 py-20 md:px-6">
        {/* How it works */}
        <section aria-labelledby="how" className="flex flex-col gap-8">
          <h2
            id="how"
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            Brief in, prototype out
          </h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex flex-col gap-3">
                <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full text-sm font-semibold">
                  {i + 1}
                </span>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-muted-foreground leading-7">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Screens */}
        <section aria-labelledby="screens" className="flex flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex max-w-2xl flex-col gap-2">
              <h2
                id="screens"
                className="text-2xl font-semibold tracking-tight sm:text-3xl"
              >
                Sample apps, built only from the kits
              </h2>
              <p className="text-muted-foreground leading-7">
                A shop, a habit tracker and Northwind, a made-up invoicing
                product, each built with both kits. They are the worked examples
                an agent copies the structure of. All live, all following this
                page&apos;s theme.
              </p>
            </div>
            <Link
              href="/screens"
              className="text-primary inline-flex items-center gap-1 text-sm font-medium"
            >
              All screens <ArrowRightIcon className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start">
            <PhoneFrame
              path="/northwind"
              title="Northwind on a phone, live"
              width={260}
            />
            {/* As tall as the phone beside it, so the pair reads as one row. */}
            <BrowserFrame
              path="/dashboard"
              title="Northwind on the web, live"
              className="lg:flex-1"
              height={phoneFrameHeight(260)}
            />
          </div>
        </section>

        {/* Catalogue */}
        <section aria-labelledby="catalogue" className="flex flex-col gap-8">
          <div className="flex max-w-2xl flex-col gap-2">
            <h2
              id="catalogue"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Everything a screen needs, and nothing else
            </h2>
            <p className="text-muted-foreground leading-7">
              {CATALOGUE.length} components, live and themed, each marked
              Native, Web or both: list rows, sheets, a camera and Face ID in
              the native kit; app shells, data tables, pricing and AI chat with
              tool calls and approvals on the web.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GROUPS.map((g) => {
              const entries = entriesIn(g.id);
              if (!entries.length) return null;
              const sides = SIDES.filter((side) =>
                entries.some((e) => e.sides.includes(side)),
              );
              return (
                <li key={g.id}>
                  <Link
                    href={`/components#${g.id}`}
                    className="border-border bg-card hover:bg-accent focus-visible:ring-ring flex h-full flex-col gap-2 rounded-xl border p-4 focus-visible:outline-none focus-visible:ring-2"
                  >
                    <span className="flex items-start justify-between gap-4">
                      <span className="font-medium">{g.label}</span>
                      <span className="bg-muted rounded-full px-2.5 py-0.5 text-sm tabular-nums">
                        {entries.length}
                      </span>
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {g.blurb}
                    </span>
                    <KitBadges sides={sides} />
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href="/components"
            className="text-primary inline-flex items-center gap-1 self-start text-sm font-medium"
          >
            All {CATALOGUE.length} components{" "}
            <ArrowRightIcon className="size-4" aria-hidden />
          </Link>
        </section>

        {/* Guardrails */}
        <section aria-labelledby="guardrails" className="flex flex-col gap-8">
          <h2
            id="guardrails"
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            Guardrails, not guidelines
          </h2>
          <ul className="grid gap-6 md:grid-cols-2">
            {GUARDRAILS.map(([title, body]) => (
              <li key={title} className="flex gap-3">
                <CheckIcon
                  className="text-success mt-1 size-5 shrink-0"
                  aria-hidden
                />
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-muted-foreground mt-1 leading-7">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Platforms */}
        <section
          aria-labelledby="platforms"
          className="grid gap-6 md:grid-cols-2"
        >
          <h2 id="platforms" className="sr-only">
            Platforms
          </h2>
          <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-6">
            <p className="text-success text-sm font-semibold">Available</p>
            <h3 className="text-xl font-semibold">Native kit</h3>
            <p className="text-muted-foreground leading-7">
              Expo, React Native and NativeWind on react-native-reusables. Runs
              on a phone through Expo Go or a development build, and in the
              browser.
            </p>
            <Link
              href="/docs/mobile"
              className="text-primary mt-auto inline-flex items-center gap-1 text-sm font-medium"
            >
              Native setup <ArrowRightIcon className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-6">
            <p className="text-success text-sm font-semibold">Available</p>
            <h3 className="text-xl font-semibold">Web kit</h3>
            <p className="text-muted-foreground leading-7">
              Next.js, Tailwind 4 and shadcn/ui on the same tokens: dashboards,
              marketing pages, AI product screens and the web version of a
              mobile prototype, from one brand file.
            </p>
            <Link
              href="/docs/web"
              className="text-primary mt-auto inline-flex items-center gap-1 text-sm font-medium"
            >
              Web setup <ArrowRightIcon className="size-4" aria-hidden />
            </Link>
          </div>
        </section>

        {/* For agents */}
        <section
          aria-labelledby="agents"
          className="border-border flex flex-col gap-4 rounded-2xl border p-6 sm:p-8"
        >
          <h2 id="agents" className="text-2xl font-semibold tracking-tight">
            Built to be read by agents
          </h2>
          <p className="text-muted-foreground max-w-3xl leading-7">
            Everything on this site is also available as plain text: the install
            guide an agent follows, an index of every component with its API,
            and shadcn registries so an existing Expo or Next.js app can pull in
            single components.
          </p>
          <ul className="flex flex-wrap gap-3 text-sm">
            {[
              ["/install.md", "install.md"],
              ["/llms.txt", "llms.txt"],
              ["/llms-full.txt", "llms-full.txt"],
              ["/r/native/registry.json", "r/native"],
              ["/r/web/registry.json", "r/web"],
            ].map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  className="bg-muted hover:bg-accent rounded-full px-3 py-1.5 font-mono"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <footer className="text-muted-foreground border-border flex flex-wrap justify-between gap-4 border-t pt-8 text-sm">
          <p>
            {kit.name} is MIT licensed.{" "}
            <a href={kit.repo} className="underline underline-offset-4">
              Source on GitHub
            </a>
            .
          </p>
          <p>
            Questions, ideas or a project in mind?{" "}
            <a
              href={`${kit.repo}/issues`}
              className="underline underline-offset-4"
            >
              Open an issue
            </a>
            .
          </p>
        </footer>
      </div>
    </main>
  );
}
