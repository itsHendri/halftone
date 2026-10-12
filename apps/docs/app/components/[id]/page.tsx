import { Callout } from 'fumadocs-ui/components/callout';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'fumadocs-ui/components/tabs';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/notebook/page';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { InlineMd } from '@/components/inline-md';
import { KitBadges, KitPanels } from '@/components/kit-availability';
import { KitStage } from '@/components/kit-stage';
import { PhoneFrame } from '@/components/phone-frame';
import { CATALOGUE, entryUrl, getEntry, groupOf, PLATFORM_OF, SCREEN_LEVEL, SIDE_LABEL, stageMinHeight, type Entry, type Side } from '@/lib/catalogue';
import { kits, registryItemFor, sourceUrl, type KitComponent, type Platform } from '@/lib/kit';
import { site } from '@/lib/llms';
import { codeThemes } from '@/lib/shared';

export const dynamicParams = false;

export function generateStaticParams() {
  return CATALOGUE.map((e) => ({ id: e.id }));
}

async function resolve(props: PageProps<'/components/[id]'>) {
  const { id } = await props.params;
  const e = getEntry(id);
  if (!e) notFound();
  return e;
}

export async function generateMetadata(props: PageProps<'/components/[id]'>): Promise<Metadata> {
  const e = await resolve(props);
  const c = (e.native ?? e.web)!;
  return { title: `${e.title} · Components`, description: c.notes.replace(/`/g, '') || c.caption };
}

/** Where a component without its own Kitchen Sink demo is shown instead. */
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

export default async function ComponentPage(props: PageProps<'/components/[id]'>) {
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
      <div className="not-prose -mt-1 flex flex-wrap items-center gap-2">
        <KitBadges sides={e.sides} size="md" />
        {e.counterparts.map((cp) => (
          <Link key={cp.id} href={entryUrl(cp.id)} className="text-fd-muted-foreground text-sm underline underline-offset-4">
            {SIDE_LABEL[cp.side]}: {cp.title}
          </Link>
        ))}
      </div>
      <DocsDescription className="mb-0">
        <InlineMd text={lead.notes || lead.caption || ''} />
      </DocsDescription>
      <DocsBody>
        <div className="not-prose">
          <KitPanels panels={Object.fromEntries(e.sides.map((side) => [side, <Panel key={side} side={side} e={e} c={e[side]!} />]))} />
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

/** One kit's version of a component: the live preview, then usage, API, how to get it and the details. */
function Panel({ side, e, c }: { side: Side; e: Entry; c: KitComponent }) {
  const platform = PLATFORM_OF[side];
  const k = kits[platform];
  const item = registryItemFor(platform, c);
  const ours = c.install?.startsWith(`${k.namespace}/`) ?? false;
  const demo = `${k.kitchenSink}?section=${c.id}`;
  const label = `${e.title} (${SIDE_LABEL[side]}), live preview`;

  let preview: React.ReactNode;
  if (c.preview === false) {
    preview = <Callout title="No live preview">{PREVIEWED_ELSEWHERE[platform][c.id] ?? 'Previewed elsewhere in the kit.'}</Callout>;
  } else if (side === 'native' && SCREEN_LEVEL.has(c.id)) {
    // A whole-screen component reads as one only on a screen.
    preview = (
      <div className="border-border bg-fd-muted/40 flex justify-center rounded-xl border p-6">
        <PhoneFrame path={demo} title={label} width={300} />
      </div>
    );
  } else {
    preview = <KitStage kind={platform} path={demo} title={label} minHeight={stageMinHeight(e)} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <figure className="flex flex-col gap-2">
        {preview}
        {c.preview === false ? null : (
          <figcaption className="text-muted-foreground text-xs">
            The {SIDE_LABEL[side].toLowerCase()} kit&apos;s real component, live{side === 'native' ? ' in its web build at phone width' : ''}. Follows this site&apos;s theme.
          </figcaption>
        )}
      </figure>

      {c.caption ? (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Usage</h2>
          <p className="text-fd-foreground/90 leading-7">
            <InlineMd text={c.caption} />
          </p>
        </section>
      ) : null}

      {c.api ? (
        <section>
          <h2 className="mb-2 text-lg font-semibold">API</h2>
          <DynamicCodeBlock options={{ themes: codeThemes }} lang="tsx" code={c.api} />
        </section>
      ) : null}

      <section>
        <h2 className="mb-2 text-lg font-semibold">Get it</h2>
        <GetIt platform={platform} c={c} ours={ours} replacesUpstream={replacesUpstream(platform, item)} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Details</h2>
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
          {item?.registryDependencies?.length ? <Row term="Installs with">{item.registryDependencies.map(depLabel).join(', ')}</Row> : null}
          {c.aliases?.length ? <Row term="Also searched as">{c.aliases.join(', ')}</Row> : null}
          {c.install && !ours ? <Row term="Upstream">Unchanged from {upstreamName(platform)}; installs from their registry.</Row> : null}
          {ours && c.install ? (
            <Row term="Registry JSON">
              <a href={`${k.registryPath}/${c.install.slice(k.namespace.length + 1)}.json`} className="font-mono underline underline-offset-4">
                {k.registryPath}/{c.install.slice(k.namespace.length + 1)}.json
              </a>
            </Row>
          ) : null}
        </dl>
      </section>
    </div>
  );
}

/** True when installing the item also swaps in the kit's versions of upstream files (shadcn asks to overwrite). */
function replacesUpstream(platform: Platform, item: ReturnType<typeof registryItemFor>) {
  const ns = kits[platform].namespace;
  return !!item?.registryDependencies?.some((d) => d.startsWith(`${ns}/`) && !d.includes('/lib-') && !d.includes('/hook-') && !d.endsWith('/theme'));
}

function GetIt({ platform, c, ours, replacesUpstream }: { platform: Platform; c: KitComponent; ours: boolean; replacesUpstream: boolean }) {
  const command = c.install ? `npx shadcn@latest add ${c.install}` : null;
  const existing = platform === 'mobile' ? 'Existing Expo app' : 'Existing Next.js app';
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
