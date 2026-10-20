'use client';
/**
 * The Studio's font picker (apps/docs/design/studio-wireframes.md › Font): Halftone picks first (the curated list a
 * theme code can carry), then every Google Fonts family. The full list is a static file (lib/studio/google-fonts.json,
 * refreshed by scripts/google-fonts.mjs), loaded only when the picker opens: no request beyond Google Fonts CSS.
 */
import { FONTS } from '@halftone-ds/tokens/theme';
import * as React from 'react';

export type FontRole = 'heading' | 'body' | 'mono';
export type GoogleFont = { family: string; category: string; weights: number[] };

let all: GoogleFont[] | null = null;
let loading: Promise<GoogleFont[]> | null = null;
const listeners = new Set<() => void>();

export function loadGoogleFonts() {
  loading ??= import('./google-fonts.json').then((m) => {
    all = (m.default as [string, string, number[]][]).map(([family, category, weights]) => ({ family, category, weights }));
    listeners.forEach((l) => l());
    return all;
  });
  return loading;
}

/** Every Google Fonts family, or null until loaded (it starts loading). */
export function useGoogleFonts() {
  return React.useSyncExternalStore(
    (l) => {
      listeners.add(l);
      void loadGoogleFonts();
      return () => {
        listeners.delete(l);
      };
    },
    () => all,
    () => null
  );
}

/** The Halftone picks a role may use (mono fonts for mono; the rest for heading and body). */
export const picksFor = (role: FontRole) => FONTS.filter((f) => !f.hidden && (role === 'mono' ? f.category === 'mono' : f.category !== 'mono'));

export const isPick = (family: string) => FONTS.some((f) => f.family.toLowerCase() === family.toLowerCase());

/** A family's upright weights: from the list once loaded, else a pick's, else 400–700. */
export function weightsOf(family: string): number[] {
  const known = all?.find((f) => f.family === family);
  if (known) return known.weights;
  return FONTS.find((f) => f.family === family)?.weights ?? [400, 500, 600, 700];
}

export const weightRange = (weights: number[]) => (weights.length > 1 ? `${weights[0]}–${weights.at(-1)}` : String(weights[0] ?? 400));

/** CSS for showing a list of families in their own faces: only the letters of their names (Google's `text=`). */
export function previewHref(families: string[]) {
  const list = families.filter((f) => f && !FONTS.some((x) => x.system && x.family === f));
  if (!list.length) return null;
  const text = encodeURIComponent([...new Set(list.join('').replace(/\s/g, '') + 'Aa')].join(''));
  return `https://fonts.googleapis.com/css2?${list.map((f) => `family=${f.replace(/ /g, '+')}`).join('&')}&text=${text}&display=swap`;
}

/** A family as a CSS font-family, with a fallback for its kind. */
export const familyCss = (family: string, role: FontRole) => (family ? `"${family}", ${role === 'mono' ? 'ui-monospace, monospace' : 'ui-sans-serif, system-ui, sans-serif'}` : role === 'mono' ? 'ui-monospace, monospace' : 'ui-sans-serif, system-ui, sans-serif');
