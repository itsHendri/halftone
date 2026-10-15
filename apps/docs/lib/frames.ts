'use client';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { useAmbientStep } from '@/lib/theme/ambient';
import { kitPayloads } from '@/lib/theme/payload';
import { useLiveTheme } from '@/lib/theme/store';

/**
 * Where each kit's web build lives. Production: /m and /w on this site (same origin, built by
 * scripts/build-docs.mjs). Dev: point the env vars at running kits and let them accept this origin:
 *   NEXT_PUBLIC_KIT_WEB_URL=http://localhost:8090   (mobile: `npm run web`, EXPO_PUBLIC_EMBED_ORIGINS=http://localhost:3000)
 *   NEXT_PUBLIC_WEB_KIT_URL=http://localhost:3100   (web: `npm run dev`, NEXT_PUBLIC_EMBED_ORIGINS=http://localhost:3000)
 */
export const frameBase = {
  mobile: (process.env.NEXT_PUBLIC_KIT_WEB_URL ?? '/m').replace(/\/$/, ''),
  web: (process.env.NEXT_PUBLIC_WEB_KIT_URL ?? '/w').replace(/\/$/, ''),
};

/**
 * An embedded kit page whose theme follows this site. The first load passes `theme=` in the URL; later
 * changes go over postMessage (`kit:theme`) once the kit has said `kit:ready`, so toggling never reloads
 * it. The live theme from the picker goes the same way (`kit:tokens`, in the kit's own format); on this
 * site's origin the kit has already painted it from sessionStorage (see components/theme/theme-runtime).
 * Both kits speak the same protocol.
 */
export function useKitFrame(kind: 'mobile' | 'web', path: string) {
  const base = frameBase[kind];
  const { theme: liveTheme, isCommitted } = useLiveTheme();
  // While the site's colours drift, the kits follow in steps of a few seconds (lib/theme/ambient.ts).
  const ambientStep = useAmbientStep();
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const ref = React.useRef<HTMLIFrameElement>(null);
  const [src, setSrc] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);

  // Build the URL once, on the client, with whatever theme the site has by then.
  React.useEffect(() => {
    if (src || !resolvedTheme) return;
    const sep = path.includes('?') ? '&' : '?';
    setSrc(`${base}${path}${sep}embed=1&theme=${theme}`);
  }, [base, path, resolvedTheme, src, theme]);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source === ref.current?.contentWindow && event.data?.type === 'kit:ready') setReady(true);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  React.useEffect(() => {
    const target = ref.current?.contentWindow;
    if (!ready || !target) return;
    target.postMessage({ type: 'kit:theme', value: theme }, new URL(base, window.location.href).origin);
  }, [base, ready, theme]);

  React.useEffect(() => {
    const target = ref.current?.contentWindow;
    if (!ready || !target) return;
    const payload = ambientStep ? kitPayloads(ambientStep, true)[kind] : kitPayloads(liveTheme, !isCommitted)[kind];
    target.postMessage({ type: 'kit:tokens', v: 1, ...payload }, new URL(base, window.location.href).origin);
  }, [base, kind, ready, liveTheme, isCommitted, ambientStep]);

  return { ref, src };
}

/**
 * The height an embedded kit page reports for its content (`?autosize=1` → `{ type: 'kit:size', height }`), or
 * null until it does. A kit build that never reports gets `fallback` after 8 seconds.
 */
export function useFrameHeight(ref: React.RefObject<HTMLIFrameElement | null>, src: string | null, fallback: number) {
  const [height, setHeight] = React.useState<number | null>(null);
  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== ref.current?.contentWindow || event.data?.type !== 'kit:size') return;
      const h = Number(event.data.height);
      if (Number.isFinite(h) && h > 0 && h < 20000) setHeight(h);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [ref]);
  React.useEffect(() => {
    if (!src) return;
    const t = setTimeout(() => setHeight((h) => h ?? fallback), 8000);
    return () => clearTimeout(t);
  }, [src, fallback]);
  return height;
}
