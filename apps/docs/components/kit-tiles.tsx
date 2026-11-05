'use client';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { availability, entryOf, entryUrl, PLATFORM_OF, type Entry, type Side } from '@/lib/catalogue';
import { useFrameHeight, useKitFrame } from '@/lib/frames';

/**
 * A group's cards on the components index (design/navigation-wireframes.md › Round two, like untitledui.com): each
 * component's own demo on a quiet canvas, live and themed, its name and which kits have it underneath. One frame
 * per kit per group, not one per component (a native frame boots the whole Expo bundle); the kit draws the cards
 * (`?tiles=` and `lines=`, a JSON map of id → the line under the name). A component both kits have shows its web
 * version; one-kit components come from their kit. A card's name opens its page (`kit:open` from the frame). The
 * canvas stays live, so the card as a whole can't be a link.
 *
 * `kit` (the Studio's Web / Mobile toggle) shows one kit's cards instead, and a card opens its page on that kit
 * (`?kit=`).
 */
export function GroupTiles({ entries, label, kit }: { entries: Entry[]; label: string; kit?: Side }) {
  const web = kit === 'native' ? [] : entries.filter((e) => hasTile(e, 'web'));
  const native = kit === 'web' ? [] : entries.filter((e) => hasTile(e, 'native') && (kit === 'native' || !hasTile(e, 'web')));
  return (
    <div className="flex flex-col gap-4">
      {web.length ? <TileFrame key={`web:${web.map((e) => e.id).join(',')}`} side="web" entries={web} title={`${label}, web kit, live`} kit={kit} /> : null}
      {native.length ? <TileFrame key={`native:${native.map((e) => e.id).join(',')}`} side="native" entries={native} title={`${label}, native kit, live`} kit={kit} /> : null}
    </div>
  );
}

/** A component has a live card in this kit (it's in the kit, and a demo of it previews). */
export const hasTile = (e: Entry, side: Side) => e.parts[side].some((c) => c.preview !== false);

/** The kit components an entry shows as cards on one side. */
const tileParts = (e: Entry, side: Side) => e.parts[side].filter((c) => c.preview !== false);

function TileFrame({ side, entries, title, kit }: { side: Side; entries: Entry[]; title: string; kit?: Side }) {
  const router = useRouter();
  const kind = PLATFORM_OF[side];
  const parts = entries.flatMap((e) => tileParts(e, side).map((c) => ({ id: c.id, line: availability(e) })));
  const ids = parts.map((p) => p.id);
  const lines = encodeURIComponent(JSON.stringify(Object.fromEntries(parts.map((p) => [p.id, p.line]))));
  const { ref, src } = useKitFrame(kind, `/components?tiles=${ids.join(',')}&lines=${lines}&autosize=1`);
  // Before the kit reports its height: a row of cards per ~3 components.
  const height = useFrameHeight(ref, src, Math.ceil(ids.length / 3) * 300);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== ref.current?.contentWindow || event.data?.type !== 'kit:open') return;
      const entry = entryOf(side, String(event.data.id));
      if (entry) router.push(kit ? `${entryUrl(entry.id)}/?kit=${kit}` : entryUrl(entry.id));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [ref, router, kit, side]);

  return (
    <div className="relative" style={{ height: height ?? Math.ceil(ids.length / 3) * 300 }}>
      {src ? <iframe ref={ref} src={src} title={title} loading="lazy" className="block size-full border-0" /> : null}
      {height === null ? <div className="bg-muted-subtle absolute inset-0 animate-pulse rounded-2xl" aria-hidden /> : null}
    </div>
  );
}
