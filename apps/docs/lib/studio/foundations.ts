'use client';
/**
 * What the Foundations editors read and write (apps/docs/design/studio-wireframes.md › Foundations). Every edit goes
 * through `editSystem` (lib/studio/systems.ts), so it applies live, saves itself and can be undone; the document is
 * normalised on the way in, so a value set back to what is generated stops being an edit.
 */
import { normalizeSystem, systemOverrides, systemRamps, type ColorRole, type HalftoneSystem, type SystemRamp } from '@halftone-ds/tokens/system';
import { editSystem, systemTheme } from '@/lib/studio/systems';
import { base } from '@/lib/theme/base';

/** A ramp's steps, the axis every ramp shares. */
export const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;
export type Mode = 'light' | 'dark';

/** Change the system on screen, normalised. An edit the schema refuses is dropped (the field shows why). */
export function edit(change: (doc: HalftoneSystem) => HalftoneSystem, coalesce?: string) {
  editSystem(
    (doc) => {
      try {
        return normalizeSystem(change(structuredClone(doc)));
      } catch {
        return doc;
      }
    },
    { coalesce }
  );
}

// ---- reading, memoised per document (documents are replaced, never changed) ---------------------------------

const rampsMemo = new WeakMap<HalftoneSystem, Record<ColorRole, SystemRamp>>();
export function rampsOf(doc: HalftoneSystem) {
  let r = rampsMemo.get(doc);
  if (!r) rampsMemo.set(doc, (r = systemRamps(doc, base)));
  return r;
}

const overridesMemo = new WeakMap<HalftoneSystem, Set<string>>();
/** Every edited path ('colors.brand.steps.600', 'roles.primary.dark', …): what the "edited" marks read. */
export function overridesOf(doc: HalftoneSystem) {
  let o = overridesMemo.get(doc);
  if (!o) overridesMemo.set(doc, (o = new Set(systemOverrides(doc))));
  return o;
}

// ---- colour ----------------------------------------------------------------------------------------

export const RAMP_LABELS: Record<ColorRole, string> = {
  brand: 'Brand',
  neutral: 'Neutral',
  danger: 'Error',
  success: 'Success',
  warning: 'Warning',
  info: 'Info',
};

/**
 * The roles row: 21 semantic colours, the first seven shown and the rest under "more" (wireframe 1). A role's
 * foreground (`primary-foreground`) is edited in the role's own popover.
 */
export const ROLES = [
  'primary',
  'background',
  'foreground',
  'border',
  'muted',
  'destructive',
  'ring',
  'card',
  'popover',
  'secondary',
  'accent',
  'input',
  'success',
  'warning',
  'info',
  'sidebar',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
] as const;
export type RoleName = (typeof ROLES)[number];
export const ROLES_SHOWN = 7;

export const roleLabel = (name: string) => {
  const s = name.replace(/-/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** 'brand.600' for '{primitive.color.brand.600}'; a hex stays a hex. */
export function refStep(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const m = /^\{primitive\.color\.([a-z]+)\.(\d+)\}$/.exec(value);
  if (m) return `${m[1]}.${m[2]}`;
  return value.startsWith('#') ? value.toLowerCase() : null;
}

/** Where a semantic colour points in each mode, as drawn (after the contrast fixer). */
export function roleTarget(doc: HalftoneSystem, name: string): Record<Mode, string | null> {
  const color = (systemTheme(doc).semantic as { color: Record<string, Record<Mode, string>> }).color[name];
  return { light: refStep(color?.light), dark: refStep(color?.dark) };
}

/** 'Brand 600' for 'brand.600', '#7c881a' for a hex. */
export const targetLabel = (target: string | null) => {
  if (!target) return '—';
  if (target.startsWith('#')) return target.toUpperCase();
  const [ramp, step] = target.split('.');
  return `${RAMP_LABELS[ramp as ColorRole] ?? ramp} ${step}`;
};

export function roleHex(doc: HalftoneSystem, name: string, mode: Mode) {
  return systemTheme(doc).resolved[mode][name];
}

/** The text or edge a role is read against, for its contrast line. */
export function rolePair(name: string): { other: string; on: boolean; threshold: number } | null {
  if (name === 'background') return { other: 'foreground', on: true, threshold: 4.5 };
  if (name === 'foreground') return { other: 'background', on: false, threshold: 4.5 };
  if (['border', 'input', 'ring'].includes(name) || name.startsWith('chart-')) return { other: 'background', on: false, threshold: 3 };
  return { other: `${name}-foreground`, on: true, threshold: 4.5 };
}

export function setRole(name: string, mode: Mode, value: string | null) {
  edit((doc) => {
    const entry = { ...doc.roles[name] };
    if (value === null) delete entry[mode];
    else entry[mode] = value as never;
    doc.roles = { ...doc.roles, [name]: entry };
    if (!Object.keys(entry).length) delete doc.roles[name];
    return doc;
  });
}

/** The ramp's input colour. The brand's is the recipe's brand; the others are their own seed. */
export function setSeed(role: ColorRole, hex: string) {
  edit((doc) => {
    if (role === 'brand') {
      doc.recipe = { ...doc.recipe, brand: hex, preset: undefined };
      doc.preset = undefined;
    } else doc.colors = { ...doc.colors, [role]: { ...doc.colors[role], seed: hex as `#${string}` } };
    return doc;
  }, `seed.${role}`);
}

/** A preset neutral (zinc, slate…, or 'brand' for tinted): drops a custom neutral seed and its pin. */
export function setNeutralPreset(neutral: HalftoneSystem['recipe']['neutral']) {
  edit((doc) => {
    doc.recipe = { ...doc.recipe, neutral, preset: undefined };
    doc.preset = undefined;
    const { seed: _s, anchor: _a, ...rest } = doc.colors.neutral ?? {};
    doc.colors = { ...doc.colors, neutral: rest };
    if (!Object.keys(rest).length) delete doc.colors.neutral;
    return doc;
  });
}

/** Pin the input to a step, or null for "auto" (its nearest step). */
export function setAnchor(role: ColorRole, step: string | null) {
  edit((doc) => {
    const entry = { ...doc.colors[role] };
    if (step === null) delete entry.anchor;
    else entry.anchor = step as never;
    doc.colors = { ...doc.colors, [role]: entry };
    return doc;
  });
}

export function setStep(role: ColorRole, step: string, hex: string | null) {
  edit(
    (doc) => {
      const entry = { ...doc.colors[role] };
      const steps = { ...entry.steps } as Record<string, string>;
      if (hex === null) delete steps[step];
      else steps[step] = hex;
      entry.steps = steps as never;
      if (!Object.keys(steps).length) delete entry.steps;
      doc.colors = { ...doc.colors, [role]: entry };
      return doc;
    },
    hex === null ? undefined : `step.${role}.${step}`
  );
}

/** Everything edited on a ramp: its steps, its pin and (but for the brand, whose seed is the recipe's) its seed. */
export function resetRamp(role: ColorRole) {
  edit((doc) => {
    const colors = { ...doc.colors };
    delete colors[role];
    doc.colors = colors;
    return doc;
  });
}

/** The roles that point at a step, per mode: what a step's "used by" lists. */
export function rolesOn(doc: HalftoneSystem, target: string) {
  const out: { name: string; modes: Mode[] }[] = [];
  const color = (systemTheme(doc).semantic as { color: Record<string, Record<Mode, string>> }).color;
  for (const name of Object.keys(color)) {
    const modes = (['light', 'dark'] as const).filter((m) => refStep(color[name][m]) === target);
    if (modes.length) out.push({ name, modes });
  }
  return out;
}

// ---- contrast (WCAG 2.1) ----------------------------------------------------------------------------------------

const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
export const ratioText = (r: number) => (r >= 10 ? r.toFixed(0) : r.toFixed(1));
/** 'AAA', 'AA', 'AA large' (3:1) or null, for text. */
export const grade = (r: number, threshold = 4.5) => (threshold < 4.5 ? (r >= 3 ? 'pass' : null) : r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA large' : null);

export const HEX = /^#[0-9a-f]{6}$/;
/** '#abc', 'abc', '#AABBCC' → '#aabbcc', or null. */
export function readHex(input: string): string | null {
  let s = input.trim().toLowerCase();
  if (!s.startsWith('#')) s = `#${s}`;
  if (/^#[0-9a-f]{3}$/.test(s)) s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  return HEX.test(s) ? s : null;
}
