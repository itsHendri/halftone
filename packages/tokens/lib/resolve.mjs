/**
 * Load tokens.json and resolve it once per mode. Style Dictionary resolves {references}; this file
 * handles the light/dark split (a semantic colour's $value is { light, dark }) and hands every
 * target the same context object.
 */
import StyleDictionary from 'style-dictionary';
import { readFileSync } from 'node:fs';
import { extraList } from './theme/extras.mjs';
import { BUTTON, DEFAULT_RECIPE, DENSITY, DEPTH, FIELD, fieldWidth, resolveTextStyles, shadowCss, textEdits, TYPE, typeScale } from './theme/recipe.mjs';

export const MODES = ['light', 'dark'];

function isModed(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && MODES.every((m) => m in value);
}

/** Return a copy of the token tree with every { light, dark } value collapsed to one mode. */
function forMode(node, mode) {
  if (Array.isArray(node) || node === null || typeof node !== 'object') return node;
  if ('$value' in node) return { ...node, $value: isModed(node.$value) ? node.$value[mode] : node.$value };
  return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, forMode(v, mode)]));
}

async function resolveMode(source, mode) {
  const sd = new StyleDictionary({
    tokens: forMode(source, mode),
    usesDtcg: true,
    log: { verbosity: 'silent' },
    platforms: { kit: { transforms: [] } },
  });
  await sd.hasInitialized;
  const { allTokens } = await sd.getPlatformTokens('kit');
  return allTokens;
}

export const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
export const isColor = (t) => t.$type === 'color';

/** CSS variable name for a semantic token: semantic.color.card-foreground → card-foreground, semantic.radius.base → radius */
export function cssName(token) {
  const parts = token.path.slice(1).filter((p) => p !== 'color');
  if (parts.at(-1) === 'base') parts.pop();
  return parts.join('-');
}

/**
 * Tailwind radius classes as multiples of primitive.radius.lg. With the default base every class equals
 * its primitive (rounded-xl = radius.xl); moving semantic.radius.base scales the whole set, so a base
 * of 0 makes every rounded-* square. A system can set a step outright (semantic.radius.md = 6): that step is
 * `fixed` at its px and no longer follows the base.
 *   → [{ name, scale, px, fixed }]
 */
function radiusScales(prim, sem, base) {
  const steps = prim.filter((t) => t.path[1] === 'radius' && t.path.length === 3 && t.path[2] !== 'full');
  const anchor = steps.find((t) => t.path[2] === 'lg').$value;
  const fixed = Object.fromEntries(sem.filter((t) => t.path[1] === 'radius' && t.path.length === 3).map((t) => [t.path[2], t.$value]));
  return steps.map((t) => {
    const scale = Number((t.$value / anchor).toFixed(4));
    const set = typeof fixed[t.path[2]] === 'number';
    return { name: t.path[2], scale, px: set ? fixed[t.path[2]] : Math.round(base * scale * 10) / 10, fixed: set };
  });
}

export function radiusCalc(scale) {
  return scale === 1 ? 'var(--radius)' : `calc(var(--radius) * ${scale})`;
}

/** A radius step as CSS: a multiple of --radius, or its own px when a system fixed it. */
export function radiusCss(step) {
  return step.fixed ? (step.px >= 9999 ? '9999px' : `${Number((step.px / 16).toFixed(4))}rem`) : radiusCalc(step.scale);
}

/**
 * Everything a target needs:
 *   semLight / semDark   semantic tokens per mode (colours + radius), in tokens.json order
 *   prim                 primitive tokens (mode-independent)
 *   colors               [{ name, light, dark }] semantic colours as hex
 *   radius               { base: px, steps: [{ name, scale, px, fixed }] } (fixed: set by a system, not scaled)
 *   shape                { control: px, borderWidth: px, stroke, shadows: { light: { 1: css }, dark },
 *                          density: { scale, sm, md, lg, x } }
 *                        (a token file from before themes gets the kit's defaults)
 *   type                 { size, scale, leading, leadingFactor, flow, measure } (semantic.type; defaults
 *                          for a token file from before the typeset)
 *   textStyles           { h1: { font, weight, size, leading, tracking, edited }, … } the Text variants at the typeset,
 *                          with a system's edited styles (semantic.type.<style>) on top (recipe.mjs resolveTextStyles)
 *   shape.button/.field  the styles' numbers (semantic.button / .field), radii in px; a token file from
 *                          before the styles gets solid buttons and outline fields, and colours to match
 *   styles               { button, field }: the style names, from the recorded theme (or the defaults)
 *   extras               a system's own tokens (tokens.json `extra.*`) as lists (lib/theme/extras.mjs extraList)
 */
export async function loadTokens(sourcePath) {
  const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
  const [light, dark] = await Promise.all(MODES.map((m) => resolveMode(source, m)));
  const semLight = light.filter((t) => t.path[0] === 'semantic');
  const semDark = dark.filter((t) => t.path[0] === 'semantic');
  const prim = light.filter((t) => t.path[0] === 'primitive');
  const darkHex = Object.fromEntries(semDark.filter(isColor).map((t) => [cssName(t), t.$value.toLowerCase()]));
  const colors = semLight
    .filter(isColor)
    .map((t) => ({ name: cssName(t), light: t.$value.toLowerCase(), dark: darkHex[cssName(t)] }));
  const radiusBase = semLight.find((t) => cssName(t) === 'radius').$value;
  const radius = {
    base: radiusBase,
    steps: radiusScales(prim, semLight, radiusBase),
  };
  const find = (list, name) => list.find((t) => cssName(t) === name)?.$value;
  // Style colours a token file from before the styles doesn't have: what the components drew before.
  const byName = Object.fromEntries(colors.map((c) => [c.name, c]));
  const STYLE_FALLBACK = { button: 'primary', 'button-foreground': 'primary-foreground', 'button-edge': 'primary', field: 'input', 'field-edge': 'input' };
  for (const [name, from] of Object.entries(STYLE_FALLBACK)) if (!byName[name] && byName[from]) colors.push({ ...byName[from], name });
  const shadows = (list, mode) =>
    Object.fromEntries(['1', '2', '3'].map((level) => [level, shadowCss(find(list, `shadow-${level}`) ?? DEPTH.soft[level][mode])]));
  const borderWidth = find(semLight, 'border-width') ?? 1;
  const md = radius.steps.find((s) => s.name === 'md')?.scale ?? 0.8;
  const solid = BUTTON.solid;
  const outline = FIELD.outline;
  const fieldRound = find(semLight, 'field-round') ?? outline.round;
  const fieldRoundBottom = find(semLight, 'field-round-bottom') ?? outline.roundBottom;
  const shape = {
    control: find(semLight, 'radius-control') ?? 9999,
    borderWidth,
    button: {
      alpha: find(semLight, 'button-alpha') ?? solid.alpha,
      border: find(semLight, 'button-border-width') ?? solid.border,
      edge: find(semLight, 'button-edge-width') ?? solid.edge,
    },
    field: {
      alpha: { light: find(semLight, 'field-alpha') ?? outline.alpha.light, dark: find(semDark, 'field-alpha') ?? outline.alpha.dark },
      border: find(semLight, 'field-border-width') ?? fieldWidth(outline.border, borderWidth),
      edge: find(semLight, 'field-edge-width') ?? fieldWidth(outline.edge, borderWidth),
      inset: find(semLight, 'field-inset') ?? outline.inset,
      radius: Number((radius.base * md * fieldRound).toFixed(4)),
      radiusBottom: Number((radius.base * md * fieldRoundBottom).toFixed(4)),
    },
    stroke: find(semLight, 'icon-stroke') ?? 2,
    shadows: { light: shadows(semLight, 'light'), dark: shadows(semDark, 'dark') },
    density: {
      scale: find(semLight, 'density-scale') ?? DENSITY.comfortable.scale,
      ...Object.fromEntries(['sm', 'md', 'lg', 'x'].map((s) => [s, find(semLight, `density-control-${s}`) ?? DENSITY.comfortable[s]])),
    },
  };
  const type = typeScale(Object.fromEntries(Object.entries(TYPE).map(([key, value]) => [key, find(semLight, `type-${key}`) ?? value])));
  const textStyles = resolveTextStyles(type, textEdits(source.semantic?.type));
  const recorded = source.$extensions?.['com.halftonedesignsystem.theme']?.recipe ?? {};
  const styles = { button: recorded.button ?? DEFAULT_RECIPE.button, field: recorded.field ?? DEFAULT_RECIPE.field };
  const extras = extraList(source.extra);
  return { source, semLight, semDark, prim, colors, radius, shape, type, textStyles, styles, extras };
}

/** Primitive tokens under a path prefix, e.g. group(prim, ['font', 'size']) → [{ key: 'xs', value: 12 }, …]. */
export function group(prim, prefix) {
  return prim
    .filter((t) => t.path.slice(1, 1 + prefix.length).join('.') === prefix.join('.'))
    .map((t) => ({ key: t.path.slice(1 + prefix.length).join('-'), value: t.$value, type: t.$type }));
}
