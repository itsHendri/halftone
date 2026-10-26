/**
 * HalftoneSystem v1: one design system as a JSON document, the Studio's source of truth and what
 * `halftone-tokens theme apply ./name.halftone.json` commits. Pure ESM, no Node APIs.
 *
 * A system is a theme RECIPE (the base every slot is generated from) plus what someone edited by hand on top of
 * it. Every section but `recipe` and `brand` holds overrides only: an empty section means "as generated".
 *
 *   kind, v              'halftone.system', 1
 *   id, name, preset?    preset: the preset it started from (a label; the recipe holds the choices)
 *   updatedAt?           ISO time of the last save (the Studio sets it)
 *   recipe               a Recipe (lib/theme/recipe.mjs)
 *   colors               { brand|neutral|danger|success|warning|info: { seed?, anchor?, steps? } }
 *                          seed     the colour the ramp is generated from. brand: folded into recipe.brand.
 *                                   neutral: a hex for a custom neutral, or a preset name (folded into
 *                                   recipe.neutral). Status: replaces the base file's ramp.
 *                          anchor   the step the seed is pinned to, when not its nearest one
 *                          steps    { '600': '#…' } steps edited by hand (neutral: also '0' and '1000')
 *   roles                { primary: { light?: 'brand.600', dark?: 'brand.400' }, … } a 'ramp.step' or a hex,
 *                        for any semantic colour the kits draw (ROLE_NAMES)
 *   type                 { h1: { font?, weight?, size?, leading?, tracking? }, … } (TEXT_STYLES); font is a role
 *                        (heading, body, mono), size px, leading × size, tracking em
 *   fonts                { heading?, body?, mono? } any Google Fonts family; a curated one folds into the recipe
 *   radius               { sm|md|lg|xl|2xl: px }
 *   shadow               { 1|2|3: { light: Layer[], dark: Layer[] } } (a plain Layer[] is both modes)
 *                          Layer = { x, y, blur, spread, color: '#rrggbb', alpha: 0–1, inset? }
 *   border               { width?: px, style?: 'solid' | 'dashed' | 'dotted' }
 *   extras               { color: [], text: [], radius: [], shadow: [], border: [] } named tokens of your own,
 *                        exported (tokens.json `extra.*`) and never drawn by the kits
 *   brand                { name, iconBackground, logo?, logoDark?, mark?, markDark? } (the Studio's BrandState)
 *   components           { button|chip|badge|input: { style?, radius?, border?, size?, text?, weight?, case?, icon?,
 *                        shadow?, ring?, placeholder?, variants? } } component-level edits (lib/theme/components.mjs),
 *                        overrides only, each where the component has it (COMPONENTS[name].props):
 *                          style     the component's look. Button and Input fold into recipe.button / recipe.field;
 *                                    Chip outline|soft|solid, Badge pill|square|soft
 *                          radius    a Foundations corner (sm…2xl, full) or px
 *                          border    border width, px (Input: its field style's lines)
 *                          size      { sm?, md?, lg?, x?, gap? } heights per step, then the horizontal padding and
 *                                    the icon gap every step shares, px (the keys it has: Badge S/M, Input no gap)
 *                          text      a text style (h1…blockquote): its font, size and tracking
 *                          weight    400 | 500 | 600 | 700 (the label's; Button, Chip, Badge)
 *                          case      'none' | 'uppercase' (Button, Badge)
 *                          icon      icon size, px (Button, Chip, Badge)
 *                          shadow    'none' | '1' | '2' | '3', a Foundations shadow (Button, Input)
 *                          ring      { width?: px, role?: a role } the focus ring (Button, Input)
 *                          placeholder  a role (Input)
 *                          variants  { <variant>: { fill?, label?, border?, pressed? } } roles (ROLE_NAMES), or
 *                                    'none' for a fill or border. Variants are fixed (Input: its states)
 *
 * normalizeSystem(input) validates and returns a clean document (it throws a SystemError naming every problem);
 * validateSystem(input) returns { ok, errors, system } instead.
 */
import { FONTS } from '../theme/fonts.mjs';
import { STEPS } from '../theme/palettes.mjs';
import { anchorStep, neutralAnchorStep } from '../theme/ramp.mjs';
import { CASES, COMPONENT_NAMES, COMPONENTS, CORNERS, SHADOWS, WEIGHTS } from '../theme/components.mjs';
import { normalizeRecipe, OPTIONS, TEXT_DEFAULTS, TEXT_STYLES } from '../theme/recipe.mjs';
import { semanticColors } from '../theme/semantic.mjs';

export const SYSTEM_KIND = 'halftone.system';
export const SYSTEM_VERSION = 1;

export const COLOR_ROLES = ['brand', 'neutral', 'danger', 'success', 'warning', 'info'];
export const STATUS_ROLES = ['danger', 'success', 'warning', 'info'];
/** Every semantic colour a role mapping can set: the theme's map plus the button and field styles' colours. */
export const ROLE_NAMES = [...Object.keys(semanticColors()), 'button', 'button-foreground', 'button-edge', 'field', 'field-edge'];
export const FONT_ROLES = ['heading', 'body', 'mono'];
/** rounded-sm…2xl; rounded-full stays a circle. */
export const RADIUS_STEPS = ['sm', 'md', 'lg', 'xl', '2xl'];
export const SHADOW_LEVELS = ['1', '2', '3'];
export const BORDER_STYLES = ['solid', 'dashed', 'dotted'];
export const EXTRA_KINDS = ['color', 'text', 'radius', 'shadow', 'border'];
export const TEXT_KEYS = ['font', 'weight', 'size', 'leading', 'tracking'];
export { TEXT_DEFAULTS, TEXT_STYLES };


const HEX = /^#[0-9a-f]{6}$/;
const NAME = /^[a-z][a-z0-9-]{0,39}$/;
const FAMILY = /^[A-Za-z0-9][A-Za-z0-9 ]{0,63}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const NEUTRAL_STEPS = ['0', ...STEPS, '1000'];
const BRAND_SLOTS = ['logo', 'logoDark', 'mark', 'markDark'];

export class SystemError extends Error {
  constructor(errors) {
    super(`Invalid Halftone system:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
    this.name = 'SystemError';
    this.errors = errors;
  }
}

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);
const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** A new random id (crypto.randomUUID where there is one: browsers and Node). */
export function newSystemId() {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ?? `sys-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Collects problems as it reads, so one error lists them all. */
function reader() {
  const errors = [];
  const fail = (path, message) => {
    errors.push(`${path}: ${message}`);
    return undefined;
  };
  const hex = (path, v) => {
    const h = typeof v === 'string' ? v.toLowerCase() : v;
    return HEX.test(h) ? h : fail(path, `must be a 6-digit hex colour like #2563eb, got ${JSON.stringify(v)}`);
  };
  const num = (path, v, min, max) =>
    isNumber(v) && v >= min && v <= max ? v : fail(path, `must be a number from ${min} to ${max}, got ${JSON.stringify(v)}`);
  const oneOf = (path, v, list) => (list.includes(v) ? v : fail(path, `must be one of ${list.join(', ')}, got ${JSON.stringify(v)}`));
  const object = (path, v) => (v === undefined ? {} : isObject(v) ? v : (fail(path, 'must be an object'), {}));
  const keys = (path, v, list) => {
    for (const key of Object.keys(v)) if (!list.includes(key)) fail(path ? `${path}.${key}` : key, `is not one of ${list.join(', ')}`);
    return Object.entries(v).filter(([key]) => list.includes(key));
  };
  return { errors, fail, hex, num, oneOf, object, keys };
}

/** A role's colour: 'ramp.step' (any colour role's ramp) or a hex. */
function roleValue(r, path, v) {
  if (typeof v !== 'string') return r.fail(path, `must be a 'ramp.step' like "brand.600", or a hex colour`);
  if (v.startsWith('#')) return r.hex(path, v);
  const [ramp, step, ...rest] = v.split('.');
  if (rest.length || !COLOR_ROLES.includes(ramp)) return r.fail(path, `must be a 'ramp.step' with a ramp of ${COLOR_ROLES.join(', ')}, got ${JSON.stringify(v)}`);
  if (!(ramp === 'neutral' ? NEUTRAL_STEPS : STEPS).includes(step)) return r.fail(path, `"${ramp}" has no step ${JSON.stringify(step)}`);
  return `${ramp}.${step}`;
}

/** A partial text style. `all` fills every key from `fallback`. */
function textStyle(r, path, v, fallback) {
  const out = {};
  for (const [key, value] of r.keys(path, r.object(path, v), TEXT_KEYS)) {
    const at = `${path}.${key}`;
    if (key === 'font') out.font = r.oneOf(at, value, FONT_ROLES);
    if (key === 'weight') out.weight = isNumber(value) && value % 100 === 0 && value >= 100 && value <= 900 ? value : r.fail(at, `must be 100, 200, … 900, got ${JSON.stringify(value)}`);
    if (key === 'size') out.size = r.num(at, value, 4, 400);
    if (key === 'leading') out.leading = r.num(at, value, 0.5, 4);
    if (key === 'tracking') out.tracking = r.num(at, value, -0.5, 1);
  }
  for (const key of Object.keys(out)) if (out[key] === undefined) delete out[key];
  return fallback ? { ...fallback, ...out } : out;
}

const layer = (r, path, v) => {
  const l = r.object(path, v);
  r.keys(path, l, ['x', 'y', 'blur', 'spread', 'color', 'alpha', 'inset']);
  const out = {
    x: r.num(`${path}.x`, l.x ?? 0, -200, 200),
    y: r.num(`${path}.y`, l.y ?? 0, -200, 200),
    blur: r.num(`${path}.blur`, l.blur ?? 0, 0, 400),
    spread: r.num(`${path}.spread`, l.spread ?? 0, -200, 200),
    color: r.hex(`${path}.color`, l.color ?? '#000000'),
    alpha: r.num(`${path}.alpha`, l.alpha ?? 1, 0, 1),
  };
  if (l.inset !== undefined && l.inset !== false) out.inset = l.inset === true ? true : r.fail(`${path}.inset`, 'must be true or false');
  return out;
};

/** A shadow: a list of layers (both modes) or { light, dark }. Always { light, dark } out. */
function shadow(r, path, v) {
  const list = (p, x) => (Array.isArray(x) ? x.map((l, i) => layer(r, `${p}[${i}]`, l)) : (r.fail(p, 'must be a list of layers'), []));
  if (Array.isArray(v)) {
    const layers = list(path, v);
    return { light: layers, dark: layers.map((l) => ({ ...l })) };
  }
  const o = r.object(path, v);
  r.keys(path, o, ['light', 'dark']);
  return { light: list(`${path}.light`, o.light ?? []), dark: list(`${path}.dark`, o.dark ?? o.light ?? []) };
}

function border(r, path, v, required = false) {
  const out = {};
  for (const [key, value] of r.keys(path, r.object(path, v), required ? ['name', 'width', 'style'] : ['width', 'style'])) {
    if (key === 'width') out.width = r.num(`${path}.width`, value, 0, 16);
    if (key === 'style') out.style = r.oneOf(`${path}.style`, value, BORDER_STYLES);
  }
  if (required && out.width === undefined) r.fail(`${path}.width`, 'is required');
  return out;
}

function brandImage(r, path, v) {
  if (!isObject(v)) return r.fail(path, 'must be an image ({ svg | png, aspect })');
  const out = {};
  if (v.svg !== undefined) out.svg = typeof v.svg === 'string' ? v.svg : r.fail(`${path}.svg`, 'must be SVG text');
  if (v.png !== undefined) out.png = typeof v.png === 'string' && v.png.startsWith('data:image/') ? v.png : r.fail(`${path}.png`, 'must be a data: URL');
  if (out.svg === undefined && out.png === undefined) r.fail(path, 'needs an svg or a png');
  if (v.mono !== undefined) out.mono = Boolean(v.mono);
  out.aspect = r.num(`${path}.aspect`, v.aspect, 0.01, 100);
  return out;
}

/** The step a seed sits on by itself (what `anchor` is compared against). */
const naturalAnchor = (role, seed) => (role === 'neutral' ? neutralAnchorStep(seed) : anchorStep(seed));

function colors(r, input, recipe) {
  const out = {};
  for (const [role, value] of r.keys('colors', r.object('colors', input), COLOR_ROLES)) {
    const path = `colors.${role}`;
    const v = r.object(path, value);
    r.keys(path, v, ['seed', 'anchor', 'steps']);
    const entry = {};
    if (v.seed !== undefined) {
      if (role === 'neutral' && OPTIONS.neutral.includes(v.seed)) recipe.neutral = v.seed;
      else {
        const seed = r.hex(`${path}.seed`, v.seed);
        if (role === 'brand' && seed) recipe.brand = seed;
        else if (seed) entry.seed = seed;
      }
    }
    const seed = role === 'brand' ? recipe.brand : entry.seed;
    if (v.anchor !== undefined) {
      const anchor = r.oneOf(`${path}.anchor`, String(v.anchor), STEPS);
      if (anchor && !seed) r.fail(`${path}.anchor`, 'pins a seed to a step, so it needs a seed');
      // The seed's own step is no override.
      else if (anchor && anchor !== naturalAnchor(role, seed)) entry.anchor = anchor;
    }
    if (v.steps !== undefined) {
      const steps = {};
      for (const [step, hex] of r.keys(`${path}.steps`, r.object(`${path}.steps`, v.steps), role === 'neutral' ? NEUTRAL_STEPS : STEPS)) {
        const h = r.hex(`${path}.steps.${step}`, hex);
        if (h) steps[step] = h;
      }
      if (Object.keys(steps).length) entry.steps = Object.fromEntries((role === 'neutral' ? NEUTRAL_STEPS : STEPS).filter((s) => s in steps).map((s) => [s, steps[s]]));
    }
    if (Object.keys(entry).length) out[role] = entry;
  }
  return out;
}

function fonts(r, input, recipe) {
  const out = {};
  for (const [role, family] of r.keys('fonts', r.object('fonts', input), FONT_ROLES)) {
    if (typeof family !== 'string' || !FAMILY.test(family.trim())) {
      r.fail(`fonts.${role}`, `must be a Google Fonts family name, got ${JSON.stringify(family)}`);
      continue;
    }
    const name = family.trim().replace(/\s+/g, ' ');
    // A curated family the role may use is the recipe's own choice (it keeps a code).
    const curated = FONTS.find((f) => f.family.toLowerCase() === name.toLowerCase() && (role === 'mono' ? f.category === 'mono' : !(f.system && f.category === 'mono')));
    if (curated) recipe.font = { ...recipe.font, [role]: curated.id };
    else out[role] = name;
  }
  return out;
}

/** Tailwind's palette families and keywords: a colour extra by one of these names would shadow Tailwind's own. */
const PALETTE = ['slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose', 'mauve', 'olive', 'mist', 'taupe', 'white', 'black', 'transparent', 'current', 'inherit'];
/** A colour extra is a variable (--<name>): never one of the theme's own (--radius, --type-*, --shadow-*…). */
const VARIABLE_CLASH = /^(radius|density|spacing|border-width|icon-stroke|chip|badge)$|^(radius|control|type|leading|typeset|shadow|button|field|chip|badge|font|kit|tw)-/;
/** Names an extra can't take, per kind: the built-in slots, and the Tailwind classes its class would shadow. */
const RESERVED = {
  color: [...COLOR_ROLES, ...ROLE_NAMES, ...PALETTE],
  // A text extra is type-<name>: the components' text utilities are type-button, type-chip, type-badge, type-field.
  text: [...TEXT_STYLES, 'button', 'chip', 'badge', 'field'],
  radius: [...RADIUS_STEPS, 'full', 'base', 'control', 'none', 'xs', '3xl', '4xl'],
  shadow: [...SHADOW_LEVELS, '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 'none', 'inner'],
  border: ['width', 'style', 'x', 'y', 't', 'r', 'b', 'l', 's', 'e', 'solid', 'dashed', 'dotted', 'double', 'hidden', 'none', 'collapse', 'separate', 'spacing'],
};

/** Why an extra can't have this name, or null: what the Studio says inline, and what normalizeSystem refuses. */
export function extraNameProblem(kind, name, taken = []) {
  if (typeof name !== 'string' || !NAME.test(name)) return 'Use letters, numbers and dashes, starting with a letter (40 at most).';
  const what = { color: 'colour', text: 'text style', radius: 'corner', shadow: 'shadow', border: 'border' }[kind] ?? kind;
  if (RESERVED[kind]?.includes(name)) return PALETTE.includes(name) && kind === 'color' ? `"${name}" is a Tailwind colour; give it a name of its own.` : `"${name}" is a built-in ${what} slot or class; give the extra its own name.`;
  if (kind === 'color' && VARIABLE_CLASH.test(name)) return `"${name}" would clash with the theme's own variables; give it another name.`;
  if (taken.includes(name)) return `"${name}" is already an extra.`;
  return null;
}

function extras(r, input) {
  const out = Object.fromEntries(EXTRA_KINDS.map((kind) => [kind, []]));
  for (const [kind, list] of r.keys('extras', r.object('extras', input), EXTRA_KINDS)) {
    if (!Array.isArray(list)) {
      r.fail(`extras.${kind}`, 'must be a list');
      continue;
    }
    const seen = new Set();
    list.forEach((item, i) => {
      const path = `extras.${kind}[${i}]`;
      if (!isObject(item)) return r.fail(path, 'must be an object');
      const name = typeof item.name === 'string' && NAME.test(item.name) ? item.name : r.fail(`${path}.name`, `must be kebab-case (a-z, 0-9, -), got ${JSON.stringify(item.name)}`);
      if (name && seen.has(name)) r.fail(`${path}.name`, `"${name}" is used twice`);
      const problem = name && extraNameProblem(kind, name);
      if (problem) r.fail(`${path}.name`, problem.replace(/\.$/, ''));
      if (name) seen.add(name);
      let value;
      if (kind === 'color') {
        r.keys(path, item, ['name', 'value', 'seed', 'anchor', 'steps']);
        if (item.value !== undefined && item.seed !== undefined) r.fail(path, 'is a single colour (value) or a ramp (seed), not both');
        if (item.seed !== undefined) {
          value = { seed: r.hex(`${path}.seed`, item.seed) };
          if (item.anchor !== undefined) value.anchor = r.oneOf(`${path}.anchor`, String(item.anchor), STEPS);
          if (value.anchor && value.seed && value.anchor === anchorStep(value.seed)) delete value.anchor;
          if (item.steps !== undefined) {
            const steps = Object.fromEntries(r.keys(`${path}.steps`, r.object(`${path}.steps`, item.steps), STEPS).map(([s, h]) => [s, r.hex(`${path}.steps.${s}`, h)]));
            if (Object.keys(steps).length) value.steps = steps;
          }
        } else if (isObject(item.value)) {
          r.keys(`${path}.value`, item.value, ['light', 'dark']);
          value = { value: { light: r.hex(`${path}.value.light`, item.value.light), dark: r.hex(`${path}.value.dark`, item.value.dark) } };
        } else value = { value: r.hex(`${path}.value`, item.value) };
      }
      if (kind === 'text') {
        const { name: _, ...style } = item;
        value = textStyle(r, path, style, TEXT_DEFAULTS.p);
        if (value.leading === 'prose') value.leading = 1.75;
      }
      if (kind === 'radius') {
        r.keys(path, item, ['name', 'value']);
        value = { value: r.num(`${path}.value`, item.value, 0, 9999) };
      }
      if (kind === 'shadow') {
        r.keys(path, item, ['name', 'layers', 'light', 'dark']);
        value = shadow(r, path, item.layers ?? { light: item.light, dark: item.dark });
      }
      if (kind === 'border') value = border(r, path, item, true);
      out[kind].push({ name, ...value });
    });
  }
  return out;
}

function brand(r, input) {
  const v = r.object('brand', input);
  r.keys('brand', v, ['name', 'iconBackground', ...BRAND_SLOTS]);
  const out = {
    name: typeof v.name === 'string' ? v.name.slice(0, 80) : v.name === undefined ? '' : r.fail('brand.name', 'must be text'),
    iconBackground:
      v.iconBackground === undefined || ['brand', 'white', 'black'].includes(v.iconBackground)
        ? (v.iconBackground ?? 'brand')
        : r.hex('brand.iconBackground', v.iconBackground),
  };
  for (const slot of BRAND_SLOTS) if (v[slot] !== undefined && v[slot] !== null) out[slot] = brandImage(r, `brand.${slot}`, v[slot]);
  // Without a logo there's nothing to have a dark version of (as the Studio's brand store does).
  if (!out.logo) delete out.logoDark;
  if (!out.mark) delete out.markDark;
  return out;
}

/** A role a component colour can take: any semantic colour, or 'none' (no fill, no border). */
const SLOT_VALUES = { fill: [...ROLE_NAMES, 'none'], label: ROLE_NAMES, border: [...ROLE_NAMES, 'none'], pressed: ROLE_NAMES };

/** components: the edits, checked against each component's styles, sizes and variants. Button and Input styles fold. */
function components(r, input, recipe) {
  const out = {};
  for (const [name, value] of r.keys('components', r.object('components', input), COMPONENT_NAMES)) {
    const path = `components.${name}`;
    const def = COMPONENTS[name];
    const v = r.object(path, value);
    r.keys(path, v, ['style', 'radius', 'size', 'text', 'variants', ...def.props]);
    const entry = {};
    if (v.style !== undefined) {
      const style = r.oneOf(`${path}.style`, v.style, def.styles);
      // Button and Input styles are the recipe's (they keep a theme code); a Chip or Badge style is an override.
      if (style && name === 'button') recipe.button = style;
      else if (style && name === 'input') recipe.field = style;
      else if (style && style !== def.styles[0]) entry.style = style;
    }
    if (v.radius !== undefined) entry.radius = typeof v.radius === 'number' ? r.num(`${path}.radius`, v.radius, 0, 9999) : r.oneOf(`${path}.radius`, v.radius, CORNERS);
    if (v.size !== undefined) {
      const size = {};
      for (const [key, px] of r.keys(`${path}.size`, r.object(`${path}.size`, v.size), def.sizes)) {
        size[key] = key === 'x' ? r.num(`${path}.size.x`, px, 0, 64) : key === 'gap' ? r.num(`${path}.size.gap`, px, 0, 24) : r.num(`${path}.size.${key}`, px, 12, 120);
      }
      if (Object.keys(size).length) entry.size = size;
    }
    if (v.text !== undefined) entry.text = r.oneOf(`${path}.text`, v.text, TEXT_STYLES);
    if (v.border !== undefined) entry.border = r.num(`${path}.border`, v.border, 0, 8);
    if (v.weight !== undefined) entry.weight = r.oneOf(`${path}.weight`, v.weight, WEIGHTS);
    if (v.case !== undefined) entry.case = r.oneOf(`${path}.case`, v.case, CASES);
    if (v.icon !== undefined) entry.icon = r.num(`${path}.icon`, v.icon, 8, 40);
    if (v.shadow !== undefined) entry.shadow = r.oneOf(`${path}.shadow`, String(v.shadow), SHADOWS);
    if (v.placeholder !== undefined) entry.placeholder = r.oneOf(`${path}.placeholder`, v.placeholder, ROLE_NAMES);
    if (v.ring !== undefined) {
      const ring = {};
      const at = `${path}.ring`;
      const value = r.object(at, v.ring);
      r.keys(at, value, ['width', 'role']);
      if (value.width !== undefined) ring.width = r.num(`${at}.width`, value.width, 0, 8);
      if (value.role !== undefined) ring.role = r.oneOf(`${at}.role`, value.role, ROLE_NAMES);
      for (const key of Object.keys(ring)) if (ring[key] === undefined) delete ring[key];
      if (Object.keys(ring).length) entry.ring = ring;
    }
    if (v.variants !== undefined) {
      const variants = {};
      for (const [variant, slots] of r.keys(`${path}.variants`, r.object(`${path}.variants`, v.variants), Object.keys(def.variants))) {
        const at = `${path}.variants.${variant}`;
        const edits = {};
        for (const [slot, role] of r.keys(at, r.object(at, slots), def.variants[variant])) edits[slot] = r.oneOf(`${at}.${slot}`, role, SLOT_VALUES[slot]);
        if (Object.keys(edits).length) variants[variant] = edits;
      }
      if (Object.keys(variants).length) entry.variants = variants;
    }
    for (const key of Object.keys(entry)) if (entry[key] === undefined) delete entry[key];
    if (Object.keys(entry).length) out[name] = entry;
  }
  return out;
}

/** Is this a system document (rather than a bare recipe)? */
export const isSystem = (value) => isObject(value) && (value.kind === SYSTEM_KIND || isObject(value.recipe));

function read(input) {
  const r = reader();
  if (!isObject(input)) throw new SystemError(['the document must be a JSON object']);
  if (input.kind !== undefined && input.kind !== SYSTEM_KIND) r.fail('kind', `must be "${SYSTEM_KIND}"`);
  if (input.v !== undefined && !(Number.isInteger(input.v) && input.v >= 1)) r.fail('v', 'must be a version number');
  if (input.v > SYSTEM_VERSION) throw new SystemError([`v: this system is version ${input.v}, from a newer @halftone-ds/tokens; update it to read the system`]);
  r.keys('', input, ['$schema', 'kind', 'v', 'id', 'name', 'preset', 'updatedAt', 'recipe', 'colors', 'roles', 'type', 'fonts', 'radius', 'shadow', 'border', 'extras', 'brand', 'components']);

  let recipe;
  try {
    recipe = normalizeRecipe(r.object('recipe', input.recipe));
  } catch (error) {
    r.fail('recipe', error.message);
    recipe = normalizeRecipe({});
  }
  delete recipe.preset;
  if (isObject(input.recipe) && input.recipe.preset) recipe.preset = String(input.recipe.preset);

  const name = typeof input.name === 'string' && input.name.trim() ? input.name.trim().slice(0, 80) : 'Untitled system';
  const doc = {
    kind: SYSTEM_KIND,
    v: SYSTEM_VERSION,
    id: typeof input.id === 'string' && input.id.trim() ? input.id.trim().slice(0, 128) : slug(name) || 'system',
    name,
  };
  if (input.preset !== undefined) doc.preset = String(input.preset);
  if (input.updatedAt !== undefined) {
    if (typeof input.updatedAt === 'string' && ISO.test(input.updatedAt)) doc.updatedAt = input.updatedAt;
    else r.fail('updatedAt', 'must be an ISO date-time');
  }
  // Colours and fonts may fold into the recipe (a brand seed, a curated font), so they come first.
  const colorsOut = colors(r, input.colors, recipe);
  const fontsOut = fonts(r, input.fonts, recipe);
  try {
    // Folding must leave a valid recipe (a curated mono family as the heading font, say).
    Object.assign(recipe, normalizeRecipe(recipe));
  } catch (error) {
    r.fail('fonts', error.message);
  }
  doc.recipe = recipe;
  doc.colors = colorsOut;

  doc.roles = {};
  for (const [role, value] of r.keys('roles', r.object('roles', input.roles), ROLE_NAMES)) {
    const v = r.object(`roles.${role}`, value);
    r.keys(`roles.${role}`, v, ['light', 'dark']);
    const entry = {};
    for (const mode of ['light', 'dark']) if (v[mode] !== undefined) entry[mode] = roleValue(r, `roles.${role}.${mode}`, v[mode]);
    if (Object.keys(entry).length) doc.roles[role] = entry;
  }

  doc.type = {};
  for (const [variant, value] of r.keys('type', r.object('type', input.type), TEXT_STYLES)) {
    const style = textStyle(r, `type.${variant}`, value);
    if (Object.keys(style).length) doc.type[variant] = style;
  }

  doc.fonts = fontsOut;

  doc.radius = {};
  for (const [step, value] of r.keys('radius', r.object('radius', input.radius), RADIUS_STEPS)) doc.radius[step] = r.num(`radius.${step}`, value, 0, 9999);

  doc.shadow = {};
  for (const [level, value] of r.keys('shadow', r.object('shadow', input.shadow), SHADOW_LEVELS)) doc.shadow[level] = shadow(r, `shadow.${level}`, value);

  doc.border = border(r, 'border', input.border);
  doc.extras = extras(r, input.extras);
  doc.brand = brand(r, input.brand);

  doc.components = components(r, input.components, recipe);
  return { doc, errors: r.errors };
}

/** A clean, valid document from `input`; throws a SystemError listing every problem. */
export function normalizeSystem(input) {
  const { doc, errors } = read(input);
  if (errors.length) throw new SystemError(errors);
  return doc;
}

/** { ok, errors, system }: normalizeSystem without the throw (system is null when there are errors). */
export function validateSystem(input) {
  try {
    const { doc, errors } = read(input);
    return { ok: !errors.length, errors, system: errors.length ? null : doc };
  } catch (error) {
    if (error instanceof SystemError) return { ok: false, errors: error.errors, system: null };
    throw error;
  }
}

/** A new system: the defaults, with `input` on top, a fresh id and the time. */
export function createSystem(input = {}) {
  return normalizeSystem({ ...input, id: input.id ?? newSystemId(), updatedAt: input.updatedAt ?? new Date().toISOString() });
}

/**
 * Everything a system sets beyond its recipe, as paths ('colors.danger.seed', 'roles.primary.dark',
 * 'extras.color.sunset'): what the Studio marks as edited and what a theme code can't carry. The brand is
 * never in a code, so it isn't listed.
 */
export function systemOverrides(input) {
  const doc = normalizeSystem(input);
  const paths = [];
  for (const [role, entry] of Object.entries(doc.colors)) {
    if (entry.seed) paths.push(`colors.${role}.seed`);
    if (entry.anchor) paths.push(`colors.${role}.anchor`);
    for (const step of Object.keys(entry.steps ?? {})) paths.push(`colors.${role}.steps.${step}`);
  }
  for (const [role, entry] of Object.entries(doc.roles)) for (const mode of Object.keys(entry)) paths.push(`roles.${role}.${mode}`);
  for (const [variant, style] of Object.entries(doc.type)) for (const key of Object.keys(style)) paths.push(`type.${variant}.${key}`);
  for (const section of ['fonts', 'radius', 'shadow', 'border']) for (const key of Object.keys(doc[section])) paths.push(`${section}.${key}`);
  for (const kind of EXTRA_KINDS) for (const item of doc.extras[kind]) paths.push(`extras.${kind}.${item.name}`);
  for (const [name, entry] of Object.entries(doc.components)) {
    for (const key of ['style', 'radius', 'text', 'border', 'weight', 'case', 'icon', 'shadow', 'placeholder']) if (entry[key] !== undefined) paths.push(`components.${name}.${key}`);
    for (const key of Object.keys(entry.ring ?? {})) paths.push(`components.${name}.ring.${key}`);
    for (const key of Object.keys(entry.size ?? {})) paths.push(`components.${name}.size.${key}`);
    for (const [variant, slots] of Object.entries(entry.variants ?? {})) for (const slot of Object.keys(slots)) paths.push(`components.${name}.variants.${variant}.${slot}`);
  }
  return paths;
}

export const hasOverrides = (input) => systemOverrides(input).length > 0;

/** The document without its brand images (what tokens.json records, and what a link may carry). */
export function withoutBrandImages(doc) {
  const { logo, logoDark, mark, markDark, ...brand } = doc.brand;
  return { ...doc, brand };
}
