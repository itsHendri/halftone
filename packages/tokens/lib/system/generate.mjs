/**
 * generateSystem — a HalftoneSystem expanded into a theme, the same shape generateTheme returns. Pure ESM.
 *
 *   generateSystem(doc, base)  base = the app's tokens.json
 *     1. generateTheme(doc.recipe, base), with
 *     2. a ramp for every colour role from its seed (brandRamp; a custom neutral from its seed; a status
 *        role without one keeps base's ramp), then the steps edited by hand
 *     3. the role mapping, light and dark: the fixer moves only generated colours; a role mapped by hand, or
 *        on an edited step, keeps its colour, and a pairing that fails because of it is a warning
 *     4. per-style text tokens (semantic.type.<style>.{size,leading,weight,tracking,font}) for edited styles
 *     5. fonts, radius, shadow and border overrides
 *     6. extras, as the `extra` token group (theme.extra)
 *
 * A system with no overrides is exactly generateTheme(doc.recipe, base) (a test holds it to that).
 * The theme's `code` is its recipe's: a lossy handle when the system has overrides (systemCode says so).
 */
import { encodeRecipe } from '../theme/codec.mjs';
import { generateTheme } from '../theme/generate.mjs';
import { STEPS } from '../theme/palettes.mjs';
import { anchorStep, brandRamp, neutralAnchorStep, neutralRamp, neutralSeedRamp } from '../theme/ramp.mjs';
import { FIELD, fieldWidth, typeScale, LEADING, FLOW, resolveTextStyles } from '../theme/recipe.mjs';
import { resolvedMap } from '../theme/refs.mjs';
import { COLOR_ROLES, EXTRA_KINDS, hasOverrides, normalizeSystem, RADIUS_STEPS, STATUS_ROLES, TEXT_STYLES } from './schema.mjs';

const round = (n, places = 4) => Number(n.toFixed(places));
const alphaHex = (alpha) => Math.round(alpha * 255).toString(16).padStart(2, '0');

/** A layer as a DTCG shadow value. */
const shadowValue = (l) => ({ offsetX: l.x, offsetY: l.y, blur: l.blur, spread: l.spread, color: `${l.color}${alphaHex(l.alpha)}`, ...(l.inset ? { inset: true } : {}) });
const shadowToken = (s) => ({ light: s.light.map(shadowValue), dark: s.dark.map(shadowValue) });

/** The base file's primitives, resolved (its ramps may be references). */
const basePrimitives = (base) => resolvedMap({ primitive: base.primitive }, 'light');

/**
 * Every colour role's ramp: { role: { seed, anchor, source, generated, values, edited } }.
 *   source     'recipe' (brand, a preset neutral), 'seed' (a seed set in the system) or 'base' (a status
 *              ramp from tokens.json)
 *   generated  the ramp before edits; values: after them; edited: the steps edited by hand
 * The Studio draws its ramp strips from this.
 */
export function systemRamps(input, base) {
  const doc = normalizeSystem(input);
  const { recipe, colors } = doc;
  const prim = basePrimitives(base);
  const out = {};
  for (const role of COLOR_ROLES) {
    const c = colors[role] ?? {};
    let generated;
    let seed;
    let anchor;
    let source;
    if (role === 'brand') {
      seed = recipe.brand;
      anchor = c.anchor ?? anchorStep(seed);
      generated = brandRamp(seed, { anchor: c.anchor });
      source = 'recipe';
    } else if (role === 'neutral') {
      if (c.seed) {
        seed = c.seed;
        anchor = c.anchor ?? neutralAnchorStep(seed);
        generated = neutralSeedRamp(seed, { anchor: c.anchor });
        source = 'seed';
      } else {
        generated = neutralRamp(recipe.neutral, recipe.brand);
        seed = recipe.neutral;
        anchor = null;
        source = 'recipe';
      }
    } else if (c.seed) {
      seed = c.seed;
      anchor = c.anchor ?? anchorStep(seed);
      generated = brandRamp(seed, { anchor: c.anchor });
      source = 'seed';
    } else {
      generated = Object.fromEntries(STEPS.filter((s) => `primitive.color.${role}.${s}` in prim).map((s) => [s, prim[`primitive.color.${role}.${s}`]]));
      if (Object.keys(generated).length !== STEPS.length) throw new Error(`generateSystem: the base tokens have no ${role} ramp (primitive.color.${role}.50…950)`);
      seed = generated['600'];
      anchor = '600';
      source = 'base';
    }
    const edited = Object.keys(c.steps ?? {});
    out[role] = { seed, anchor, source, generated, values: { ...generated, ...c.steps }, edited };
  }
  return out;
}

/** A role's value as the theme writes it: '{primitive.color.brand.600}' or a hex. */
const roleRef = (value) => (value.startsWith('#') ? value : `{primitive.color.${value}}`);

/**
 * Every text style as drawn: { h1: { font, weight, size, leading, tracking, edited: [keys] }, … }. Defaults follow
 * the recipe's typeset (sizes × size / 16, line heights × leading / 1.75); edited keys are as set.
 */
export function textStyles(input) {
  const doc = normalizeSystem(input);
  const type = typeScale({ size: Number(doc.recipe.size), leading: LEADING[doc.recipe.leading], flow: FLOW[doc.recipe.flow], measure: Number(doc.recipe.measure) });
  const generated = resolveTextStyles(type);
  return Object.fromEntries(
    TEXT_STYLES.map((name) => {
      const { font, weight, size, leading, tracking } = generated[name];
      const edits = doc.type[name] ?? {};
      return [name, { font, weight, size: round(size, 2), leading: round(leading), tracking, ...edits, edited: Object.keys(edits) }];
    })
  );
}

/** rounded-sm…2xl in px: the base radius × each step's ratio to lg (as the build draws them), or as edited. */
export function systemRadii(input, base, theme = generateSystem(input, base)) {
  const doc = normalizeSystem(input);
  const prim = basePrimitives(base);
  const lg = prim['primitive.radius.lg'];
  return Object.fromEntries(RADIUS_STEPS.map((step) => [step, doc.radius[step] ?? round((theme.radius * prim[`primitive.radius.${step}`]) / lg, 2)]));
}

/** The `extra` token group (DTCG) for a system's extras, or undefined when it has none. */
function extraTokens(doc) {
  const group = {};
  const fontRef = (role) => `{primitive.font.family.${role}}`;
  for (const kind of EXTRA_KINDS) {
    if (!doc.extras[kind].length) continue;
    group[kind] = {};
    for (const { name, ...item } of doc.extras[kind]) {
      if (kind === 'color') {
        if (item.seed) {
          const values = { ...brandRamp(item.seed, { anchor: item.anchor }), ...item.steps };
          group.color[name] = Object.fromEntries(STEPS.map((s) => [s, { $type: 'color', $value: values[s] }]));
        } else group.color[name] = { $type: 'color', $value: item.value };
      }
      if (kind === 'text') {
        group.text[name] = {
          font: { $type: 'fontFamily', $value: fontRef(item.font) },
          weight: { $type: 'fontWeight', $value: item.weight },
          size: { $type: 'number', $value: item.size },
          leading: { $type: 'number', $value: item.leading },
          tracking: { $type: 'number', $value: item.tracking },
        };
      }
      if (kind === 'radius') group.radius[name] = { $type: 'number', $value: item.value };
      if (kind === 'shadow') group.shadow[name] = { $type: 'shadow', $value: shadowToken(item) };
      if (kind === 'border') {
        group.border[name] = { width: { $type: 'number', $value: item.width }, ...(item.style ? { style: { $type: 'strokeStyle', $value: item.style } } : {}) };
      }
    }
  }
  return Object.keys(group).length ? group : undefined;
}

/** The theme for a system, on top of `base` (a tokens.json object). `fix: false` skips the contrast fixer. */
export function generateSystem(input, base, { fix = true } = {}) {
  const doc = normalizeSystem(input);
  const { recipe, colors } = doc;

  // 1–3. Colours: only a system that changes them goes through generateTheme's system hook.
  const touchesColors = Object.keys(colors).length > 0 || Object.keys(doc.roles).length > 0;
  let options = {};
  if (touchesColors) {
    const ramps = systemRamps(doc, base);
    const changed = (role) => colors[role] !== undefined;
    options = {
      colors: {
        ramps: Object.fromEntries(COLOR_ROLES.filter(changed).map((role) => [role, ramps[role].values])),
        anchor: ramps.brand.anchor,
        anchors: Object.fromEntries(STATUS_ROLES.filter((role) => colors[role]?.seed).map((role) => [role, ramps[role].anchor])),
        roles: Object.fromEntries(Object.entries(doc.roles).map(([name, v]) => [name, Object.fromEntries(Object.entries(v).map(([mode, value]) => [mode, roleRef(value)]))])),
        edited: Object.fromEntries(COLOR_ROLES.filter((role) => ramps[role].edited.length).map((role) => [role, ramps[role].edited])),
      },
    };
  }
  const theme = generateTheme(recipe, base, { fix, ...options });
  if (!hasOverrides(doc)) return theme;

  const semantic = { ...theme.semantic };
  // 4. Text styles someone edited: every key, so the style is whole (the kits read all five).
  const edited = Object.keys(doc.type);
  if (edited.length) {
    const styles = textStyles(doc);
    semantic.type = { ...semantic.type };
    for (const name of edited) {
      const { font, weight, size, leading, tracking } = styles[name];
      semantic.type[name] = { size, leading, weight, tracking, font: `{primitive.font.family.${font}}` };
    }
  }
  // 5. Fonts, radius, shadow, border.
  const fonts = { ...theme.fonts, ...doc.fonts };
  if (Object.keys(doc.radius).length) semantic.radius = { ...semantic.radius, ...doc.radius };
  if (Object.keys(doc.shadow).length) {
    semantic.shadow = { ...semantic.shadow };
    for (const [level, s] of Object.entries(doc.shadow)) semantic.shadow[level] = shadowToken(s);
  }
  let { borderWidth, field } = theme;
  if (Object.keys(doc.border).length) {
    semantic.border = { ...semantic.border, ...doc.border };
    if (doc.border.width !== undefined) {
      borderWidth = doc.border.width;
      // The field's widths follow the border's (outline fields) or a 1px floor (filled, underline).
      const fld = FIELD[recipe.field];
      field = { ...field, border: fieldWidth(fld.border, borderWidth), edge: fieldWidth(fld.edge, borderWidth) };
      semantic.field = { ...semantic.field, 'border-width': field.border, 'edge-width': field.edge };
    }
  }
  // 6. Extras.
  const extra = extraTokens(doc);
  return { ...theme, semantic, fonts, borderWidth, field, ...(extra ? { extra } : {}) };
}

/** The ht- code for a system with no overrides; null when one would be lost (a code holds only the recipe). */
export function systemCode(input) {
  const doc = normalizeSystem(input);
  return hasOverrides(doc) ? null : encodeRecipe(doc.recipe);
}
