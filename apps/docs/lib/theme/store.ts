'use client';
/**
 * The docs site's live theme: the active system's (lib/studio/systems.ts), shared by the theme bar, the Studio, the
 * site chrome and every embedded kit frame. This module is the recipe-level view of it: the bar's presets and
 * colours, shuffle and the hover preview change the system's recipe and leave its hand edits alone. Undo and redo
 * work on the whole document.
 *
 * Until a system is active the committed theme (tokens.json `$extensions`) is on screen, *ambient*: the colours
 * drift along a gradient (lib/theme/ambient.ts). Nothing here reaches the repo: committing goes through the export
 * panel (a code, a CLI command, a prompt, a `.halftone.json` or a tokens.json download).
 */
import { BRAND_RAMPS, FONTS, OPTIONS, normalizeRecipe, sameRecipe, type Recipe, type RecipeInput, type Theme } from '@halftone-ds/tokens/theme';
import { hasOverrides } from '@halftone-ds/tokens/system';
import * as React from 'react';
import {
  editSystem,
  redoSystem,
  STARTER,
  startSystems,
  subscribeSystems,
  switchSystem,
  systemsState,
  systemTheme,
  undoSystem,
  useSystems,
  type HalftoneSystem,
} from '@/lib/studio/systems';
import { base, committed } from './base';

export { base, committed };

/** Read the URL and storage once, on the client. */
export const startTheme = startSystems;

const merged = (recipe: Recipe, input: RecipeInput) => normalizeRecipe({ ...recipe, ...input, font: { ...recipe.font, ...input.font } });

/**
 * A hover preview: a picker shows a value on the site and in the frames before it is picked. Not saved and not in
 * the undo history; `previewRecipe(null)` ends it.
 */
let preview: Recipe | null = null;
let previewTimer: ReturnType<typeof setTimeout> | undefined;
const previewListeners = new Set<() => void>();
export function previewRecipe(input: RecipeInput | null) {
  clearTimeout(previewTimer);
  const apply = () => {
    const next = input ? merged(systemsState().doc.recipe, input) : null;
    if (JSON.stringify(next) === JSON.stringify(preview)) return;
    preview = next;
    previewListeners.forEach((l) => l());
  };
  // Leaving is immediate; entering waits a beat, so sweeping across a list doesn't re-theme every row.
  if (input) previewTimer = setTimeout(apply, 80);
  else apply();
}
export const isPreviewing = () => preview !== null;
const subscribePreview = (l: () => void) => {
  previewListeners.add(l);
  return () => {
    previewListeners.delete(l);
  };
};

/** Called whenever what is on screen changes: an edit, a switch, or a hover preview. */
export function subscribeTheme(listener: () => void) {
  const a = subscribeSystems(listener);
  const b = subscribePreview(listener);
  return () => {
    a();
    b();
  };
}

/** The document on screen: the hover preview over the active system while there is one. */
export const currentSystem = (): HalftoneSystem => {
  const doc = systemsState().doc;
  return preview ? { ...doc, recipe: preview } : doc;
};
export const currentRecipe = () => currentSystem().recipe;
export const currentTheme = () => systemTheme(currentSystem());

/** The site differs from app/tokens.css: anything but the committed theme with no hand edits. */
export const isLive = (doc: HalftoneSystem) => hasOverrides(doc) || !sameRecipe(doc.recipe, committed);

/** Change the active system's recipe (or part of it). Undoable; `coalesce` folds a drag into one step. */
export function setRecipe(next: RecipeInput | ((current: Recipe) => RecipeInput), { coalesce }: { coalesce?: string } = {}) {
  preview = null;
  editSystem(
    (doc) => {
      const input = typeof next === 'function' ? next(doc.recipe) : next;
      const recipe = merged(doc.recipe, input);
      return { ...doc, recipe, preset: recipe.preset };
    },
    { coalesce }
  );
}

export const undo = undoSystem;
export const redo = redoSystem;

/**
 * What shuffle may change, one key per control in the Studio: a locked one keeps its value. Fonts lock one role at
 * a time; the rest are recipe axes.
 */
export const LOCK_KEYS = ['brand', 'neutral', 'heading', 'body', 'mono', 'size', 'leading', 'flow', 'measure', 'radius', 'controls', 'button', 'field', 'border', 'depth', 'stroke', 'density'] as const;
export type LockKey = (typeof LOCK_KEYS)[number];
let locks = new Set<LockKey>();
const lockListeners = new Set<() => void>();
export function toggleLock(key: LockKey) {
  locks = new Set(locks);
  if (locks.has(key)) locks.delete(key);
  else locks.add(key);
  lockListeners.forEach((l) => l());
}
export function useLocks() {
  return React.useSyncExternalStore(
    (l) => {
      lockListeners.add(l);
      return () => lockListeners.delete(l);
    },
    () => locks,
    () => locks
  );
}

const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

/** A brand colour that works as a fill: a curated 600, or a generated hue at a usable lightness. */
function randomBrand() {
  if (Math.random() < 0.5) return pick(Object.values(BRAND_RAMPS))['600'];
  const h = Math.random() * 360;
  const s = 0.55 + Math.random() * 0.35;
  const l = 0.38 + Math.random() * 0.14;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Headings and body that go together (the same family, or a serif/display heading over a sans body), and a
 * mono font.
 */
function randomFonts(): Recipe['font'] {
  const visible = FONTS.filter((f) => !f.hidden);
  const sans = visible.filter((f) => f.category === 'sans');
  const mono = pick(visible.filter((f) => f.category === 'mono')).id;
  if (Math.random() < 0.4) {
    const same = pick(sans).id;
    return { heading: same, body: same, mono };
  }
  return { heading: pick(visible.filter((f) => f.category === 'serif' || f.category === 'display')).id, body: pick(sans).id, mono };
}

/** New random values for every unlocked recipe axis (the system's hand edits stay). */
export function shuffle() {
  const free = (key: LockKey) => !locks.has(key);
  const next: RecipeInput = { preset: undefined };
  if (free('brand')) next.brand = randomBrand();
  if (free('neutral')) next.neutral = pick(OPTIONS.neutral);
  const fonts = randomFonts();
  next.font = {
    ...(free('heading') ? { heading: fonts.heading } : {}),
    ...(free('body') ? { body: fonts.body } : {}),
    ...(free('mono') ? { mono: fonts.mono } : {}),
  } as Recipe['font'];
  for (const key of ['size', 'leading', 'flow', 'measure', 'radius', 'controls', 'button', 'field', 'border', 'depth', 'stroke', 'density'] as const) {
    if (free(key)) Object.assign(next, { [key]: pick(OPTIONS[key] as readonly string[]) });
  }
  setRecipe(next);
}

/** Back to the start: no system active, the committed theme with the ambient drift over it. Saved systems stay. */
export function resumeAmbient() {
  preview = null;
  switchSystem(null);
}

/** Whether the colours are drifting (nothing active). Read outside React by lib/theme/ambient.ts. */
export const isAmbient = () => systemsState().ambient;

/** A recipe's theme (preset cards, the theme bar's rows): a system with no hand edits. */
const recipeThemes = new Map<string, Theme>();
export function themeFor(recipe: Recipe): Theme {
  const key = JSON.stringify(recipe);
  let theme = recipeThemes.get(key);
  if (!theme) {
    theme = systemTheme({ ...STARTER, recipe });
    recipeThemes.set(key, theme);
  }
  return theme;
}

/** The active system, generated, and its undo state. */
export function useLiveTheme(): {
  system: HalftoneSystem;
  recipe: Recipe;
  theme: Theme;
  isCommitted: boolean;
  ambient: boolean;
  canUndo: boolean;
  canRedo: boolean;
} {
  const s = useSystems();
  const previewing = React.useSyncExternalStore(subscribePreview, () => preview, () => null);
  // `recipe` is what is picked (the controls show it); `theme` is what is on screen (a hover preview).
  const shown = previewing ? { ...s.doc, recipe: previewing } : s.doc;
  return {
    system: s.doc,
    recipe: s.doc.recipe,
    theme: systemTheme(shown),
    isCommitted: !isLive(shown),
    ambient: s.ambient && !previewing,
    canUndo: s.canUndo,
    canRedo: s.canRedo,
  };
}
