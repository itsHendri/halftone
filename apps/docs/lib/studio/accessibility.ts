'use client';
/**
 * What the Accessibility tab reads (apps/docs/design/studio-wireframes.md › Accessibility tab, wireframe 5): every
 * pairing the build checks as one line per pairing (light and dark), the hand-made choices behind the ones that fail,
 * and a "fix" for each: the nearest step on the same ramp that passes. Generated colours are never in here as a
 * cause: the fixer has already moved them (`theme.adjustments`), and the tab says so.
 */
import { generateSystem, normalizeSystem, type HalftoneSystem } from '@halftone-ds/tokens/system';
import { apcaContrast, componentContrast, contrastReport, type ComponentName, type ContrastRow, type Theme } from '@halftone-ds/tokens/theme';
import { edit, rampsOf, refStep, roleLabel, STEPS, targetLabel, type Mode } from '@/lib/studio/foundations';
import { base } from '@/lib/theme/base';

export const MODES: Mode[] = ['light', 'dark'];

/** One pairing, light and dark side by side. A component variant's label on its fill names its component. */
export type Line = { label: string; fgName: string; bgName: string; threshold: number; modes: Partial<Record<Mode, ContrastRow>>; component?: { name: ComponentName; variant: string } };

const linesMemo = new WeakMap<Theme, Line[]>();
/** Every pairing the token build's contrast gate checks (the strict set), one line each. */
export function contrastLines(theme: Theme): Line[] {
  let lines = linesMemo.get(theme);
  if (lines) return lines;
  const byLabel = new Map<string, Line>();
  for (const r of contrastReport(theme.resolved)) {
    const line = byLabel.get(r.label) ?? { label: r.label, fgName: r.fgName, bgName: r.bgName, threshold: r.threshold, modes: {} };
    // `muted-foreground on muted` is both a fill label and body text to the gate: count it once.
    line.modes[r.mode] ??= r;
    byLabel.set(r.label, line);
  }
  // The components' own pairings (Foundations › Components): a variant's label on its fill, the fill over the page.
  // One that draws the same colours as a pairing above (a default Button is primary-foreground on primary) isn't
  // counted twice.
  const seen = new Set([...byLabel.values()].map((l) => pairKey(l.modes)));
  const rows = componentContrast(theme.components, { light: theme.resolved.light.background, dark: theme.resolved.dark.background });
  const byVariant = new Map<string, Line>();
  for (const r of rows) {
    const key = `${r.component}.${r.variant}`;
    const line = byVariant.get(key) ?? { label: r.label, fgName: r.fgName ?? 'style colour', bgName: r.bgName ?? 'style colour', threshold: r.threshold, modes: {}, component: { name: r.component, variant: r.variant } };
    line.modes[r.mode] = { ...r, pass: r.ratio >= r.threshold, apca: apcaContrast(r.fg, r.bg) };
    byVariant.set(key, line);
  }
  for (const line of byVariant.values()) {
    const key = pairKey(line.modes);
    if (seen.has(key)) continue;
    seen.add(key);
    byLabel.set(line.label, line);
  }
  linesMemo.set(theme, (lines = [...byLabel.values()]));
  return lines;
}

/** The colours a line draws, both modes, either way round (contrast is symmetric). */
const pairKey = (modes: Line['modes']) => MODES.map((m) => [modes[m]?.fg, modes[m]?.bg].sort().join('/')).join('|');

export const lineFails = (l: Line) => MODES.some((m) => l.modes[m] && !l.modes[m].pass);

/** Pairings below AA, in light or dark: the number on the tab. */
export const failingCount = (theme: Theme) => contrastLines(theme).filter(lineFails).length;

/** Generated colours the build moved to pass, once per token and mode. */
export const autoFixed = (theme: Theme) => theme.adjustments.filter((a, i, all) => all.findIndex((b) => b.token === a.token && b.mode === a.mode) === i);

// ---- your choices ------------------------------------------------------------------------------------------------

const colorOf = (doc: HalftoneSystem) => (generated(doc).semantic as { color: Record<string, Record<Mode, string>> }).color;

/**
 * The role a hand-made choice lives on. A colour the fixer left alone because it follows a mapped role (the ring and
 * the button follow a mapped primary) points back at that role: moving it moves both.
 */
function owner(doc: HalftoneSystem, name: string, mode: Mode) {
  if (doc.roles[name]?.[mode] !== undefined) return name;
  const value = colorOf(doc)[name]?.[mode];
  const mapped = Object.keys(doc.roles).find((r) => doc.roles[r]?.[mode] !== undefined && colorOf(doc)[r]?.[mode] === value);
  return mapped ?? name;
}

export type Choice = { name: string; mode: Mode };
const choiceKey = (c: Choice) => `${c.name}:${c.mode}`;

/** The hand-made choices (a mapped role, or a role on an edited step) behind failing pairings: "your edits to check". */
export function choicesToCheck(doc: HalftoneSystem): Choice[] {
  const theme = generated(doc);
  const seen = new Map<string, Choice>();
  for (const w of theme.warnings) {
    for (const name of w.locked) {
      const c = { name: owner(doc, name, w.mode), mode: w.mode };
      seen.set(choiceKey(c), c);
    }
  }
  return [...seen.values()];
}

/** The hand-made choices behind one pairing, per mode (none: it passes, or only generated colours are in it). */
export function choicesIn(doc: HalftoneSystem, label: string): Choice[] {
  const theme = generated(doc);
  const out = new Map<string, Choice>();
  for (const w of theme.warnings) {
    if (w.label !== label) continue;
    for (const name of w.locked) {
      const c = { name: owner(doc, name, w.mode), mode: w.mode };
      out.set(choiceKey(c), c);
    }
  }
  return [...out.values()];
}

// ---- fix ---------------------------------------------------------------------------------------------------------

/** One move a fix makes: a role, in one mode, from where it points to a step ('brand.700'). */
export type Move = { name: string; mode: Mode; from: string | null; to: string };

const genMemo = new WeakMap<HalftoneSystem, Theme>();
/** A document's theme, generated here so trying candidates doesn't churn the Studio's theme cache. */
function generated(doc: HalftoneSystem): Theme {
  let t = genMemo.get(doc);
  if (!t) genMemo.set(doc, (t = generateSystem(doc, base) as Theme));
  return t;
}

function withRole(doc: HalftoneSystem, name: string, mode: Mode, value: string): HalftoneSystem | null {
  try {
    return normalizeSystem({ ...doc, roles: { ...doc.roles, [name]: { ...doc.roles[name], [mode]: value } } } as HalftoneSystem);
  } catch {
    return null;
  }
}

const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * The step that fixes `label` in `mode` by moving `name`: on the ramp it points at (or would, generated), the steps
 * closest in lightness to what it is now come first. A step that clears every pairing the role fails in that mode
 * wins over one that only clears this one; one that adds a failure elsewhere is never picked.
 */
function nearestStep(doc: HalftoneSystem, name: string, mode: Mode, label: string): Move | null {
  const theme = generated(doc);
  const now = theme.resolved[mode][name];
  const from = refStep(colorOf(doc)[name]?.[mode]);
  let ramp = from && !from.startsWith('#') ? from.split('.')[0] : null;
  if (!ramp) {
    // A typed hex: the ramp it would point at without the choice.
    const { [mode]: _drop, ...rest } = doc.roles[name] ?? {};
    const roles = { ...doc.roles, [name]: rest };
    if (!Object.keys(rest).length) delete roles[name];
    const target = refStep(colorOf(normalizeSystem({ ...doc, roles } as HalftoneSystem))[name]?.[mode]);
    ramp = target && !target.startsWith('#') ? target.split('.')[0] : 'neutral';
  }
  const values = rampsOf(doc)[ramp as keyof ReturnType<typeof rampsOf>]?.values;
  if (!values || !now) return null;
  const others = theme.warnings.filter((w) => !(w.mode === mode && w.locked.some((n) => owner(doc, n, mode) === name))).length;
  const candidates = STEPS.filter((s) => `${ramp}.${s}` !== from).sort((a, b) => Math.abs(luminance(values[a]) - luminance(now)) - Math.abs(luminance(values[b]) - luminance(now)));
  let fallback: Move | null = null;
  for (const step of candidates) {
    const next = withRole(doc, name, mode, `${ramp}.${step}`);
    if (!next) continue;
    let t: Theme;
    try {
      t = generated(next);
    } catch {
      continue;
    }
    if (t.warnings.some((w) => w.mode === mode && w.label === label)) continue;
    const mine = t.warnings.filter((w) => w.mode === mode && w.locked.some((n) => owner(next, n, mode) === name)).length;
    const elsewhere = t.warnings.length - mine;
    if (elsewhere > others) continue;
    const move = { name, mode, from, to: `${ramp}.${step}` };
    if (!mine) return move;
    fallback ??= move;
  }
  return fallback;
}

const fixMemo = new WeakMap<HalftoneSystem, Map<string, Move[] | null>>();
/**
 * The moves that make a failing pairing pass, light then dark, each on top of the last (null: no step on the ramp
 * does it, so it's left to the person). The fg moves first when it was chosen by hand; the fill only when it can't.
 */
export function fixFor(doc: HalftoneSystem, label: string): Move[] | null {
  let memo = fixMemo.get(doc);
  if (!memo) fixMemo.set(doc, (memo = new Map()));
  if (memo.has(label)) return memo.get(label)!;
  const moves: Move[] = [];
  let current = doc;
  for (const mode of MODES) {
    const w = generated(current).warnings.find((x) => x.mode === mode && x.label === label);
    if (!w) continue;
    const names = [...new Set(w.locked.map((n) => owner(current, n, mode)))];
    let move: Move | null = null;
    for (const name of names) if ((move = nearestStep(current, name, mode, label))) break;
    if (!move) {
      memo.set(label, null);
      return null;
    }
    moves.push(move);
    current = withRole(current, move.name, move.mode, move.to) ?? current;
  }
  const result = moves.length ? moves : null;
  memo.set(label, result);
  return result;
}

/** "Primary (light) to Brand 700": what a fix does, for its button and its toast. */
export const describeMoves = (moves: Move[]) => moves.map((m) => `${roleLabel(m.name)} (${m.mode}) to ${targetLabel(m.to)}`).join(' and ');

/** Apply a fix as one edit, so one undo puts it back. */
export function applyFix(moves: Move[]) {
  edit((doc) => {
    for (const m of moves) doc.roles = { ...doc.roles, [m.name]: { ...doc.roles[m.name], [m.mode]: m.to as never } };
    return doc;
  });
}
