'use client';
/**
 * The docs site's live theme: one recipe, shared by the pill, the studio, the site chrome and every
 * embedded kit frame. Where it starts, in order:
 *   1. `?t=<code>` in the URL (a shared link), which is then dropped from the address bar
 *   2. the visitor's last theme (localStorage)
 *   3. the theme committed in tokens.json (`$extensions`), *ambient*: until the visitor picks anything, the
 *      colours drift along a gradient (lib/theme/ambient.ts) over that theme
 * Nothing here reaches the repo: committing goes through the export panel (a code, a CLI command, a
 * prompt or a tokens.json download).
 */
import {
  BRAND_RAMPS,
  FONTS,
  OPTIONS,
  generateTheme,
  normalizeRecipe,
  sameRecipe,
  themeStatus,
  type Recipe,
  type RecipeInput,
  type Theme,
  type TokensJson,
} from '@halftone-ds/tokens/theme';
import * as React from 'react';
import { STORAGE_KEY } from './keys';
import { readThemeCode } from './read-code';
import tokensJson from '../../../mobile/tokens/tokens.json';

export const base = tokensJson as unknown as TokensJson;
const status = themeStatus(base);
/** The theme the kits ship with right now. */
// normalizeRecipe: a recipe recorded before the typeset gets its defaults.
export const committed: Recipe = normalizeRecipe(status.applied ? status.recipe : {});


/** `ambient`: nothing picked yet (no stored theme, no shared code), so the colours drift. */
type State = { recipe: Recipe; history: Recipe[]; future: Recipe[]; ambient: boolean };
/** What the server rendered with; hydration uses it too, then the client's own state takes over. */
const serverState: State = { recipe: committed, history: [], future: [], ambient: true };
let state: State = serverState;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** A stored recipe is a pick, even the committed one; ambient stores nothing. */
function persist(recipe: Recipe, ambient = false) {
  try {
    if (ambient) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(recipe));
  } catch {
    /* storage unavailable: the theme lasts for this page */
  }
}

let started = false;
/** Read the URL and storage once, on the client. Safe to call any number of times. */
export function startTheme() {
  if (started || typeof window === 'undefined') return;
  started = true;
  let recipe: Recipe | null = null;
  const url = new URL(window.location.href);
  const code = url.searchParams.get('t');
  if (code) {
    try {
      // A Halftone code or a shadcn preset code (its notes only show where the code is pasted).
      recipe = readThemeCode(code).recipe;
    } catch {
      /* a bad code: ignore it */
    }
    url.searchParams.delete('t');
    window.history.replaceState(window.history.state, '', url);
  }
  if (!recipe) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) recipe = normalizeRecipe(JSON.parse(saved));
    } catch {
      /* unreadable: forget it, and fall back to the committed theme (ambient) */
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }
  if (recipe) {
    state = { ...state, recipe, ambient: false };
    persist(recipe);
  }
}

/** Called on every change. */
export function subscribeTheme(listener: () => void) {
  startTheme();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * A hover preview: the studio's pickers show a value on the site and in the frames before it is picked.
 * Not persisted and not in the undo history; `previewRecipe(null)` ends it.
 */
let preview: Recipe | null = null;
let previewTimer: ReturnType<typeof setTimeout> | undefined;
export function previewRecipe(input: RecipeInput | null) {
  clearTimeout(previewTimer);
  const apply = () => {
    const next = input ? normalizeRecipe({ ...state.recipe, ...input, font: { ...state.recipe.font, ...input.font } }) : null;
    if (JSON.stringify(next) === JSON.stringify(preview)) return;
    preview = next;
    state = { ...state };
    emit();
  };
  // Leaving is immediate; entering waits a beat, so sweeping across a list doesn't re-theme every row.
  if (input) previewTimer = setTimeout(apply, 80);
  else apply();
}
export const isPreviewing = () => preview !== null;

/** The theme on screen: the hover preview while there is one, else the recipe. */
export const currentRecipe = () => preview ?? state.recipe;

let lastEdit = { key: '', at: 0 };

/**
 * Replace the theme (or change part of it). Keeps an undo history; `coalesce` folds a burst of changes to
 * the same control (dragging the colour picker) into one undo step.
 */
export function setRecipe(next: RecipeInput | ((current: Recipe) => RecipeInput), { coalesce }: { coalesce?: string } = {}) {
  const input = typeof next === 'function' ? next(state.recipe) : next;
  const recipe = normalizeRecipe({ ...state.recipe, ...input, font: { ...state.recipe.font, ...input.font } });
  // Picking what is already shown still ends the ambient drift: it is a choice.
  if (JSON.stringify(recipe) === JSON.stringify(state.recipe) && !state.ambient) return;
  const now = Date.now();
  const merge = !!coalesce && lastEdit.key === coalesce && now - lastEdit.at < 1000 && state.history.length > 0;
  lastEdit = { key: coalesce ?? '', at: now };
  const history = merge ? state.history : [...state.history, state.recipe].slice(-50);
  preview = null;
  state = { recipe, history, future: [], ambient: false };
  persist(recipe);
  emit();
}

export function undo() {
  const prev = state.history.at(-1);
  if (!prev) return;
  state = { recipe: prev, history: state.history.slice(0, -1), future: [state.recipe, ...state.future], ambient: false };
  persist(prev);
  emit();
}

export function redo() {
  const [next, ...future] = state.future;
  if (!next) return;
  state = { recipe: next, history: [...state.history, state.recipe], future, ambient: false };
  persist(next);
  emit();
}

/**
 * What shuffle may change, one key per control row in the studio: a locked row keeps its value. Fonts lock
 * one role at a time; the rest are recipe axes.
 */
export const LOCK_KEYS = ['brand', 'neutral', 'heading', 'body', 'mono', 'size', 'leading', 'flow', 'measure', 'radius', 'controls', 'border', 'depth', 'stroke', 'density'] as const;
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

/** A new theme from random values for every unlocked row. */
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
  for (const key of ['size', 'leading', 'flow', 'measure', 'radius', 'controls', 'border', 'depth', 'stroke', 'density'] as const) {
    if (free(key)) Object.assign(next, { [key]: pick(OPTIONS[key] as readonly string[]) });
  }
  setRecipe(next);
}

/** Back to the theme in tokens.json, picked (the studio's reset). */
export const reset = () => setRecipe({ ...committed, preset: committed.preset });

/** Back to the start: the committed theme with the ambient drift over it, and nothing stored. */
export function resumeAmbient() {
  if (state.ambient) return;
  preview = null;
  state = { recipe: committed, history: [...state.history, state.recipe].slice(-50), future: [], ambient: true };
  persist(committed, true);
  emit();
}

/** Whether the colours are drifting (nothing picked yet). Read outside React by lib/theme/ambient.ts. */
export const isAmbient = () => state.ambient;

const getSnapshot = () => state;
const getServerSnapshot = () => serverState;

/** The current recipe and its undo state. */
export function useThemeState() {
  return React.useSyncExternalStore(subscribeTheme, getSnapshot, getServerSnapshot);
}

const cache = new Map<string, Theme>();
/** A generated theme, memoised by recipe. */
export function themeFor(recipe: Recipe): Theme {
  const key = JSON.stringify(recipe);
  let theme = cache.get(key);
  if (!theme) {
    theme = generateTheme(recipe, base);
    cache.set(key, theme);
  }
  return theme;
}

/** The current theme, generated. */
export function useLiveTheme(): { recipe: Recipe; theme: Theme; isCommitted: boolean; ambient: boolean; canUndo: boolean; canRedo: boolean } {
  const s = useThemeState();
  // `recipe` is what is picked (the controls show it); `theme` is what is on screen (a hover preview).
  const shown = preview ?? s.recipe;
  return {
    recipe: s.recipe,
    theme: themeFor(shown),
    isCommitted: sameRecipe(shown, committed),
    ambient: s.ambient && !preview,
    canUndo: s.history.length > 0,
    canRedo: s.future.length > 0,
  };
}
