import { clampBezier, parseBezier, type Bezier } from '@/lib/controls/bezier';
import { decimalsOf } from '@/lib/controls/scrub';
import { DEFAULT_SPRING, parseSpring, type Spring } from '@/lib/controls/spring';

export type Option = { value: string; label: string };

type Base = {
  /** The key in its section. */
  key: string;
  /** Dot path from the top: `shadow.blur`. */
  path: string;
  label: string;
  /** One line under the control. */
  hint?: string;
};

export type NumberControl = Base & { kind: 'number'; default: number; min: number; max: number; step: number; unit?: string };
export type ColourControl = Base & { kind: 'colour'; default: string };
export type SwitchControl = Base & { kind: 'switch'; default: boolean };
export type SelectControl = Base & { kind: 'select'; default: string; options: Option[]; display: 'segmented' | 'menu' };
export type EasingControl = Base & { kind: 'easing'; default: Bezier };
export type SpringControl = Base & { kind: 'spring'; default: Spring };
export type Vec2Control = Base & { kind: 'vec2'; default: [number, number]; min: number; max: number; step: number };
export type SectionControl = Base & { kind: 'section'; collapsed: boolean; children: ControlNode[] };

export type LeafControl = NumberControl | ColourControl | SwitchControl | SelectControl | EasingControl | SpringControl | Vec2Control;
export type ControlNode = LeafControl | SectionControl;
export type ControlKind = ControlNode['kind'];

/** The values a panel edits: the config's shape, a value per control. */
export type Values = { [key: string]: unknown };

/** What a config may hold for one control. */
export type ControlInput =
  | number
  | string
  | boolean
  | [number, number, number, number?]
  | { type: 'number'; default: number; min?: number; max?: number; step?: number; unit?: string; label?: string; hint?: string }
  | { type: 'colour' | 'color'; default: string; label?: string; hint?: string }
  | { type: 'switch'; default?: boolean; label?: string; hint?: string }
  | { type: 'select' | 'segmented'; options: (string | Option)[]; default?: string; label?: string; hint?: string }
  | { type: 'easing'; default?: Bezier | string; label?: string; hint?: string }
  | { type: 'spring'; default?: Partial<Spring> | Spring; label?: string; hint?: string }
  | { type: 'vec2'; default?: [number, number]; min?: number; max?: number; step?: number; label?: string; hint?: string }
  | { type: 'section'; controls: ControlConfig; label?: string; collapsed?: boolean; hint?: string }
  | ControlConfig;

/**
 * A control panel described as data, DialKit's way: write the values you want to tune, and the type of each one says
 * which control it gets.
 *
 * ```ts
 * const config = {
 *   radius: [12, 0, 48],               // [default, min, max, step?] → a number field with a track
 *   opacity: 0.8,                      // a bare number → a number field, its range inferred
 *   tint: '#2563eb',                   // a hex string → a colour field
 *   visible: true,                     // a boolean → a switch
 *   align: { type: 'select', options: ['start', 'center', 'end'] },  // 2–3 short options draw as a segmented control
 *   ease: { type: 'easing', default: [0.2, 0, 0, 1] },
 *   spring: { type: 'spring', default: { visualDuration: 0.3, bounce: 0.2 } },
 *   offset: { type: 'vec2', default: [0, 0], min: -1, max: 1 },
 *   shadow: { blur: [8, 0, 40], y: [2, -10, 10] },                   // a plain object → a section of its own
 * };
 * ```
 *
 * `parseControls(config)` turns it into nodes, `defaultValues(nodes)` into the values object (the same shape as the
 * config), and `normalise` checks a value against its node (what pasting settings uses). Headless: no React, no DOM.
 */
export type ControlConfig = { [key: string]: ControlInput };

/** A control written as `{ type: … }`. */
type TypedInput = Extract<ControlInput, { type: string }>;

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** `blurRadius`, `blur_radius`, `blur-radius` → "Blur radius". */
export function labelOf(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** A step that gives about a hundred stops across the range, rounded to 1, 2 or 5 × a power of ten. */
export function inferStep(min: number, max: number, ...values: number[]): number {
  const places = Math.max(0, ...[min, max, ...values].map(decimalsOf));
  const raw = Math.abs(max - min) / 100 || 1;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const nice = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? pow * 10;
  // Never coarser than the values as written: [0.35, 0, 1] needs 0.01, not 0.05.
  return Math.min(nice, places ? 10 ** -places : nice);
}

/** A range for a bare number: 0–1 for a fraction, otherwise out to twice its size (both ways when negative). */
export function inferRange(n: number): { min: number; max: number } {
  if (n >= 0 && n <= 1) return { min: 0, max: 1 };
  const span = Math.max(Math.abs(n) * 2, 10);
  return n < 0 ? { min: -span, max: span } : { min: 0, max: span };
}

const toOption = (o: string | Option): Option => (typeof o === 'string' ? { value: o, label: labelOf(o) } : o);

function leaf(key: string, path: string, input: ControlInput): ControlNode {
  const base = { key, path, label: labelOf(key) };
  if (typeof input === 'number') {
    const { min, max } = inferRange(input);
    return { ...base, kind: 'number', default: input, min, max, step: inferStep(min, max, input) };
  }
  if (typeof input === 'boolean') return { ...base, kind: 'switch', default: input };
  if (typeof input === 'string') {
    if (!HEX.test(input)) throw new Error(`controls: "${path}" is a string but not a hex colour; use { type: 'select', options } for a choice.`);
    return { ...base, kind: 'colour', default: input.toLowerCase() };
  }
  if (Array.isArray(input)) {
    const [def, min, max, step] = input;
    if (![def, min, max].every((n) => typeof n === 'number') || min > max) throw new Error(`controls: "${path}" must be [default, min, max, step?] with min ≤ max.`);
    return { ...base, kind: 'number', default: def, min, max, step: step ?? inferStep(min, max, def) };
  }
  if (input && typeof input === 'object' && 'type' in input && typeof input.type === 'string') {
    const spec = input as TypedInput;
    const b = { ...base, label: spec.label ?? base.label, ...(spec.hint ? { hint: spec.hint } : {}) };
    switch (spec.type) {
      case 'number': {
        const range = spec.min !== undefined && spec.max !== undefined ? { min: spec.min, max: spec.max } : inferRange(spec.default);
        return { ...b, kind: 'number', default: spec.default, ...range, step: spec.step ?? inferStep(range.min, range.max, spec.default), ...(spec.unit ? { unit: spec.unit } : {}) };
      }
      case 'colour':
      case 'color':
        if (!HEX.test(spec.default)) throw new Error(`controls: "${path}" needs a hex default.`);
        return { ...b, kind: 'colour', default: spec.default.toLowerCase() };
      case 'switch':
        return { ...b, kind: 'switch', default: spec.default ?? false };
      case 'select':
      case 'segmented': {
        const options = spec.options.map(toOption);
        if (!options.length) throw new Error(`controls: "${path}" has no options.`);
        const short = options.length <= 3 && options.every((o) => o.label.length <= 10);
        const display = spec.type === 'segmented' || short ? 'segmented' : 'menu';
        return { ...b, kind: 'select', default: spec.default ?? options[0].value, options, display };
      }
      case 'easing': {
        const curve = spec.default === undefined ? ([0.2, 0, 0, 1] as Bezier) : parseBezier(spec.default);
        if (!curve) throw new Error(`controls: "${path}" has an easing default that isn't a cubic-bezier.`);
        return { ...b, kind: 'easing', default: clampBezier(curve) };
      }
      case 'spring':
        return { ...b, kind: 'spring', default: (spec.default && parseSpring(spec.default)) || DEFAULT_SPRING };
      case 'vec2': {
        const min = spec.min ?? -1;
        const max = spec.max ?? 1;
        const def = spec.default ?? [0, 0];
        return { ...b, kind: 'vec2', default: [def[0], def[1]], min, max, step: spec.step ?? inferStep(min, max, ...def) };
      }
      case 'section':
        return { ...b, kind: 'section', collapsed: spec.collapsed ?? false, children: parseControls(spec.controls, path) };
    }
  }
  if (input && typeof input === 'object') return { ...base, kind: 'section', collapsed: false, children: parseControls(input as ControlConfig, path) };
  throw new Error(`controls: "${path}" isn't a control.`);
}

/** The config as nodes, in the config's order. */
export function parseControls(config: ControlConfig, parent = ''): ControlNode[] {
  return Object.entries(config).map(([key, input]) => leaf(key, parent ? `${parent}.${key}` : key, input));
}

/** Every control that holds a value (sections opened up), in order. */
export function leaves(nodes: ControlNode[]): LeafControl[] {
  return nodes.flatMap((n) => (n.kind === 'section' ? leaves(n.children) : [n]));
}

const clone = <T,>(v: T): T => (Array.isArray(v) ? (v.slice() as T) : v && typeof v === 'object' ? { ...v } : v);

/** The values object the config describes, every control at its default. */
export function defaultValues(nodes: ControlNode[]): Values {
  return Object.fromEntries(nodes.map((n) => [n.key, n.kind === 'section' ? defaultValues(n.children) : clone(n.default)]));
}

export function getAt(values: Values, path: string): unknown {
  return path.split('.').reduce<unknown>((v, k) => (v && typeof v === 'object' ? (v as Values)[k] : undefined), values);
}

/** A copy of `values` with `path` set; the objects along the path are copied, nothing else. */
export function setAt(values: Values, path: string, value: unknown): Values {
  const [head, ...rest] = path.split('.');
  if (!rest.length) return { ...values, [head]: value };
  const child = values[head];
  return { ...values, [head]: setAt(child && typeof child === 'object' ? (child as Values) : {}, rest.join('.'), value) };
}

/** Whether a value equals its control's default (what the off-default mark and Reset read). */
export function isDefault(node: LeafControl, value: unknown): boolean {
  return JSON.stringify(value) === JSON.stringify(node.default);
}

/**
 * A value checked against its control: clamped into range and snapped to the step where it can be, or a reason it
 * can't be used. Pasted settings go through this, so a hand-edited JSON never puts a control out of range.
 */
export function normalise(node: LeafControl, raw: unknown): { ok: true; value: unknown } | { ok: false; reason: string } {
  const fail = (reason: string) => ({ ok: false as const, reason });
  switch (node.kind) {
    case 'number': {
      if (typeof raw !== 'number' || !Number.isFinite(raw)) return fail('not a number');
      const clamped = Math.min(node.max, Math.max(node.min, raw));
      return { ok: true, value: Number(clamped.toFixed(Math.min(10, decimalsOf(node.step)))) };
    }
    case 'colour':
      return typeof raw === 'string' && HEX.test(raw.trim()) ? { ok: true, value: raw.trim().toLowerCase() } : fail('not a hex colour');
    case 'switch':
      return typeof raw === 'boolean' ? { ok: true, value: raw } : fail('not true or false');
    case 'select':
      return typeof raw === 'string' && node.options.some((o) => o.value === raw) ? { ok: true, value: raw } : fail(`not one of ${node.options.map((o) => o.value).join(', ')}`);
    case 'easing': {
      const curve = parseBezier(raw);
      return curve ? { ok: true, value: clampBezier(curve) } : fail('not a cubic-bezier');
    }
    case 'spring': {
      const spring = parseSpring(raw);
      return spring ? { ok: true, value: spring } : fail('not a spring');
    }
    case 'vec2': {
      if (!Array.isArray(raw) || raw.length !== 2 || !raw.every((n) => typeof n === 'number' && Number.isFinite(n))) return fail('not [x, y]');
      const fit = (n: number) => Number(Math.min(node.max, Math.max(node.min, n)).toFixed(Math.min(10, decimalsOf(node.step))));
      return { ok: true, value: [fit(raw[0]), fit(raw[1])] };
    }
  }
}
