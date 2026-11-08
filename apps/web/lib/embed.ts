'use client';
import { useSyncExternalStore } from 'react';
import { EMBED_STORAGE } from '@/lib/embed-boot';

/**
 * Embed mode: the docs site shows the web kit inside a browser frame (an iframe of its static export).
 * The first URL decides it for the session, before React runs, so nothing flashes:
 *
 *   ?embed=1            hide the kit chrome (anything with the `kit-chrome` class: header, nav, back link)
 *   ?theme=light|dark   start in that theme and never persist it
 *   ?autosize=1         report the height of the page's [data-autosize] element (the showcase), so the
 *                       host can make the frame exactly that tall
 *
 * The host keeps the theme in step with postMessage, same contract as the mobile kit:
 *   host → kit   { type: 'kit:theme', value: 'light' | 'dark' }
 *   kit → host   { type: 'kit:ready' }
 *                { type: 'kit:size', height }   (with ?autosize=1, whenever the content's height changes)
 * Accepted from this page's own origin and NEXT_PUBLIC_EMBED_ORIGINS (comma-separated).
 */
export type EmbedScheme = 'light' | 'dark';

export function readEmbed(): { embedded: boolean; theme?: EmbedScheme } {
  if (typeof window === 'undefined') return { embedded: false };
  try {
    const theme = sessionStorage.getItem(`${EMBED_STORAGE}.theme`);
    return {
      embedded: sessionStorage.getItem(EMBED_STORAGE) === '1',
      theme: theme === 'light' || theme === 'dark' ? theme : undefined,
    };
  } catch {
    return { embedded: false };
  }
}

/**
 * Next.js inlines `process.env.NEXT_PUBLIC_*` at build time. Other apps (Vite) have no `process` in the browser, and
 * may have no Node types: declared here so the file typechecks anywhere, guarded so it runs anywhere.
 */
declare const process: { env: Record<string, string | undefined> };

export function allowedOrigins(): string[] {
  const extra = String((typeof process === 'undefined' ? undefined : process.env.NEXT_PUBLIC_EMBED_ORIGINS) ?? '')
    .split(',')
    .map((o: string) => o.trim())
    .filter(Boolean);
  return typeof window === 'undefined' ? extra : [window.location.origin, ...extra];
}

/**
 * Embed state never changes within a session, but after hydration React keeps the server snapshot until the
 * store reports a change, so report one once, right after mount.
 */
const onceAfterMount = (onChange: () => void) => {
  const t = setTimeout(onChange, 0);
  return () => clearTimeout(t);
};

/** Whether this session is embedded: false on the server and during hydration, the real value after. */
export function useEmbedded(): boolean {
  return useSyncExternalStore(onceAfterMount, () => readEmbed().embedded, () => false);
}
