'use client';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useFilter } from '@/components/kit-availability';
import { entryUrl, getEntry, type Entry } from '@/lib/catalogue';
import { useFrameHeight, useKitFrame } from '@/lib/frames';

/**
 * A group's live tiles on the components index, like kumo-ui.com: each component's own demo in a cell, live and
 * themed. One frame per kit per group, not one per component (a native frame boots the whole Expo bundle). A
 * component both kits have shows its web version; native-only ones come from the native kit; the All | Native |
 * Web filter decides. A tile's title opens its page (`kit:open` from the frame).
 */
export function GroupTiles({ entries, label }: { entries: Entry[]; label: string }) {
  const filter = useFilter();
  const live = entries.filter((e) => (e.web ?? e.native)?.preview !== false);
  const web = filter === 'native' ? [] : live.filter((e) => e.web && e.web.preview !== false);
  const native =
    filter === 'web' ? [] : live.filter((e) => e.native && e.native.preview !== false && (filter === 'native' || !e.web || e.web.preview === false));
  return (
    <div className="border-border flex flex-col gap-px overflow-hidden rounded-xl border bg-[var(--color-fd-border)]">
      {web.length ? <TileFrame key={`web:${web.map((e) => e.id).join(',')}`} kind="web" ids={web.map((e) => e.id)} title={`${label}, web kit, live`} /> : null}
      {native.length ? <TileFrame key={`native:${native.map((e) => e.id).join(',')}`} kind="mobile" ids={native.map((e) => e.id)} title={`${label}, native kit, live`} /> : null}
    </div>
  );
}

function TileFrame({ kind, ids, title }: { kind: 'mobile' | 'web'; ids: string[]; title: string }) {
  const router = useRouter();
  const base = kind === 'mobile' ? '/components' : '/components';
  const { ref, src } = useKitFrame(kind, `${base}?tiles=${ids.join(',')}&autosize=1`);
  // Before the kit reports its height: a row of tiles per ~3 components.
  const height = useFrameHeight(ref, src, Math.ceil(ids.length / 3) * 260);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== ref.current?.contentWindow || event.data?.type !== 'kit:open') return;
      const entry = getEntry(String(event.data.id));
      if (entry) router.push(entryUrl(entry.id));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [ref, router]);

  return (
    <div className="bg-fd-background relative" style={{ height: height ?? Math.ceil(ids.length / 3) * 260 }}>
      {src ? <iframe ref={ref} src={src} title={title} loading="lazy" className="block size-full border-0" /> : null}
      {height === null ? <div className="bg-fd-muted/50 absolute inset-0 animate-pulse" aria-hidden /> : null}
    </div>
  );
}
