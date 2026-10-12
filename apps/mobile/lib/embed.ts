import * as React from 'react';
import { Platform } from 'react-native';

/**
 * Embed mode: the docs site shows the kit's web export inside a phone frame (an iframe). The page that
 * loads first decides it for the whole session, because navigating inside the iframe drops the query.
 *
 *   ?embed=1             hide the kit chrome: tab bar, header, KitChip
 *   ?theme=light|dark    start in that theme and never persist it (also works without embed)
 *   ?section=<id>        on /kitchen-sink: with embed, render just that component's demo
 *   ?autosize=1          report that demo's height, so the host can size its frame to it (kit:size)
 *
 * The host page keeps the theme in step with postMessage (web only):
 *   host → kit   { type: 'kit:theme', value: 'light' | 'dark' }
 *   host → kit   { type: 'kit:tokens', … }   a live theme from the docs picker (lib/embed-theme.ts)
 *   kit → host   { type: 'kit:ready' }   once mounted
 *   kit → host   { type: 'kit:size', height }   with ?autosize=1, whenever the demo's height changes
 *   kit → host   { type: 'kit:open', id }   a tile's title was pressed: open that component's docs page
 * Messages are accepted from this page's own origin (the docs site serves the export under /m) and from
 * the origins in EXPO_PUBLIC_EMBED_ORIGINS (comma-separated, for a docs dev server on another port).
 */
export type EmbedScheme = 'light' | 'dark';
export type EmbedState = { embedded: boolean; theme?: EmbedScheme; autosize?: boolean };

const isScheme = (value: unknown): value is EmbedScheme => value === 'light' || value === 'dark';

function readInitial(): EmbedState {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return { embedded: false };
  const params = new URLSearchParams(window.location.search);
  const theme = params.get('theme');
  return { embedded: params.get('embed') === '1', theme: isScheme(theme) ? theme : undefined, autosize: params.get('autosize') === '1' };
}

/** Latched once, at startup. */
export const EMBED: EmbedState = readInitial();

export function allowedOrigins(): string[] {
  // String(): apps without Node's types see `process.env` as untyped.
  const extra = String(process.env.EXPO_PUBLIC_EMBED_ORIGINS ?? '')
    .split(',')
    .map((o: string) => o.trim())
    .filter(Boolean);
  return typeof window === 'undefined' ? extra : [window.location.origin, ...extra];
}

export const isAllowedOrigin = (origin: string) => allowedOrigins().includes(origin);

const listening = () => EMBED.embedded && Platform.OS === 'web' && typeof window !== 'undefined' && window.parent !== window;

/**
 * Listens for one message type from the host page. Register listeners in components below
 * KitThemeProvider: their effects run before its useEmbedBridge posts `kit:ready`, so nothing the host
 * sends in reply is missed. `onMessage` must be stable.
 */
export function useEmbedMessage(type: string, onMessage: (data: unknown, origin: string) => void) {
  React.useEffect(() => {
    if (!listening()) return;
    const origins = allowedOrigins();
    const handler = (event: MessageEvent) => {
      if (!origins.includes(event.origin)) return;
      if ((event.data as { type?: unknown } | null)?.type === type) onMessage(event.data, event.origin);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [type, onMessage]);
}

/**
 * Listens for `kit:theme` from the host page and tells it `kit:ready`. No-op unless embedded on web.
 * `onTheme` must be stable (wrap it in useCallback).
 */
export function useEmbedBridge(onTheme: (scheme: EmbedScheme) => void) {
  React.useEffect(() => {
    if (!listening()) return;
    const origins = allowedOrigins();
    const onMessage = (event: MessageEvent) => {
      if (!origins.includes(event.origin)) return;
      const data = event.data as { type?: unknown; value?: unknown } | null;
      if (data?.type === 'kit:theme' && isScheme(data.value)) onTheme(data.value);
    };
    window.addEventListener('message', onMessage);
    for (const origin of origins) window.parent.postMessage({ type: 'kit:ready' }, origin);
    return () => window.removeEventListener('message', onMessage);
  }, [onTheme]);
}

let lastSize = 0;
/** Tell the host the embedded content's height (px), for `?autosize=1`. Call it from an onLayout. */
export function reportEmbedSize(height: number) {
  if (!listening() || !EMBED.autosize) return;
  const rounded = Math.ceil(height);
  if (rounded === lastSize) return;
  lastSize = rounded;
  for (const origin of allowedOrigins()) window.parent.postMessage({ type: 'kit:size', height: rounded }, origin);
}

/** Ask the docs page around this frame to open a component's page (the index's live tiles). */
export function openInHost(id: string) {
  if (!listening()) return;
  for (const origin of allowedOrigins()) window.parent.postMessage({ type: 'kit:open', id }, origin);
}
