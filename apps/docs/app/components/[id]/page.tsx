import { Callout } from 'fumadocs-ui/components/callout';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'fumadocs-ui/components/tabs';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/notebook/page';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { InlineMd } from '@/components/inline-md';
import { KitPanel, KitSwitch, PreviewBlock } from '@/components/kit-availability';
import { KitStage } from '@/components/kit-stage';
import { MovedTo } from '@/components/moved-to';
import { PhoneFrame } from '@/components/phone-frame';
import { CATALOGUE, entryUrl, getEntry, groupOf, MOVED, partAnchor, PLATFORM_OF, SCREEN_LEVEL, SIDE_LABEL, stageMinHeight, type Entry, type Side } from '@/lib/catalogue';
import demoSources from '@/lib/generated/demo-sources.json';
import { kits, registryItemFor, sourceUrl, type KitComponent, type Platform } from '@/lib/kit';
import { site } from '@/lib/llms';
import { codeThemes } from '@/lib/shared';

export const dynamicParams = false;

export function generateStaticParams() {
  // The merged components' old slugs too (MOVED): each is a page that sends you on to its block.
  return [...CATALOGUE.map((e) => ({ id: e.id })), ...Object.keys(MOVED).map((id) => ({ id }))];
}

async function resolve(props: PageProps<'/components/[id]'>) {
  const { id } = await props.params;
  const e = getEntry(id);
  if (!e) notFound();
  return e;
}

/** `/components/line-chart/` → `/components/chart/#native-line-chart`. */
const movedUrl = (id: string) => {
  const [entry, hash] = MOVED[id].split('#');
  return `${entryUrl(entry)}/#${hash}`;
};

export async function generateMetadata(props: PageProps<'/components/[id]'>): Promise<Metadata> {
  const { id } = await props.params;
  if (MOVED[id]) return { title: 'Components', robots: { index: false }, alternates: { canonical: movedUrl(id) } };
  const e = await resolve(props);
  const c = (e.native ?? e.web)!;
  return { title: `${e.title} · Components`, description: c.notes.replace(/`/g, '') || c.caption };
}

/** Where a component without its own demo on the Components page is shown instead. */
const PREVIEWED_ELSEWHERE: Record<Platform, Record<string, string>> = {
  mobile: {
    text: 'The type scale is previewed in the kit under Foundations › Typography.',
    label: 'Label is shown with every field in Inputs & selection.',
  },
  web: {
    label: 'Label is shown with every field in Inputs & selection.',
    'scroll-area': 'Used inside Command, Select and Sheet rather than on its own.',
  },
};

const upstreamName = (platform: Platform) => (platform === 'mobile' ? 'react-native-reusables' : 'shadcn/ui');

/** Shortens registry dependency URLs for the Details table. */
const depLabel = (d: string) =>
  d.replace(/^https:\/\/reactnativereusables\.com\/r\/nativewind\/(.*)\.json$/, 'rnr/$1').replace(/^https:\/\/ui\.shadcn\.com\/r\/styles\/[^/]+\/(.*)\.json$/, '$1');

/** Real dependencies only: `kit-setup` is a file-less item that carries the install note (registry-build.mjs). */
const realDeps = (item: { registryDependencies?: string[] } | undefined) => (item?.registryDependencies ?? []).filter((d) => !d.endsWith('/kit-setup'));

/** The kit's demo source for a component (scripts/demo-sources.mjs), if it has a named demo. */
const DEMO_SOURCE: Record<Side, Record<string, string>> = demoSources;

export default async function ComponentPage(props: PageProps<'/components/[id]'>) {
  const { id } = await props.params;
  if (MOVED[id]) return <Moved id={id} />;
  const e = await resolve(props);
  const lead = (e.native ?? e.web)!;
  const at = CATALOGUE.indexOf(e);
  const prev = CATALOGUE[at - 1];
  const next = CATALOGUE[at + 1];
  const group = groupOf(e.group);

  return (
    <DocsPage full className="*:mx-auto *:w-full">
      <p className="text-fd-muted-foreground text-sm">{group.label}</p>
      <DocsTitle>{e.title}</DocsTitle>
      <DocsDescription className="mb-0">
        <InlineMd text={lead.notes || lead.caption || ''} />
      </DocsDescription>
      <DocsBody>
        {/* One panel per kit; the switch in the first preview's header picks one (design/navigation-wireframes.md). */}
        <div className="not-prose">
          {e.sides.map((side) => (
            <KitPanel key={side} side={side} sides={e.sides}>
              {e.parts[side].map((c, i) => (
                <Part key={c.id} side={side} e={e} c={c} kitSwitch={i === 0 ? <KitSwitch sides={e.sides} counterparts={e.counterparts} /> : undefined} />
              ))}
            </KitPanel>
          ))}
        </div>

        <nav aria-label="More components" className="not-prose mt-12 flex justify-between gap-4 text-sm">
          {prev ? (
            <Link href={entryUrl(prev.id)} className="hover:text-fd-primary">
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={entryUrl(next.id)} className="hover:text-fd-primary">
              {next.title} →
            </Link>
          ) : null}
        </nav>
        <p className="text-muted-foreground mt-10 text-xs">
          Agents: the whole registry is at <a href={site('/llms.txt')}>/llms.txt</a>.
        </p>
      </DocsBody>
    </DocsPage>
  );
}

/** A merged component's old page: on to its block on the merged one. */
function Moved({ id }: { id: string }) {
  const e = getEntry(MOVED[id].split('#')[0])!;
  return (
    <DocsPage full className="*:mx-auto *:w-full">
      <MovedTo to={movedUrl(id)} />
      <DocsTitle>{e.title}</DocsTitle>
      <DocsDescription>
        This component is now part of{' '}
        <Link href={movedUrl(id)} className="text-fd-foreground underline underline-offset-4">
          {e.title}
        </Link>
        …
      </DocsDescription>
    </DocsPage>
  );
}

/**
 * One kit component: its preview block (Preview | Code), then usage, API, how to get it and the details. A merged
 * entry has several on a side (Chart's Line, Bar and Donut chart): each gets its own heading, and its parts drop a
 * level.
 */
function Part({ side, e, c, kitSwitch }: { side: Side; e: Entry; c: KitComponent; kitSwitch?: React.ReactNode }) {
  const platform = PLATFORM_OF[side];
  const k = kits[platform];
  const item = registryItemFor(platform, c);
  const ours = c.install?.startsWith(`${k.namespace}/`) ?? false;
  const demo = `${k.componentsRoute}?section=${c.id}`;
  const label = `${c.title} (${SIDE_LABEL[side]}), live preview`;
  const several = e.parts[side].length > 1;
  const H = several ? 'h3' : 'h2';
  const heading = several ? 'mb-2 text-base font-semibold' : 'mb-2 text-lg font-semibold';

  let preview: React.ReactNode;
  if (c.preview === false) {
    preview = <Callout title="No live preview">{PREVIEWED_ELSEWHERE[platform][c.id] ?? 'Previewed elsewhere in the kit.'}</Callout>;
  } else if (side === 'native' && SCREEN_LEVEL.has(c.id)) {
    // A whole-screen component reads as one only on a screen.
    preview = (
      <div className="border-border bg-muted-subtle flex justify-center rounded-2xl border p-6">
        <PhoneFrame path={demo} title={label} width={300} />
      </div>
    );
  } else {
    preview = <KitStage kind={platform} path={demo} title={label} minHeight={stageMinHeight(e)} />;
  }
  // The Code tab: the kit's demo, else the API snippet, else no tab.
  const source = DEMO_SOURCE[side][c.id] ?? c.api ?? null;
  const code = source ? <DynamicCodeBlock options={{ themes: codeThemes }} lang="tsx" code={source} /> : null;

  return (
    <section className="flex flex-col gap-8">
      {several ? <h2 className="-mb-4 text-lg font-semibold">{c.title}</h2> : null}
      <PreviewBlock id={partAnchor(side, c.id)} title={several ? 'Preview' : e.title} kitSwitch={kitSwitch} preview={preview} code={code} />

      {c.caption ? (
        <section>
          <H className={heading}>Usage</H>
          <p className="text-fd-foreground leading-7">
            <InlineMd text={c.caption} />
          </p>
        </section>
      ) : null}

      {c.api ? (
        <section>
          <H className={heading}>API</H>
          <DynamicCodeBlock options={{ themes: codeThemes }} lang="tsx" code={c.api} />
        </section>
      ) : null}

      <section>
        <H className={heading}>Get it</H>
        <GetIt platform={platform} c={c} ours={ours} replacesUpstream={replacesUpstream(platform, item)} />
      </section>

      <section>
        <H className={heading}>Details</H>
        <dl className="border-border divide-border divide-y rounded-xl border text-sm">
          <Row term="Exports">
            <InlineMd text={c.exports.map((x) => `\`${x}\``).join(', ')} />
          </Row>
          <Row term="Source">
            {c.files.map((f) => (
              <a key={f} href={sourceUrl(platform, f)} className="block font-mono underline underline-offset-4">
                apps/{platform}/{f}
              </a>
            ))}
          </Row>
          {item?.dependencies?.length ? <Row term="Packages">{item.dependencies.join(', ')}</Row> : null}
          {realDeps(item).length ? <Row term="Installs with">{realDeps(item).map(depLabel).join(', ')}</Row> : null}
          {c.aliases?.length ? <Row term="Also searched as">{c.aliases.join(', ')}</Row> : null}
          {c.install && !ours ? <Row term="Upstream">Unchanged from {upstreamName(platform)}; installs from their registry.</Row> : null}
          {c.republished ? (
            <Row term="Upstream">
              Unchanged from {upstreamName(platform)}. The kit publishes its own copy so it brings the kit&apos;s versions of the files it uses; {upstreamName(platform)}&apos;s
              would replace them.
            </Row>
          ) : null}
          {ours && c.install ? (
            <Row term="Registry JSON">
              <a href={`${k.registryPath}/${c.install.slice(k.namespace.length + 1)}.json`} className="font-mono underline underline-offset-4">
                {k.registryPath}/{c.install.slice(k.namespace.length + 1)}.json
              </a>
            </Row>
          ) : null}
        </dl>
      </section>
    </section>
  );
}

/** True when installing the item also swaps in the kit's versions of upstream files (shadcn asks to overwrite). */
function replacesUpstream(platform: Platform, item: ReturnType<typeof registryItemFor>) {
  const ns = kits[platform].namespace;
  return realDeps(item).some((d) => d.startsWith(`${ns}/`) && !d.includes('/lib-') && !d.includes('/hook-') && !d.endsWith('/theme'));
}

function GetIt({ platform, c, ours, replacesUpstream }: { platform: Platform; c: KitComponent; ours: boolean; replacesUpstream: boolean }) {
  const command = c.install ? `npx shadcn@latest add ${c.install}` : null;
  const existing = platform === 'mobile' ? 'Existing Expo app' : 'Existing React app';
  return (
    // Explicit values: Fumadocs builds tab ids from the label and only replaces its first space.
    <Tabs defaultValue="kit">
      <TabsList>
        <TabsTrigger value="kit">In the kit</TabsTrigger>
        {command ? <TabsTrigger value="existing">{existing}</TabsTrigger> : null}
      </TabsList>
      <TabsContent value="kit">
        <p className="text-muted-foreground mb-3 text-sm">Already in every copy of the {platform === 'mobile' ? 'native' : 'web'} kit:</p>
        <DynamicCodeBlock lang="tsx" code={`import { ${c.exports.join(', ')} } from '@/${c.files[0].replace(/\.tsx?$/, '')}';`} />
      </TabsContent>
      {command ? (
        <TabsContent value="existing">
          <p className="text-muted-foreground mb-3 text-sm">
            {!ours ? (
              <>Unchanged from {upstreamName(platform)}, so it installs from their registry:</>
            ) : (
              <>
                With {platform === 'mobile' ? 'react-native-reusables' : 'shadcn/ui'} set up and the kit&apos;s registry in{' '}
                <code>components.json</code> (
                <Link href="/docs/install" className="underline underline-offset-4">
                  install guide
                </Link>
                ):
              </>
            )}
          </p>
          <DynamicCodeBlock options={{ themes: codeThemes }} lang="bash" code={platform === 'mobile' ? `${command}\nnpx expo install --fix` : command} />
          {replacesUpstream ? (
            <p className="text-muted-foreground mt-3 text-sm">
              Replaces some {upstreamName(platform)} files with the kit&apos;s refined versions; answer yes when asked to
              overwrite (or add <code>--overwrite</code>).
            </p>
          ) : null}
        </TabsContent>
      ) : null}
    </Tabs>
  );
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr]">
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
