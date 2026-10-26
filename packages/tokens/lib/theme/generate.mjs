/**
 * generateTheme — a recipe expanded into a theme. Pure ESM, no Node APIs: the docs site runs it in
 * the browser for the live picker, the CLI runs it to commit a theme into tokens.json.
 *
 *   generateTheme(recipe, base)  base = the app's tokens.json (status ramps, radius steps come from it)
 *     → { recipe, code, primitives, semantic, resolved, radius, type, adjustments, warnings }
 *
 * A recipe doesn't theme the status colours (success, warning, danger, info): they come from `base`. A system
 * document does (lib/system/generate.mjs), through `colors`, the hook below that only generateSystem uses:
 *   colors.ramps     { brand?, neutral?, danger?, … }: finished ramps in place of the recipe's (or base's)
 *   colors.anchor    the brand seed's step; colors.anchors the status seeds' steps
 *   colors.roles     { name: { light?, dark? } } references or hex chosen by hand: never moved by the fixer
 *   colors.edited    { ramp: [steps] } edited by hand: a role on one keeps its colour (a warning if it fails)
 * Without it, the theme is exactly the recipe's.
 */
import { fixContrast } from './fix.mjs';
import { encodeRecipe } from './codec.mjs';
import { fontById } from './fonts.mjs';
import { componentLayer } from './components.mjs';
import { BORDER, BUTTON, DENSITY, DEPTH, FIELD, fieldWidth, FLOW, LEADING, normalizeRecipe, RADIUS, resolveTextStyles, STROKE, textEdits, typeScale } from './recipe.mjs';
import { anchorStep, brandRamp, neutralRamp } from './ramp.mjs';
import { resolvedMap } from './refs.mjs';
import { BRAND_LINKED, semanticColors, styleColors } from './semantic.mjs';


const ramp = (values) => Object.fromEntries(Object.entries(values).map(([step, $value]) => [step, { $type: 'color', $value }]));
const STATUS = ['danger', 'success', 'warning', 'info'];
const modes = () => ({ light: new Set(), dark: new Set() });

/** Role overrides on top of a semantic map; the tokens that share primary's step follow a primary override. */
function withRoles(colors, roles, linked = false) {
  if (!roles) return colors;
  const out = Object.fromEntries(Object.entries(colors).map(([k, v]) => [k, { ...v }]));
  for (const mode of ['light', 'dark']) {
    const primary = roles.primary?.[mode];
    if (linked && primary !== undefined) for (const name of BRAND_LINKED) if (!roles[name]?.[mode] && out[name]?.[mode] === colors.primary[mode]) out[name][mode] = primary;
    for (const [name, value] of Object.entries(roles)) if (name in out && value[mode] !== undefined) out[name][mode] = value[mode];
  }
  return out;
}

/**
 * Which colours the fixer leaves alone, per mode: `locked` = mapped by hand (and what follows a hand-mapped
 * primary), `pinned` = on an edited step. `from` locks a style colour that is a locked base colour (a solid
 * button is the primary).
 */
function locks(colors, { roles = {}, edited = {} }, from) {
  const locked = modes();
  const pinned = modes();
  const editedRef = new Set(Object.entries(edited).flatMap(([name, steps]) => steps.map((step) => `{primitive.color.${name}.${step}}`)));
  for (const mode of ['light', 'dark']) {
    for (const [name, value] of Object.entries(colors)) {
      if (roles[name]?.[mode] !== undefined) locked[mode].add(name);
      else if (roles.primary?.[mode] !== undefined && BRAND_LINKED.includes(name) && value[mode] === roles.primary[mode]) locked[mode].add(name);
      else if (from && !(name in from.colors) && Object.entries(from.colors).some(([base, v]) => from.locked[mode].has(base) && v[mode] === value[mode])) locked[mode].add(name);
      else if (editedRef.has(value[mode])) pinned[mode].add(name);
    }
  }
  return { locked, pinned };
}

/** The theme for a recipe, on top of `base` (a tokens.json object). `fix: false` skips the contrast fixer. */
export function generateTheme(input, base, { fix = true, colors: system } = {}) {
  const recipe = normalizeRecipe(input);
  const brand = system?.ramps?.brand ?? brandRamp(recipe.brand);
  const neutral = system?.ramps?.neutral ?? neutralRamp(recipe.neutral, recipe.brand);
  const status = Object.fromEntries(STATUS.filter((name) => system?.ramps?.[name]).map((name) => [name, system.ramps[name]]));
  const statusTokens = Object.fromEntries(Object.entries(status).map(([name, values]) => [name, ramp(values)]));

  // Primitive lookup: the base primitives with this theme's ramps swapped in.
  const primitive = { ...base.primitive, color: { ...base.primitive.color, brand: ramp(brand), neutral: ramp(neutral), ...statusTokens } };
  const prim = resolvedMap({ primitive }, 'light');
  const lookup = (value) => {
    if (typeof value !== 'string' || !value.startsWith('{')) return value;
    const hex = prim[value.slice(1, -1)];
    if (hex === undefined) throw new Error(`generateTheme: ${value} is not in the base tokens`);
    return hex;
  };

  const anchor = system?.anchor ?? anchorStep(recipe.brand);
  let colors = withRoles(semanticColors(anchor, system?.anchors), system?.roles, true);
  const baseLocks = locks(colors, system ?? {});
  let adjustments = [];
  let warnings = [];
  if (fix) ({ semantic: colors, adjustments, warnings } = fixContrast(colors, lookup, baseLocks));
  // The styles' colours build on the fixed ones, then get their own check (a soft button's ink, a field's line).
  const fixed = colors;
  colors = { ...colors, ...withRoles(styleColors(recipe, anchor, colors), system?.roles) };
  if (fix) {
    const styled = fixContrast(colors, lookup, locks(colors, system ?? {}, { colors: fixed, locked: baseLocks.locked }));
    colors = styled.semantic;
    adjustments = [...adjustments, ...styled.adjustments];
    // The second pass sees every pairing again: keep each warning once.
    warnings = styled.warnings;
  }

  const radiusRef = RADIUS[recipe.radius];
  const radiusValue = typeof radiusRef === 'string' ? `{primitive.radius.${radiusRef}}` : radiusRef;
  const resolved = Object.fromEntries(
    ['light', 'dark'].map((mode) => [mode, Object.fromEntries(Object.entries(colors).map(([name, v]) => [name, lookup(v[mode])]))])
  );

  const radius = lookup(radiusValue);
  const controlRadius = recipe.controls === 'pill' ? 9999 : radiusValue;
  // Heading and body: '' is the platform font. Mono: system-mono is Menlo, what tokens.json always had.
  const font = (id) => (id === 'system' ? '' : fontById(id).family);
  const density = DENSITY[recipe.density];
  const size = Number(recipe.size);
  const type = {
    size,
    leading: LEADING[recipe.leading],
    flow: FLOW[recipe.flow],
    measure: Number(recipe.measure),
  };

  const borderWidth = BORDER[recipe.border];
  const btn = BUTTON[recipe.button];
  const fld = FIELD[recipe.field];
  const button = { alpha: btn.alpha, border: btn.border, edge: btn.edge };
  const field = { alpha: fld.alpha, border: fieldWidth(fld.border, borderWidth), edge: fieldWidth(fld.edge, borderWidth), inset: fld.inset };
  // rounded-md is the radius × md / lg (resolve.mjs); a field's radius is that or square.
  const md = lookup('{primitive.radius.md}') / lookup('{primitive.radius.lg}');

  const theme = {
    recipe,
    code: encodeRecipe(recipe),
    primitives: { brand, neutral, ...status },
    fonts: { heading: font(recipe.font.heading), body: font(recipe.font.body), mono: font(recipe.font.mono) },
    semantic: {
      color: colors,
      radius: { base: radiusValue, control: controlRadius },
      border: { width: BORDER[recipe.border] },
      icon: { stroke: STROKE[recipe.stroke] },
      shadow: DEPTH[recipe.depth],
      density: { scale: density.scale, control: { sm: density.sm, md: density.md, lg: density.lg, x: density.x } },
      type,
    },
    density,
    type: typeScale(type),
    resolved,
    radius,
    radiusControl: lookup(controlRadius),
    borderWidth,
    button,
    field: { ...field, radius: lookup(radiusValue) * md * fld.round, radiusBottom: lookup(radiusValue) * md * fld.roundBottom },
    stroke: STROKE[recipe.stroke],
    adjustments,
    warnings,
  };
  return withComponents(theme, base);
}

/** Every ramp (a group of numbered steps) as { ramp: { step: hex } }; `value(path)` resolves a primitive. */
export const rampsOf = (colors, value) =>
  Object.fromEntries(
    Object.entries(colors)
      .filter(([, steps]) => steps && typeof steps === 'object' && Object.keys(steps).some((k) => /^\d+$/.test(k)))
      .map(([name, steps]) => [name, Object.fromEntries(Object.keys(steps).filter((k) => /^\d+$/.test(k)).map((k) => [k, value(`primitive.color.${name}.${k}`)]))])
  );

/**
 * The theme with its component layer (lib/theme/components.mjs): semantic.component (the tokens) and `components`
 * (resolved). Built from the theme's own corners, density, border, styles, text styles and colours, so
 * generateSystem calls it again once a system's edits are in, with the system's `components` as `overrides`.
 */
export function withComponents(theme, base, overrides = {}) {
  const primitive = { ...base.primitive, color: { ...base.primitive.color, ...Object.fromEntries(Object.entries(theme.primitives).map(([name, values]) => [name, ramp(values)])) } };
  const prim = resolvedMap({ primitive }, 'light');
  const lg = prim['primitive.radius.lg'];
  const edited = theme.semantic.radius;
  const fld = FIELD[theme.recipe.field];
  const { tokens, shape } = componentLayer({
    styles: { button: theme.recipe.button, field: theme.recipe.field },
    controls: theme.recipe.controls,
    corner: (name) => (typeof edited[name] === 'number' ? edited[name] : (theme.radius * prim[`primitive.radius.${name}`]) / lg),
    density: theme.density,
    borderWidth: theme.borderWidth,
    button: theme.button,
    field: { ...theme.field, round: fld.round, roundBottom: fld.roundBottom },
    textStyles: resolveTextStyles(theme.type, textEdits(theme.semantic.type)),
    type: theme.type,
    hex: (ref, mode) => {
      const name = /^\{semantic\.color\.(.+)\}$/.exec(ref)?.[1];
      if (name) return theme.resolved[mode][name];
      const value = prim[ref.slice(1, -1)];
      if (value === undefined) throw new Error(`generateTheme: ${ref} is not in the base tokens`);
      return value;
    },
    ramps: rampsOf(primitive.color, (path) => prim[path]),
    overrides,
  });
  // An Input border width set on the system is the field's (--field-border-w, --field-edge-w).
  return { ...theme, field: { ...theme.field, border: shape.input.borderWidth, edge: shape.input.edgeWidth }, semantic: { ...theme.semantic, component: tokens }, components: shape };
}
