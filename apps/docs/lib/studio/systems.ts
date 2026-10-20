'use client';
/**
 * The Studio's saved systems (apps/docs/design/studio-wireframes.md › Systems). Each one is a HalftoneSystem document
 * (@halftone-ds/tokens/system). The documents live in IndexedDB, because a system's logos would overflow
 * localStorage; localStorage keeps only the active id (ACTIVE_KEY) and the boot caches (lib/theme/keys.ts).
 *
 * What the site shows is one document, `doc`:
 *   - the active saved system, or
 *   - "Halftone", the committed theme, when nothing is active (a first-time visitor, or after "Drifting colours").
 *     The colours drift over it (lib/theme/ambient.ts). Its first edit saves it as a system.
 *   - a shared one (`?t=` code, `?s=` JSON), read-only: edits stay in this page until "Save as new system", and it
 *     never overwrites a saved system.
 * Undo and redo work on the whole document, one history per system, for this page.
 *
 * On the first load after Studio shipped, the old `halftone.theme` and `halftone.brand` move in once as "My system".
 */
import { generateSystem, migrate, newSystemId, normalizeSystem, systemCode, validateSystem, withoutBrandImages, type HalftoneSystem } from '@halftone-ds/tokens/system';
import { normalizeRecipe, PRESETS, sameRecipe, type Recipe, type Theme } from '@halftone-ds/tokens/theme';
import * as React from 'react';
import { base, committed } from '@/lib/theme/base';
import { ACTIVE_KEY, LEGACY_BRAND_KEY, LEGACY_THEME_KEY } from '@/lib/theme/keys';
import { readThemeCode } from '@/lib/theme/read-code';

export type { HalftoneSystem };

/** The committed theme as a system: what a visitor with nothing saved sees. */
export const STARTER: HalftoneSystem = migrate(committed, undefined, { id: 'halftone', name: 'Halftone', updatedAt: '2026-10-20T00:00:00.000Z' });

type Shared = { param: 't' | 's'; value: string };
export type SystemsState = {
  /** 'loading' until IndexedDB has answered (the boot CSS stays on screen meanwhile). */
  status: 'loading' | 'ready';
  /** 'memory': this browser refused storage, so nothing outlives the page. */
  storage: 'browser' | 'memory';
  /** Newest edit first. */
  saved: HalftoneSystem[];
  /** null: nothing active, "Halftone" (STARTER) drifts. */
  activeId: string | null;
  /** The document on screen. */
  doc: HalftoneSystem;
  /** The link a shared system came from, while one is open. */
  shared: Shared | null;
  /** The system the old theme moved into, while its one-time banner hasn't been dismissed. */
  migrated: string | null;
  ambient: boolean;
  canUndo: boolean;
  canRedo: boolean;
};

const SERVER: SystemsState = {
  status: 'loading',
  storage: 'browser',
  saved: [],
  activeId: null,
  doc: STARTER,
  shared: null,
  migrated: null,
  ambient: true,
  canUndo: false,
  canRedo: false,
};
let state = SERVER;
/** Whether storage says a system is (or is about to be) active, before IndexedDB answers: no drift meanwhile. */
let bootHint = false;
const listeners = new Set<() => void>();

// ---- history ----------------------------------------------------------------------------------------

type History = { past: HalftoneSystem[]; future: HalftoneSystem[] };
const histories = new Map<string, History>();
const historyKey = (s: SystemsState) => (s.shared ? 'shared' : (s.activeId ?? STARTER.id));
function history(key = historyKey(state)) {
  let h = histories.get(key);
  if (!h) histories.set(key, (h = { past: [], future: [] }));
  return h;
}

function set(patch: Partial<SystemsState>) {
  const next = { ...state, ...patch };
  const h = histories.get(historyKey(next));
  state = {
    ...next,
    ambient: next.status === 'loading' ? !bootHint : next.activeId === null && !next.shared,
    canUndo: !!h?.past.length,
    canRedo: !!h?.future.length,
  };
  listeners.forEach((l) => l());
}

// ---- IndexedDB ----------------------------------------------------------------------------------------

const DB_NAME = 'halftone';
const SYSTEMS = 'systems';
const META = 'meta';
const BANNER = 'migrated-banner';

let db: Promise<IDBDatabase> | null = null;
function openDb() {
  db ??= new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(SYSTEMS, { keyPath: 'id' });
      req.result.createObjectStore(META);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB is blocked by another tab.'));
  });
  return db;
}

async function run<T>(store: string, mode: IDBTransactionMode, op: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const d = await openDb();
  return new Promise((resolve, reject) => {
    const t = d.transaction(store, mode);
    const req = op(t.objectStore(store));
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

const pending = new Map<string, HalftoneSystem>();
let flushTimer: ReturnType<typeof setTimeout> | undefined;
function flush() {
  clearTimeout(flushTimer);
  const docs = [...pending.values()];
  pending.clear();
  for (const doc of docs) run(SYSTEMS, 'readwrite', (s) => s.put(doc)).catch(storageFailed);
}
/** Saves a burst of edits (dragging a colour) once it settles. */
function save(doc: HalftoneSystem) {
  if (state.storage === 'memory') return;
  pending.set(doc.id, doc);
  clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 300);
}
function remove(id: string) {
  pending.delete(id);
  if (state.storage === 'memory') return;
  run(SYSTEMS, 'readwrite', (s) => s.delete(id)).catch(storageFailed);
}
function storageFailed() {
  set({ storage: 'memory' });
}

const readLocal = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
function writeActive(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {}
}

// ---- start ----------------------------------------------------------------------------------------

const newest = (list: HalftoneSystem[]) => [...list].sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
const now = () => new Date().toISOString();

/** The preset a recipe is exactly, for naming a system made from a code. */
export const presetNamed = (recipe: Recipe) => PRESETS.find((p) => sameRecipe(recipe, p.recipe))?.name;

/** The old single theme and brand, as a system ("My system"), or null when there's nothing to move in. */
function legacySystem() {
  const theme = readLocal(LEGACY_THEME_KEY);
  const brand = readLocal(LEGACY_BRAND_KEY);
  if (!theme && !brand) return null;
  let recipe: Recipe = committed;
  try {
    if (theme) recipe = normalizeRecipe(JSON.parse(theme));
  } catch {}
  let doc = migrate(recipe, undefined, { name: 'My system' });
  try {
    if (brand) doc = migrate(doc, JSON.parse(brand));
  } catch {}
  return doc;
}

/** A shared link's system, or null (a bad link is ignored). */
async function readShared(link: Shared): Promise<HalftoneSystem | null> {
  try {
    if (link.param === 't') {
      const { recipe } = readThemeCode(link.value);
      return migrate(recipe, undefined, { id: 'shared', name: presetNamed(recipe) ?? 'Untitled', updatedAt: now() });
    }
    return { ...(await decodeSystem(link.value)), id: 'shared' };
  } catch {
    return null;
  }
}

let started = false;
/** Reads storage and the URL once, on the client. Safe to call any number of times. */
export function startSystems() {
  if (started || typeof window === 'undefined') return;
  started = true;
  const params = new URL(window.location.href).searchParams;
  const link: Shared | null = params.get('s') ? { param: 's', value: params.get('s')! } : params.get('t') ? { param: 't', value: params.get('t')! } : null;
  const storedId = readLocal(ACTIVE_KEY);
  const legacy = legacySystem();
  bootHint = !!(storedId || legacy || link);
  set({});
  window.addEventListener('pagehide', flush);
  void load(storedId, legacy, link);
}

async function load(storedId: string | null, legacy: HalftoneSystem | null, link: Shared | null) {
  let saved: HalftoneSystem[] = [];
  let storage: SystemsState['storage'] = 'browser';
  let migrated: string | null = null;
  try {
    const rows = (await run<unknown[]>(SYSTEMS, 'readonly', (s) => s.getAll())) ?? [];
    for (const row of rows) {
      try {
        saved.push(normalizeSystem(row as HalftoneSystem));
      } catch {
        /* a document this version can't read: leave it in storage, untouched */
      }
    }
    const banner = await run<unknown>(META, 'readonly', (s) => s.get(BANNER));
    migrated = typeof banner === 'string' && saved.some((s) => s.id === banner) ? banner : null;
  } catch {
    storage = 'memory';
  }
  saved = newest(saved);
  let activeId = storedId && saved.some((s) => s.id === storedId) ? storedId : null;
  // An id whose system is gone (deleted in another tab): the newest one, if any.
  if (storedId && !activeId) activeId = saved[0]?.id ?? null;
  // Before Studio: the one theme and brand move in once, as "My system".
  if (!storedId && legacy) {
    saved = [legacy, ...saved];
    activeId = legacy.id;
    migrated = legacy.id;
    if (storage === 'browser') {
      try {
        await run(SYSTEMS, 'readwrite', (s) => s.put(legacy));
        await run(META, 'readwrite', (s) => s.put(legacy.id, BANNER));
        localStorage.removeItem(LEGACY_THEME_KEY);
        localStorage.removeItem(LEGACY_BRAND_KEY);
      } catch {
        storage = 'memory';
      }
    }
  }
  writeActive(activeId);
  const active = saved.find((s) => s.id === activeId) ?? STARTER;
  const sharedDoc = link ? await readShared(link) : null;
  if (link && !sharedDoc) stripLink();
  set({ status: 'ready', storage, saved, activeId, migrated, doc: sharedDoc ?? active, shared: sharedDoc ? link : null });
}

// ---- reading ----------------------------------------------------------------------------------------

export function subscribeSystems(listener: () => void) {
  startSystems();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export const systemsState = () => state;
export const useSystems = () => React.useSyncExternalStore(subscribeSystems, systemsState, () => SERVER);

/** The name the switcher shows. */
export const systemLabel = (s: SystemsState) => (s.shared ? `${s.doc.name} · shared` : s.doc.name);

/** Two documents are the same system content (ignores when it was saved). */
const sameDoc = (a: HalftoneSystem, b: HalftoneSystem) => JSON.stringify({ ...a, updatedAt: '' }) === JSON.stringify({ ...b, updatedAt: '' });

const themes = new Map<string, Theme>();
/** A system's generated theme, memoised by everything but its name, id, time and brand (none of which it reads). */
export function systemTheme(doc: HalftoneSystem): Theme {
  const key = JSON.stringify({ ...doc, id: '', name: '', updatedAt: '', brand: null });
  let theme = themes.get(key);
  if (theme) {
    themes.delete(key);
  } else {
    theme = generateSystem(doc, base) as Theme;
  }
  themes.set(key, theme);
  if (themes.size > 60) themes.delete(themes.keys().next().value as string);
  return theme;
}

// ---- editing ----------------------------------------------------------------------------------------

let lastEdit = { key: '', at: 0 };

/**
 * Change the document on screen. Keeps an undo history; `coalesce` folds a burst of changes to the same control
 * (dragging a colour) into one step. Editing "Halftone" saves it as a system; editing a shared one keeps it in
 * this page only.
 */
export function editSystem(change: (doc: HalftoneSystem) => HalftoneSystem, { coalesce }: { coalesce?: string } = {}) {
  startSystems();
  // Until IndexedDB answers (a few ms) there's no knowing which system an edit belongs to.
  if (state.status === 'loading') return;
  const before = state.doc;
  const next = change(before);
  // Picking what is already shown still ends the drift: it is a choice.
  if (sameDoc(next, before) && !state.ambient) return;
  const t = Date.now();
  const h = history();
  const merge = !!coalesce && lastEdit.key === coalesce && t - lastEdit.at < 1000 && h.past.length > 0;
  lastEdit = { key: coalesce ?? '', at: t };
  if (!merge) h.past = [...h.past, before].slice(-50);
  h.future = [];
  commit(next);
}

/** Put a document on screen as the current system's content, and save it. */
function commit(content: HalftoneSystem) {
  if (state.shared) return set({ doc: { ...content, id: 'shared' } });
  if (state.activeId === null) {
    // The first edit to "Halftone" makes it a saved system, and its history comes along.
    const doc = { ...content, id: newSystemId(), updatedAt: now() };
    histories.set(doc.id, history(STARTER.id));
    histories.delete(STARTER.id);
    writeActive(doc.id);
    save(doc);
    return set({ saved: [doc, ...state.saved], activeId: doc.id, doc });
  }
  const doc = { ...content, id: state.activeId, updatedAt: now() };
  save(doc);
  set({ saved: [doc, ...state.saved.filter((s) => s.id !== doc.id)], doc });
}

export function undoSystem() {
  const h = history();
  const prev = h.past.at(-1);
  if (!prev) return;
  h.past = h.past.slice(0, -1);
  h.future = [state.doc, ...h.future];
  // The name and id are the system's, not the step's (a rename isn't undone by ⌘Z).
  commit({ ...prev, name: state.doc.name });
}

export function redoSystem() {
  const h = history();
  const [next, ...future] = h.future;
  if (!next) return;
  h.future = future;
  h.past = [...h.past, state.doc];
  commit({ ...next, name: state.doc.name });
}

// ---- the list ----------------------------------------------------------------------------------------

/** Show a saved system, or "Halftone" (null: the drifting colours). Leaves a shared one. */
export function switchSystem(id: string | null) {
  startSystems();
  if (state.shared) stripLink();
  const doc = (id && state.saved.find((s) => s.id === id)) || null;
  writeActive(doc?.id ?? null);
  set({ activeId: doc?.id ?? null, doc: doc ?? STARTER, shared: null });
}

function add(doc: HalftoneSystem) {
  if (state.shared) stripLink();
  writeActive(doc.id);
  save(doc);
  set({ saved: [doc, ...state.saved], activeId: doc.id, doc, shared: null });
  return doc;
}

export type NewSystemSource = { kind: 'preset'; preset: string } | { kind: 'copy' } | { kind: 'import'; doc: HalftoneSystem };

/** A new system, made active: from a preset (Default is the blank), a copy of the one on screen, or an import. */
export function createNewSystem(name: string, source: NewSystemSource) {
  const label = name.trim() || 'Untitled';
  if (source.kind === 'preset') {
    const preset = PRESETS.find((p) => p.id === source.preset) ?? PRESETS[0];
    return add(migrate({ ...preset.recipe, preset: preset.id }, undefined, { name: label }));
  }
  const from = source.kind === 'copy' ? state.doc : source.doc;
  return add({ ...normalizeSystem(from), id: newSystemId(), name: label, updatedAt: now() });
}

export function renameSystem(id: string, name: string) {
  const label = name.trim();
  const found = state.saved.find((s) => s.id === id);
  if (!label || !found || found.name === label) return;
  const doc = { ...found, name: label, updatedAt: now() };
  save(doc);
  set({ saved: [doc, ...state.saved.filter((s) => s.id !== id)], doc: state.activeId === id && !state.shared ? doc : state.doc });
}

export function duplicateSystem(id: string) {
  const found = state.saved.find((s) => s.id === id);
  if (!found) return;
  return add({ ...found, id: newSystemId(), name: `${found.name} copy`, updatedAt: now() });
}

/** Delete a saved system. Returns what undo needs (restoreSystem). */
export function deleteSystem(id: string) {
  const found = state.saved.find((s) => s.id === id);
  if (!found) return null;
  const wasActive = state.activeId === id;
  remove(id);
  const saved = state.saved.filter((s) => s.id !== id);
  if (wasActive) {
    const next = saved[0] ?? null;
    writeActive(next?.id ?? null);
    set({ saved, activeId: next?.id ?? null, doc: state.shared ? state.doc : (next ?? STARTER) });
  } else set({ saved });
  return { doc: found, wasActive };
}

export function restoreSystem({ doc, wasActive }: { doc: HalftoneSystem; wasActive: boolean }) {
  save(doc);
  const saved = newest([doc, ...state.saved.filter((s) => s.id !== doc.id)]);
  if (wasActive && !state.shared) {
    writeActive(doc.id);
    set({ saved, activeId: doc.id, doc });
  } else set({ saved });
}

export function dismissMigrated() {
  set({ migrated: null });
  if (state.storage === 'browser') run(META, 'readwrite', (s) => s.delete(BANNER)).catch(() => {});
}

// ---- shared links ----------------------------------------------------------------------------------------

function stripLink() {
  const url = new URL(window.location.href);
  url.searchParams.delete('t');
  url.searchParams.delete('s');
  window.history.replaceState(window.history.state, '', url);
}

/** Keep the shared system as a new saved one (edits included). */
export function saveShared() {
  if (!state.shared) return;
  histories.delete('shared');
  return add({ ...state.doc, id: newSystemId(), updatedAt: now() });
}

/** Close the shared system and go back to your own. */
export function discardShared() {
  if (!state.shared) return;
  histories.delete('shared');
  stripLink();
  const active = state.saved.find((s) => s.id === state.activeId) ?? STARTER;
  set({ shared: null, doc: active });
}

const toBase64Url = (bytes: Uint8Array) => {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromBase64Url = (text: string) => {
  const s = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
};

/** A system as `?s=`: its JSON without logos, id or time, deflated, base64url. */
export async function encodeSystem(doc: HalftoneSystem) {
  const { deflateSync, strToU8 } = await import('fflate');
  const { id: _id, updatedAt: _at, ...rest } = withoutBrandImages(doc);
  return toBase64Url(deflateSync(strToU8(JSON.stringify(rest)), { level: 9 }));
}

export async function decodeSystem(value: string): Promise<HalftoneSystem> {
  const { inflateSync, strFromU8 } = await import('fflate');
  const json = JSON.parse(strFromU8(inflateSync(fromBase64Url(value))));
  return normalizeSystem({ ...json, id: 'shared', updatedAt: now() });
}

/** The link that opens a system read-only: `?t=` while a code holds all of it, else `?s=`. */
export async function shareLink(doc: HalftoneSystem, origin = window.location.origin) {
  const code = systemCode(doc);
  return `${origin}/studio/?${code ? `t=${code}` : `s=${await encodeSystem(doc)}`}`;
}

// ---- files ----------------------------------------------------------------------------------------

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'system';
export const systemFileName = (doc: HalftoneSystem) => `${slug(doc.name)}.halftone.json`;

/** Download a system as `<name>.halftone.json` (logos included): `halftone-tokens theme apply` takes it. */
export function downloadSystem(doc: HalftoneSystem) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(normalizeSystem(doc), null, 2) + '\n'], { type: 'application/json' }));
  Object.assign(document.createElement('a'), { href: url, download: systemFileName(doc) }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * What New system › Import was given: a `.halftone.json` (its text), an `ht-` code or a shadcn preset code. Throws
 * with a message for the person. `notes`: what a shadcn code couldn't carry over.
 */
export function readImport(text: string): { doc: HalftoneSystem; notes: string[] } {
  const input = text.trim();
  if (input.startsWith('{')) {
    let json: unknown;
    try {
      json = JSON.parse(input);
    } catch {
      throw new Error('That file isn’t valid JSON.');
    }
    const result = validateSystem(json);
    if (!result.ok || !result.system) throw new Error(`Not a Halftone system file: ${result.errors[0] ?? 'unknown shape'}.`);
    return { doc: result.system, notes: [] };
  }
  const { recipe, notes } = readThemeCode(input);
  return { doc: migrate(recipe, undefined, { name: presetNamed(recipe) ?? 'Imported system' }), notes };
}
