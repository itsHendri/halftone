'use client';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import * as React from 'react';
import { allowedOrigins, type EmbedScheme, readEmbed } from '@/lib/embed';
import { applyEmbedTokens, parseEmbedTokens } from '@/lib/embed-theme';

/**
 * next-themes (class on <html>, system by default) plus the docs-site embed bridge. An embedded or
 * ?theme= session pins the theme with `forcedTheme`, held in state so the host's `kit:theme` messages can
 * move it, and uses its own storage key so the visitor's saved choice is never touched. The bridge also
 * takes the docs picker's live theme (`kit:tokens`, lib/embed-theme.ts).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [embed] = React.useState(readEmbed);
  const [forced, setForced] = React.useState<EmbedScheme | undefined>(embed.theme);
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      forcedTheme={forced}
      storageKey={embed.embedded || embed.theme ? 'kit.theme.embedded' : 'kit.theme'}>
      {embed.embedded ? <EmbedBridge onTheme={setForced} /> : null}
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster />
    </ThemeProvider>
  );
}

function EmbedBridge({ onTheme }: { onTheme: (scheme: EmbedScheme) => void }) {
  React.useEffect(() => {
    if (window.parent === window) return;
    const origins = allowedOrigins();
    const onMessage = (event: MessageEvent) => {
      if (!origins.includes(event.origin)) return;
      const data = event.data as { type?: unknown; value?: unknown } | null;
      if (data?.type === 'kit:theme' && (data.value === 'light' || data.value === 'dark')) onTheme(data.value);
      const tokens = parseEmbedTokens(event.data);
      if (tokens) {
        applyEmbedTokens(tokens);
        window.parent.postMessage({ type: 'kit:applied', code: tokens.code }, event.origin);
      }
    };
    window.addEventListener('message', onMessage);
    for (const origin of origins) window.parent.postMessage({ type: 'kit:ready' }, origin);
    // ?autosize=1: report the content's height so the host can size the frame to it (no inner scroll).
    // The page may render [data-autosize] after this effect (client-only pages behind Suspense): look for it
    // each frame for a few seconds.
    let observer: ResizeObserver | undefined;
    let frame = 0;
    const watch = (tries: number) => {
      const content = document.querySelector('[data-autosize]');
      if (!content) {
        if (tries > 0) frame = requestAnimationFrame(() => watch(tries - 1));
        return;
      }
      let last = 0;
      observer = new ResizeObserver(() => {
        const height = Math.ceil(content.getBoundingClientRect().height);
        if (height === last) return;
        last = height;
        for (const origin of origins) window.parent.postMessage({ type: 'kit:size', height }, origin);
      });
      observer.observe(content);
    };
    if (new URLSearchParams(window.location.search).get('autosize') === '1') watch(300);
    return () => {
      window.removeEventListener('message', onMessage);
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [onTheme]);
  return null;
}
