'use client';
/**
 * What the Foundations editors read and write (apps/docs/design/studio-wireframes.md › Foundations). Every edit goes
 * through `editSystem` (lib/studio/systems.ts), so it applies live, saves itself and can be undone; the document is
 * normalised on the way in, so a value set back to what is generated stops being an edit.
 */
import { extraNameProblem, normalizeSystem, systemOverrides, systemRamps, type ColorRole, type HalftoneSystem, type SystemRamp } from '@halftone-ds/tokens/system';
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

// ---- typography, corners, shadows, borders ---------------------------------------------------------------

export type TextStyleName = (typeof TEXT_STYLE_NAMES)[number];
export const TEXT_STYLE_NAMES = ['h1', 'h2', 'h3', 'h4', 'lead', 'large', 'p', 'small', 'muted', 'blockquote', 'code'] as const;
export const TEXT_LABELS: Record<TextStyleName, string> = {
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  lead: 'Lead',
  large: 'Large',
  p: 'Body',
  small: 'Small',
  muted: 'Muted',
  blockquote: 'Quote',
  code: 'Code',
};
type TextKey = 'font' | 'weight' | 'size' | 'leading' | 'tracking';
type TextPatch = Partial<Record<TextKey, string | number | null>>;

/** Set (or, with null, reset) keys of a text style. `null` patch resets the whole style to the scale. */
export function setTextStyle(name: TextStyleName, patch: TextPatch | null, coalesce?: string) {
  edit((doc) => {
    const type = { ...doc.type } as Record<string, Record<string, unknown>>;
    if (patch === null) delete type[name];
    else {
      const style = { ...type[name] };
      for (const [k, v] of Object.entries(patch)) {
        if (v === null) delete style[k];
        else style[k] = v;
      }
      if (Object.keys(style).length) type[name] = style;
      else delete type[name];
    }
    doc.type = type as HalftoneSystem['type'];
    return doc;
  }, coalesce);
}

/** A font role's family: any Google Font (a Halftone pick folds into the recipe and keeps a code), or null to go back. */
export function setFont(role: 'heading' | 'body' | 'mono', family: string | null) {
  edit((doc) => {
    const fonts = { ...doc.fonts };
    if (family === null) delete fonts[role];
    else fonts[role] = family;
    doc.fonts = fonts;
    return doc;
  });
}

export function setRadius(step: string, px: number | null) {
  edit(
    (doc) => {
      const radius = { ...doc.radius } as Record<string, number>;
      if (px === null) delete radius[step];
      else radius[step] = px;
      doc.radius = radius;
      return doc;
    },
    px === null ? undefined : `radius.${step}`
  );
}

export type Layer = { x: number; y: number; blur: number; spread: number; color: string; alpha: number; inset?: true };
export function setShadow(level: string, value: { light: Layer[]; dark: Layer[] } | null, coalesce?: string) {
  edit((doc) => {
    const shadow = { ...doc.shadow } as Record<string, unknown>;
    if (value === null) delete shadow[level];
    else shadow[level] = value;
    doc.shadow = shadow as HalftoneSystem['shadow'];
    return doc;
  }, coalesce);
}

/** A DTCG shadow layer ({ offsetX, …, color: '#rrggbbaa' }) as the document's layer. */
export function layerOf(v: { offsetX: number; offsetY: number; blur: number; spread: number; color: string; inset?: boolean }): Layer {
  const color = v.color.slice(0, 7).toLowerCase();
  const alpha = v.color.length === 9 ? Math.round((parseInt(v.color.slice(7), 16) / 255) * 100) / 100 : 1;
  return { x: v.offsetX, y: v.offsetY, blur: v.blur, spread: v.spread, color, alpha, ...(v.inset ? { inset: true as const } : {}) };
}

/** A shadow level as drawn (generated or edited), as the document's layers per mode. */
export function shadowLayers(doc: HalftoneSystem, level: string): { light: Layer[]; dark: Layer[] } {
  const own = (doc.shadow as Record<string, { light: Layer[]; dark: Layer[] }>)[level];
  if (own) return own;
  const s = (systemTheme(doc).semantic as { shadow: Record<string, Record<Mode, Parameters<typeof layerOf>[0][]>> }).shadow[level];
  return { light: s.light.map(layerOf), dark: s.dark.map(layerOf) };
}

export const layerCss = (layers: Layer[]) =>
  layers.length
    ? layers
        .map((l) => {
          const n = parseInt(l.color.slice(1), 16);
          return `${l.inset ? 'inset ' : ''}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${l.alpha})`;
        })
        .join(', ')
    : 'none';

export function setBorder(patch: { width?: number | null; style?: string | null } | null) {
  edit((doc) => {
    if (patch === null) doc.border = {};
    else {
      const border = { ...doc.border } as Record<string, unknown>;
      for (const [k, v] of Object.entries(patch)) {
        if (v === null) delete border[k];
        else border[k] = v;
      }
      doc.border = border as HalftoneSystem['border'];
    }
    return doc;
  }, 'border');
}

// ---- extras ----------------------------------------------------------------------------------------

export type ExtraKind = 'color' | 'text' | 'radius' | 'shadow' | 'border';
type ExtraItem = { name: string } & Record<string, unknown>;

/** "trendy-green" → "Trendy green": how the list shows an extra. */
export const extraLabel = (token: string) => {
  const s = token.replace(/-/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
};
/** "Trendy green" → "trendy-green": the token name an extra is stored under. */
export const kebab = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

export const extrasOf = (doc: HalftoneSystem, kind: ExtraKind) => (doc.extras[kind] ?? []) as unknown as ExtraItem[];

/** A free name: `base`, then `base-2`, `base-3`… */
export function freeName(doc: HalftoneSystem, kind: ExtraKind, base: string) {
  const taken = new Set(extrasOf(doc, kind).map((e) => e.name));
  if (!taken.has(base) && !extraNameProblem(kind, base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}

/** Add an extra at the end of its section; returns its token name (its popover opens with the name selected). */
export function addExtra(kind: ExtraKind, item: ExtraItem) {
  edit((doc) => {
    doc.extras = { ...doc.extras, [kind]: [...extrasOf(doc, kind), item] } as HalftoneSystem['extras'];
    return doc;
  });
  return item.name;
}

export function updateExtra(kind: ExtraKind, name: string, change: (item: ExtraItem) => ExtraItem, coalesce?: string) {
  edit((doc) => {
    doc.extras = { ...doc.extras, [kind]: extrasOf(doc, kind).map((e) => (e.name === name ? change({ ...e }) : e)) } as HalftoneSystem['extras'];
    return doc;
  }, coalesce);
}

/** Rename an extra from what was typed ("Trendy green"); returns the problem to show, or null. */
export function renameExtra(doc: HalftoneSystem, kind: ExtraKind, from: string, typed: string) {
  const to = kebab(typed);
  if (to === from) return null;
  const problem = extraNameProblem(kind, to, extrasOf(doc, kind).map((e) => e.name).filter((n) => n !== from));
  if (problem) return problem;
  updateExtra(kind, from, (e) => ({ ...e, name: to }));
  return null;
}

export function deleteExtra(kind: ExtraKind, name: string) {
  edit((doc) => {
    doc.extras = { ...doc.extras, [kind]: extrasOf(doc, kind).filter((e) => e.name !== name) } as HalftoneSystem['extras'];
    return doc;
  });
}
