/**
 * The component layer: Button, Chip (FilterChip), Badge and Input (Textarea and Select draw it too), as tokens both
 * kits read. One theme for both kits: corners, sizes, text and colours are shared, so a Button looks the same on
 * the phone and on the web. Pure ESM.
 *
 *   componentLayer(input) → { tokens, shape }
 *     tokens   semantic.component.<name>.* (what tokens.json records; colours are references to semantic colours)
 *     shape    the same, resolved (hex per mode, px), what componentVars and the contrast check read
 *
 * Each component has a style (Button and Input: the recipe's button and field styles), a corner (a Foundations
 * corner, or px), a size (heights and horizontal padding, px), a text style (the component keeps its own weight)
 * and fixed variants (Input: states). A variant's fill, label, border and pressed colours are roles (semantic
 * colours); the defaults reproduce what the kits always drew. Pressed is derived from the fill unless it's set,
 * hover follows pressed, and disabled is 50% opacity.
 *
 * Phones raise anything under 44px to a 44px touch target (hitSlop) in the mobile kit; the tokens hold the
 * drawn sizes.
 */
import { blend, contrast, deltaEOK, relativeLuminance } from '../color.mjs';
import { OPTIONS, TEXT_DEFAULTS, TEXT_LINE_HEIGHT } from './recipe.mjs';

/** WCAG AA for a label (contrast.mjs's AA; not imported, contrast.mjs reads this module). */
const AA_TEXT = 4.5;
const RAMP_REF = /^\{primitive\.color\.([a-z0-9-]+)\.(\d+)\}$/;

export const COMPONENT_NAMES = ['button', 'chip', 'badge', 'input'];
/** A Foundations corner a component can follow (rounded-sm…2xl, full); a number is an override in px. */
export const CORNERS = ['sm', 'md', 'lg', 'xl', '2xl', 'full'];
export const SLOTS = ['fill', 'label', 'border', 'pressed'];
/** The touch-target floor the mobile kit applies on phones (hitSlop). */
export const TOUCH_TARGET = 44;

/**
 * Each component: its CSS prefix, its styles (the first is the default), the size keys it has, its variants with
 * the slots each one takes, and its default text style.
 */
export const COMPONENTS = {
  button: {
    prefix: 'button',
    label: 'Button',
    styles: OPTIONS.button,
    steps: ['sm', 'md', 'lg'],
    sizes: ['sm', 'md', 'lg', 'x', 'gap'],
    props: ['border', 'weight', 'case', 'icon', 'shadow', 'ring'],
    variants: { primary: SLOTS, secondary: SLOTS, outline: SLOTS, ghost: SLOTS, destructive: SLOTS },
    text: 'p',
  },
  chip: {
    prefix: 'chip',
    label: 'Chip',
    styles: ['outline', 'soft', 'solid'],
    steps: ['sm', 'md', 'lg'],
    sizes: ['sm', 'md', 'lg', 'x', 'gap'],
    props: ['border', 'weight', 'icon'],
    variants: { unselected: SLOTS, selected: SLOTS },
    text: 'small',
  },
  badge: {
    prefix: 'badge',
    label: 'Badge',
    styles: ['pill', 'square', 'soft'],
    steps: ['sm', 'md'],
    sizes: ['sm', 'md', 'x', 'gap'],
    props: ['border', 'weight', 'case', 'icon'],
    variants: { default: SLOTS, secondary: SLOTS, destructive: SLOTS, outline: SLOTS },
    text: 'small',
  },
  input: {
    prefix: 'field',
    label: 'Input',
    styles: OPTIONS.field,
    steps: ['sm', 'md', 'lg'],
    sizes: ['sm', 'md', 'lg', 'x'],
    props: ['border', 'placeholder', 'shadow', 'ring'],
    variants: { default: ['fill', 'label', 'border'], focus: ['fill', 'label', 'border'], error: ['fill', 'label', 'border'], disabled: ['fill', 'label', 'border'] },
    text: 'p',
  },
};

/** The weights a label can take, and its case (as written, or uppercase). */
export const WEIGHTS = [400, 500, 600, 700];
export const CASES = ['none', 'uppercase'];
/** A component's shadow: none, or a Foundations shadow level. */
export const SHADOWS = ['none', '1', '2', '3'];
/** The icon size (px) until a system sets one, the same in both kits: Button 16, Chip 14, Badge 12. */
export const ICON_DEFAULT = { button: 16, chip: 14, badge: 12 };
/**
 * The shadow until a system sets one, the same in both kits: a Button has Shadow 1 (Ghost none); an Input has its
 * field style's (a boxed field Shadow 1, a filled or underline field none).
 */
export const defaultShadow = (name, borderWidth) => (name === 'button' ? '1' : borderWidth ? '1' : 'none');
/** The focus ring's width (px) until a system sets one: the kits' ring-[3px]. */
export const RING_WIDTH = 3;

/** The slots as the CSS variables name them. `ring` is the focus ring Input's focus and error states derive. */
export const SLOT_VAR = { fill: 'bg', label: 'fg', border: 'border', pressed: 'pressed', ring: 'ring' };
/** The slots that carry an opacity (a variable of their own, -a). */
const ALPHA_SLOTS = new Set(['fill', 'border', 'pressed', 'ring']);

const round = (n, places = 4) => Number(n.toFixed(places));
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Each text style's Tailwind size at 16px, whose line height a control's text takes (text-base: 24 on 16). */
const TW_SIZE = { 12: 'xs', 14: 'sm', 16: 'base', 18: 'lg', 20: 'xl', 24: '2xl', 30: '3xl', 36: '4xl' };
/** A control's line height as a multiple of its text size: the Tailwind size's own, so Body reads as text-base. */
export const fittedLeading = (style) => {
  const px = TEXT_DEFAULTS[style]?.size ?? 16;
  return TEXT_LINE_HEIGHT[TW_SIZE[px] ?? 'base'] / px;
};

/** The corner a component follows when the system doesn't pick one. */
export function defaultCorner(name, { controls = 'pill', style } = {}) {
  if (name === 'button' || name === 'chip') return controls === 'pill' ? 'full' : 'lg';
  if (name === 'badge') return style === 'square' ? 'sm' : 'full';
  return 'md';
}

/** The default style of each component (Button and Input: the recipe's). */
export const defaultStyle = (name, recipe = {}) => (name === 'button' ? (recipe.button ?? 'solid') : name === 'input' ? (recipe.field ?? 'outline') : COMPONENTS[name].styles[0]);

// A colour spec: a role ('primary'), 'none', a ramp step ('brand.100'), { role, alpha }, or { light, dark } of those.
const both = (light, dark) => ({ light, dark });
const a = (role, alpha) => ({ role, alpha });

/** Every variant's default colours (specs), per component and style. `pressed: undefined` = derived from the fill. */
function variantDefaults(name, style, { button, field }) {
  if (name === 'button') {
    return {
      primary: { fill: a('button', button.alpha), label: 'button-foreground', border: 'button-edge' },
      secondary: { fill: 'secondary', label: 'secondary-foreground', border: 'none' },
      outline: { fill: both('background', a('input', 0.3)), label: 'foreground', border: both('border', 'input'), pressed: 'accent' },
      ghost: { fill: 'none', label: 'foreground', border: 'none', pressed: 'accent' },
      destructive: { fill: 'destructive', label: 'destructive-foreground', border: 'none' },
    };
  }
  if (name === 'chip') {
    const unselected =
      style === 'outline' ? { fill: 'background', label: 'foreground', border: 'border', pressed: 'accent' } : { fill: 'secondary', label: 'secondary-foreground', border: 'none' };
    // Selected is inverted (foreground on background), whatever the style but solid, which fills it with the brand.
    const selected = style === 'solid' ? { fill: 'primary', label: 'primary-foreground', border: 'primary' } : { fill: 'foreground', label: 'background', border: 'foreground' };
    return { unselected, selected };
  }
  if (name === 'badge') {
    const soft = style === 'soft';
    return {
      default: soft ? { fill: both('brand.100', 'brand.900'), label: both('brand.700', 'brand.200'), border: 'none' } : { fill: 'primary', label: 'primary-foreground', border: 'none' },
      secondary: { fill: 'secondary', label: 'secondary-foreground', border: 'none' },
      destructive: soft ? { fill: both('danger.100', 'danger.900'), label: both('danger.700', 'danger.200'), border: 'none' } : { fill: 'destructive', label: 'destructive-foreground', border: 'none' },
      outline: { fill: 'none', label: 'foreground', border: 'border' },
    };
  }
  return {
    default: { fill: both(a('field', field.alpha.light), a('field', field.alpha.dark)), label: 'foreground', border: 'field-edge' },
    focus: { border: 'ring' },
    error: { border: 'destructive' },
    disabled: {},
  };
}

/** A spec in one mode → { ref, alpha } (ref: '{semantic.color.x}' or '{primitive.color.ramp.step}'). */
function specIn(spec, mode) {
  if (isObject(spec) && 'light' in spec) return specIn(spec[mode], mode);
  if (isObject(spec)) return { ...specIn(spec.role, mode), alpha: spec.alpha };
  if (spec === 'none') return { ref: '{semantic.color.background}', alpha: 0 };
  if (spec.includes('.')) return { ref: `{primitive.color.${spec}}`, alpha: 1 };
  return { ref: `{semantic.color.${spec}}`, alpha: 1 };
}

/** The role a spec names in light mode (what the Studio shows), or null for a ramp step. */
function roleOf(spec) {
  if (isObject(spec) && 'light' in spec) return roleOf(spec.light);
  if (isObject(spec)) return roleOf(spec.role);
  return spec === 'none' || !spec.includes('.') ? spec : null;
}

/**
 * The component layer for a theme.
 *   styles       { button, field } (the recipe's) and, from a system, chip and badge
 *   controls     the recipe's 'pill' | 'match' (Button and Chip's default corner)
 *   corner       (name) → px for sm…2xl ('full' is 9999)
 *   density      { sm, md, lg, x } control heights and padding (px)
 *   borderWidth  the theme's border width (px)
 *   button       { alpha, border, edge }; field { alpha: { light, dark }, border, edge, inset, round, roundBottom }
 *   textStyles   the text styles as drawn (resolveTextStyles); type: { leadingFactor }
 *   hex          (ref, mode) → '#rrggbb'
 *   overrides    a system's `components` (normalised; Button and Input styles already folded into the recipe)
 */
export function componentLayer({ styles, controls, corner, density, borderWidth, button, field, textStyles, type, hex, ramps = {}, overrides = {} }) {
  const tokens = {};
  const shape = {};
  const color = (spec, edited) => {
    const light = specIn(spec, 'light');
    const dark = specIn(spec, 'dark');
    return {
      role: roleOf(spec),
      edited: !!edited,
      ref: { light: light.ref, dark: dark.ref },
      light: hex(light.ref, 'light'),
      dark: hex(dark.ref, 'dark'),
      alpha: { light: round(light.alpha), dark: round(dark.alpha) },
    };
  };
  const page = (mode) => hex('{semantic.color.background}', mode);

  // Colours come from the ramps (apps/docs/design/studio-wireframes.md › The open card): a fill, label, border or
  // pressed colour is a role or a ramp step, never a colour at partial opacity, whose contrast would change with
  // whatever is behind it. Only overlays (the focus rings' halos) are see-through.
  const order = (r) => Object.keys(ramps[r]).sort((x, y) => Number(x) - Number(y));
  /** The ramp and step a colour sits on: its own reference, or the nearest step of any ramp. */
  const placeOf = (ref, value) => {
    const m = RAMP_REF.exec(ref);
    if (m && ramps[m[1]]?.[m[2]]) return [m[1], m[2]];
    let best = null;
    for (const r of Object.keys(ramps)) for (const st of order(r)) {
      const d = deltaEOK(value, ramps[r][st]);
      if (!best || d < best.d) best = { r, st, d };
    }
    return best ? [best.r, best.st] : null;
  };
  const piece = (spec, mode) => (isObject(spec) && 'light' in spec ? spec[mode] : spec);
  /** A default drawn at partial opacity, as the step of its ramp nearest to what it drew over the page. */
  const opaque = (spec) => {
    const per = {};
    for (const mode of ['light', 'dark']) {
      const { ref, alpha } = specIn(spec, mode);
      if (!(alpha > 0 && alpha < 1) || !Object.keys(ramps).length) {
        per[mode] = piece(spec, mode);
        continue;
      }
      const drawn = blend(hex(ref, mode), page(mode), alpha);
      const place = placeOf(ref, hex(ref, mode));
      const st = order(place[0]).reduce((b, x) => (deltaEOK(drawn, ramps[place[0]][x]) < deltaEOK(drawn, ramps[place[0]][b]) ? x : b));
      per[mode] = `${place[0]}.${st}`;
    }
    return both(per.light, per.dark);
  };
  /**
   * Hover and pressed: the next step of the fill's ramp away from the page (darker on a light page, lighter on a dark
   * one) whose label still reads (AA, or the fill's own contrast when that is lower); the other way when none does.
   */
  const toward = (fill, label) => {
    const per = {};
    for (const mode of ['light', 'dark']) {
      if (fill.alpha[mode] <= 0) {
        per[mode] = 'accent';
        continue;
      }
      const place = placeOf(fill.ref[mode], fill[mode]);
      if (!place) {
        per[mode] = fill.role ?? 'accent';
        continue;
      }
      const list = order(place[0]);
      const at = list.indexOf(place[1]);
      const steps = ramps[place[0]];
      const need = Math.min(AA_TEXT, contrast(fill[mode], label[mode]));
      // Steps run light to dark: away from a light page is up the list.
      const away = relativeLuminance(page(mode)) > 0.5 ? 1 : -1;
      const reads = (j) => list[j] !== undefined && steps[list[j]].toLowerCase() !== fill[mode].toLowerCase() && contrast(steps[list[j]], label[mode]) >= need;
      let pick = null;
      for (const dir of [away, -away]) {
        for (let j = at + dir; j >= 0 && j < list.length && pick === null; j += dir) if (reads(j)) pick = list[j];
        if (pick !== null) break;
      }
      per[mode] = `${place[0]}.${pick ?? list[Math.min(list.length - 1, Math.max(0, at + away))]}`;
    }
    return both(per.light, per.dark);
  };

  for (const name of COMPONENT_NAMES) {
    const def = COMPONENTS[name];
    const o = overrides[name] ?? {};
    const style = name === 'button' ? styles.button : name === 'input' ? styles.field : (o.style ?? def.styles[0]);
    const cornerName = typeof o.radius === 'string' ? o.radius : defaultCorner(name, { controls, style });
    const radius = typeof o.radius === 'number' ? o.radius : cornerName === 'full' ? 9999 : round(corner(cornerName), 2);
    const size = o.size ?? {};

    // Sizes: Button from density (small and large padding 16 and 24 until the padding is set, then ±4); the Chip a
    // 36px pill with 14px padding; the Badge 8px padding; Input's heights from density, its padding the field
    // style's inset (16px, or flush).
    const h = {};
    const x = {};
    if (name === 'button') {
      Object.assign(h, { sm: size.sm ?? density.sm, md: size.md ?? density.md, lg: size.lg ?? density.lg });
      Object.assign(x, size.x === undefined ? { sm: 16, md: density.x, lg: 24 } : { sm: Math.max(0, size.x - 4), md: size.x, lg: size.x + 4 });
    }
    if (name === 'chip') {
      Object.assign(h, { sm: size.sm ?? 32, md: size.md ?? 36, lg: size.lg ?? 40 });
      x.md = size.x ?? 14;
    }
    if (name === 'badge') x.md = size.x ?? 8;
    if (name === 'input') {
      Object.assign(h, { sm: size.sm ?? 32, md: size.md ?? density.md, lg: size.lg ?? density.lg });
      x.md = size.x ?? (field.inset ? 16 : 0);
    }

    // Text: the style's font, size and tracking; the line height fits a control (Body → text-base's 24 on 16). The
    // weight is the component's own (medium; an Input's regular) until set, and the case as written.
    const textName = o.text ?? def.text;
    const ts = textStyles[textName];
    const text = {
      style: textName,
      font: ts.font,
      size: round(ts.size),
      leading: round(ts.size * fittedLeading(textName) * (type.leadingFactor ?? 1)),
      tracking: ts.tracking,
      weight: o.weight ?? (name === 'input' ? 400 : 500),
      case: o.case ?? 'none',
    };

    // Border width: Chip and Badge draw the theme's border until set; Input its field style's (an outline box, or
    // a filled or underline field's bottom line). Button's is per variant, below.
    const line = o.border;
    const borderWidthOf = name === 'input' ? (line === undefined ? field.border : field.border ? line : 0) : (line ?? borderWidth);
    const edgeWidthOf = name === 'input' ? (line ?? field.edge) : borderWidthOf;
    // A Badge is as tall as its text, padding and border until a height is set (S without the vertical padding); a
    // set height is exact, never shorter than its text and border.
    if (name === 'badge') {
      const least = round(text.leading + 2 * borderWidthOf);
      Object.assign(h, { sm: Math.max(least, size.sm ?? least), md: Math.max(least, size.md ?? round(text.leading + 4 + 2 * borderWidthOf)) });
    }
    // The gap between an icon and the label: Button's small size is tighter until the gap is set.
    const gap = name === 'button' ? (size.gap === undefined ? { sm: 6, md: 8, lg: 8 } : { sm: size.gap, md: size.gap, lg: size.gap }) : name === 'input' ? null : { md: size.gap ?? (name === 'chip' ? 6 : 4) };

    // Variants.
    const defaults = variantDefaults(name, style, { button, field });
    const variants = {};
    for (const [variant, slots] of Object.entries(def.variants)) {
      const edits = o.variants?.[variant] ?? {};
      // A default drawn at partial opacity is its nearest ramp step (the ramp rule above).
      const d = Object.fromEntries(Object.entries(defaults[variant]).map(([slot, spec]) => [slot, opaque(spec)]));
      const v = {};
      if (name === 'input' && variant !== 'default') {
        // Focus, error and disabled follow the default state unless set (disabled at 50% opacity); focus and error
        // have a border of their own.
        for (const slot of slots) v[slot] = edits[slot] ? color(edits[slot], true) : d[slot] !== undefined ? color(d[slot]) : { ...variants.default[slot], edited: false };
        // Their rings: the focus ring's role when one is set, otherwise the border at 50% (focus) or 20% / 40% in
        // dark (error).
        if (variant === 'focus') v.ring = o.ring?.role ? { ...color(o.ring.role, true), alpha: { light: 0.5, dark: 0.5 } } : { ...v.border, edited: false, derived: true, alpha: { light: 0.5, dark: 0.5 } };
        if (variant === 'error') v.ring = { ...v.border, edited: false, derived: true, alpha: { light: 0.2, dark: 0.4 } };
      } else {
        // A border that is the fill by default (a selected chip, a primary button) follows an edited fill.
        const follows = edits.fill !== undefined && edits.border === undefined && JSON.stringify(roleOf(d.border ?? 'none')) === JSON.stringify(roleOf(d.fill ?? 'none')) && d.border !== 'none';
        for (const slot of slots) {
          if (slot === 'pressed') continue;
          v[slot] = color(slot === 'border' && follows ? edits.fill : (edits[slot] ?? d[slot]), edits[slot] !== undefined);
          // An edited colour is opaque; 'none' is transparent.
          if (edits[slot] !== undefined && edits[slot] !== 'none') v[slot].alpha = { light: 1, dark: 1 };
        }
        // A border of 'none' is clear (the fill's colour at no opacity): the ring keeps its size, and a fill set in a
        // className still shows under it.
        if (v.border && roleOf(edits.border ?? d.border) === 'none' && v.fill) v.border = { ...v.fill, role: 'none', edited: edits.border !== undefined, alpha: { light: 0, dark: 0 } };
        if (slots.includes('pressed')) {
          if (edits.pressed !== undefined) v.pressed = { ...color(edits.pressed, true), alpha: { light: 1, dark: 1 } };
          // Derived: the kit's own pressed colour (Outline and Ghost: accent) until the fill changes; otherwise the
          // fill's ramp step next to it with more contrast against the label (a clear fill: accent).
          else if (d.pressed && edits.fill === undefined) v.pressed = { ...color(d.pressed), derived: true };
          else v.pressed = { ...color(toward(v.fill, v.label)), derived: true };
        }
      }
      // Button borders: a width per variant (0 without a border), and the primary's bottom edge (raised). A border
      // width set on the component is every drawn border's; a raised edge stays at least as thick.
      if (name === 'button') {
        const none = v.border.role === 'none';
        const width = variant === 'primary' ? button.border : variant === 'outline' ? borderWidth : 0;
        const edge = variant === 'primary' ? button.edge : width;
        if (line !== undefined) {
          v.borderWidth = none ? 0 : line;
          v.edgeWidth = none ? 0 : variant === 'primary' && button.edge > button.border ? Math.max(button.edge, line) : line;
        } else {
          v.borderWidth = none ? 0 : width || (edits.border !== undefined ? borderWidth : 0);
          v.edgeWidth = none ? 0 : Math.max(edge, v.borderWidth);
        }
        // The focus ring: the ring role at 50% (Destructive: its own colour at 20%, 40% in dark) until a role is set.
        v.ring = o.ring?.role
          ? { ...color(o.ring.role, true), alpha: { light: 0.5, dark: 0.5 } }
          : variant === 'destructive'
            ? { ...color('destructive'), derived: true, alpha: { light: 0.2, dark: 0.4 } }
            : { ...color('ring'), derived: true, alpha: { light: 0.5, dark: 0.5 } };
      }
      variants[variant] = v;
    }

    const out = { style, corner: typeof o.radius === 'number' ? null : cornerName, radius, h, x, text, variants };
    // What every variant shares beyond the basics: the border set on the component (null: as the style draws it),
    // the gap, the icon size, the shadow, the focus ring, and Input's
    // placeholder.
    out.border = line ?? null;
    if (name !== 'button') Object.assign(out, { borderWidth: borderWidthOf, edgeWidth: edgeWidthOf });
    if (gap) out.gap = gap;
    if (def.props.includes('icon')) out.icon = o.icon ?? ICON_DEFAULT[name];
    if (def.props.includes('shadow')) out.shadow = o.shadow ?? defaultShadow(name, borderWidthOf);
    if (def.props.includes('ring')) {
      out.ring = { width: o.ring?.width ?? RING_WIDTH, role: o.ring?.role ?? null };
      // Button: the focused border is the ring's role, opaque.
      if (name === 'button') out.focusBorder = { ...color(o.ring?.role ?? 'ring', !!o.ring?.role), alpha: { light: 1, dark: 1 } };
    }
    if (name === 'input') out.placeholder = { ...color(o.placeholder ?? 'muted-foreground', !!o.placeholder), alpha: { light: 1, dark: 1 } };
    if (name === 'input') {
      out.radiusBottom = round(radius * field.roundBottom, 4);
      out.radius = round(radius * field.round, 4);
    }
    shape[name] = out;
    tokens[name] = componentTokens(name, out, { button, field });
  }
  return { tokens, shape };
}

/** A value per mode, collapsed to one when both modes agree. */
const moded = (light, dark) => (light === dark ? light : { light, dark });

/** One component's tokens (semantic.component.<name>), plain values; apply.mjs gives them $type and $value. */
function componentTokens(name, c, { button, field }) {
  const t = { radius: c.radius };
  if (name === 'input') t['radius-bottom'] = c.radiusBottom;
  if (Object.keys(c.h).length) t.height = { ...c.h };
  t.x = { ...c.x };
  if (c.gap) t.gap = { ...c.gap };
  t.text = { size: c.text.size, leading: c.text.leading, tracking: c.text.tracking, font: `{primitive.font.family.${c.text.font}}`, weight: c.text.weight };
  if (c.text.case === 'uppercase') t.text.uppercase = 1;
  // The style numbers the button and field tokens used to hold (semantic.button.*, semantic.field.*).
  if (name === 'button') Object.assign(t, { alpha: button.alpha, 'border-width': button.border, 'edge-width': button.edge });
  if (name === 'chip' || name === 'badge') t['border-width'] = c.borderWidth;
  if (name === 'input') {
    Object.assign(t, {
      alpha: moded(field.alpha.light, field.alpha.dark),
      'border-width': c.borderWidth,
      'edge-width': c.edgeWidth,
      round: field.round,
      'round-bottom': field.roundBottom,
      inset: field.inset,
    });
  }
  // The icon size and the shadow level (0 = none).
  if (c.icon !== undefined) t.icon = c.icon;
  if (c.shadow) t.shadow = c.shadow === 'none' ? 0 : Number(c.shadow);
  if (c.ring) t['ring-width'] = c.ring.width;
  if (c.focusBorder) t['focus-border'] = { light: c.focusBorder.ref.light, dark: c.focusBorder.ref.dark };
  if (c.placeholder) t.placeholder = { light: c.placeholder.ref.light, dark: c.placeholder.ref.dark };
  for (const [variant, v] of Object.entries(c.variants)) {
    const group = {};
    for (const slot of ['fill', 'label', 'border', 'pressed', 'ring']) {
      if (!v[slot]) continue;
      group[slot] = { light: v[slot].ref.light, dark: v[slot].ref.dark };
      if (ALPHA_SLOTS.has(slot)) group[`${slot}-alpha`] = moded(v[slot].alpha.light, v[slot].alpha.dark);
    }
    if (v.borderWidth !== undefined) Object.assign(group, { 'border-width': v.borderWidth, 'edge-width': v.edgeWidth });
    t[variant] = group;
  }
  return t;
}

/**
 * The shape back from a token file's semantic.component group, as componentLayer returns it: `light` / `dark` are
 * the flat resolved maps ('semantic.component.button.radius' → value), `raw` the unresolved group (for the font role
 * and the roles the colours reference). Null when the file has no component tokens (a file from before them). A file
 * from before a property gets its default (`borderWidth`: the theme's border, for Chip and Badge).
 */
export function readComponents(light, dark, raw, { borderWidth = 1 } = {}) {
  if (!raw || !Object.keys(raw).length) return null;
  const shape = {};
  const at = (map, path) => map[`semantic.component.${path}`];
  const rawValue = (path) => {
    let node = raw;
    for (const key of path.split('.')) node = node?.[key];
    return node?.$value;
  };
  /** A colour token back as { role, light, dark, alpha }; undefined when the file doesn't have it. */
  const readColor = (path) => {
    const lightHex = at(light, path);
    if (lightHex === undefined) return undefined;
    const refs = rawValue(path);
    const role = /\{semantic\.color\.([a-z0-9-]+)\}/.exec(String(isObject(refs) ? refs.light : refs))?.[1] ?? null;
    return {
      role,
      light: String(lightHex).toLowerCase(),
      dark: String(at(dark, path)).toLowerCase(),
      alpha: { light: at(light, `${path}-alpha`) ?? 1, dark: at(dark, `${path}-alpha`) ?? 1 },
    };
  };
  for (const name of COMPONENT_NAMES) {
    if (!raw[name]) return null;
    const def = COMPONENTS[name];
    const num = (path, fallback) => at(light, `${name}.${path}`) ?? fallback;
    const sizes = (group) => Object.fromEntries(['sm', 'md', 'lg'].filter((s) => at(light, `${name}.${group}.${s}`) !== undefined).map((s) => [s, at(light, `${name}.${group}.${s}`)]));
    const font = /\{primitive\.font\.family\.(heading|body|mono)\}/.exec(String(rawValue(`${name}.text.font`)))?.[1] ?? 'body';
    const out = {
      radius: num('radius', 0),
      h: sizes('height'),
      x: sizes('x'),
      text: {
        font,
        size: num('text.size', 16),
        leading: num('text.leading', 24),
        tracking: num('text.tracking', 0),
        weight: num('text.weight', name === 'input' ? 400 : 500),
        case: num('text.uppercase', 0) ? 'uppercase' : 'none',
      },
      variants: {},
    };
    if (name === 'input') out.radiusBottom = num('radius-bottom', out.radius);
    if (name === 'input') Object.assign(out, { borderWidth: num('border-width', 1), edgeWidth: num('edge-width', 1) });
    if (name === 'chip' || name === 'badge') out.borderWidth = out.edgeWidth = num('border-width', borderWidth);
    if (name === 'chip') out.h = { sm: out.h.sm ?? 32, md: out.h.md, lg: out.h.lg ?? 40 };
    if (name === 'badge') out.h = { sm: out.h.sm ?? round(out.text.leading + 2 * out.borderWidth), md: out.h.md ?? round(out.text.leading + 4 + 2 * out.borderWidth) };
    if (name !== 'input') {
      const gap = sizes('gap');
      out.gap = name === 'button' ? { sm: 6, md: 8, lg: 8, ...gap } : { md: name === 'chip' ? 6 : 4, ...gap };
    }
    if (def.props.includes('icon')) out.icon = num('icon', ICON_DEFAULT[name]);
    if (def.props.includes('shadow')) {
      const level = num('shadow', null);
      out.shadow = level === null ? defaultShadow(name, out.borderWidth) : level === 0 ? 'none' : String(level);
    }
    if (def.props.includes('ring')) out.ring = { width: num('ring-width', RING_WIDTH), role: null };
    if (name === 'button') out.focusBorder = readColor('button.focus-border');
    if (name === 'input') out.placeholder = readColor('input.placeholder');
    for (const variant of Object.keys(def.variants)) {
      const v = {};
      for (const slot of ['fill', 'label', 'border', 'pressed', 'ring']) {
        const color = readColor(`${name}.${variant}.${slot}`);
        if (color) v[slot] = color;
      }
      // Input's focus and error states from before they had a fill and text: the default state's.
      if (name === 'input' && variant !== 'default') for (const slot of ['fill', 'label']) v[slot] ??= out.variants.default[slot];
      if (at(light, `${name}.${variant}.border-width`) !== undefined) {
        v.borderWidth = at(light, `${name}.${variant}.border-width`);
        v.edgeWidth = at(light, `${name}.${variant}.edge-width`) ?? v.borderWidth;
      }
      out.variants[variant] = v;
    }
    for (const key of ['focusBorder', 'placeholder']) if (out[key] === undefined) delete out[key];
    shape[name] = out;
  }
  return shape;
}

/** Colours a component holds beyond its variants: Button's focused border, Input's placeholder. */
const OWN_COLORS = { button: { focusBorder: 'focus-border' }, input: { placeholder: 'placeholder' } };

/** Every component variable name a shape produces, light block (what an embedded kit may accept). */
export function componentVarNames() {
  const names = [];
  for (const name of COMPONENT_NAMES) {
    const def = COMPONENTS[name];
    const p = def.prefix;
    names.push(`--${p}-radius`, `--${p}-text-size`, `--${p}-text-leading`, `--${p}-text-tracking`, `--${p}-text-font`, `--${p}-text-weight`);
    if (def.props.includes('case')) names.push(`--${p}-text-case`);
    if (name === 'input') names.push('--field-radius-b', '--field-shadow');
    for (const s of def.steps) names.push(`--${p}-h-${s}`);
    names.push(`--${p}-x`);
    if (name === 'button') names.push('--button-x-sm', '--button-x-lg', '--button-gap-sm');
    if (name !== 'input') names.push(`--${p}-gap`);
    if (name === 'chip' || name === 'badge') names.push(`--${p}-border-w`);
    if (def.props.includes('icon')) names.push(`--${p}-icon`);
    if (def.props.includes('ring')) names.push(`--${p}-ring-w`);
    for (const key of Object.values(OWN_COLORS[name] ?? {})) names.push(`--${p}-${key}`);
    for (const [variant, slots] of Object.entries(def.variants)) {
      const all = [...slots, ...(name === 'button' || variant === 'focus' || variant === 'error' ? ['ring'] : [])];
      for (const slot of all) {
        names.push(`--${p}-${variant}-${SLOT_VAR[slot]}`);
        if (ALPHA_SLOTS.has(slot)) names.push(`--${p}-${variant}-${SLOT_VAR[slot]}-a`);
      }
      if (name === 'button') names.push(`--button-${variant}-border-w`, `--button-${variant}-edge-w`, `--button-${variant}-shadow`);
    }
  }
  return names;
}

const NO_SHADOW = '0 0 #0000';

/**
 * A shape as CSS variables, { light, dark }, in a kit's format (vars.mjs):
 *   'hsl'    mobile: colours as triplets, lengths in px or rem (4 places); no font variable (the kit picks it in JS),
 *            and no shadow (the kit draws TOKENS.components' level with TOKENS.shadows)
 *   'oklch'  web: oklch colours; `font(role)` writes the text's font family; shadows are var(--shadow-N)
 * Colours carry their opacity apart (--button-primary-bg and --button-primary-bg-a), as --button and --button-alpha do.
 */
export function componentVars(shape, format, convert, font = (role) => `var(--kit-font-${role})`) {
  const light = {};
  const dark = {};
  const rem = (px) => (px >= 9999 ? '9999px' : `${round(px / 16)}rem`);
  const shadow = (level) => (!level || level === 'none' ? NO_SHADOW : `var(--shadow-${level})`);
  for (const name of COMPONENT_NAMES) {
    const c = shape[name];
    if (!c) continue;
    const def = COMPONENTS[name];
    const p = def.prefix;
    light[`--${p}-radius`] = rem(c.radius);
    if (name === 'input') light['--field-radius-b'] = rem(c.radiusBottom);
    for (const [s, px] of Object.entries(c.h)) light[`--${p}-h-${s}`] = `${px}px`;
    light[`--${p}-x`] = `${c.x.md}px`;
    if (name === 'button') Object.assign(light, { '--button-x-sm': `${c.x.sm}px`, '--button-x-lg': `${c.x.lg}px` });
    if (c.gap) {
      light[`--${p}-gap`] = `${c.gap.md}px`;
      if (name === 'button') light['--button-gap-sm'] = `${c.gap.sm}px`;
    }
    if ((name === 'chip' || name === 'badge') && c.borderWidth !== undefined) light[`--${p}-border-w`] = `${c.borderWidth}px`;
    light[`--${p}-text-size`] = rem(c.text.size);
    light[`--${p}-text-leading`] = rem(c.text.leading);
    light[`--${p}-text-tracking`] = `${c.text.tracking}em`;
    light[`--${p}-text-weight`] = String(c.text.weight ?? (name === 'input' ? 400 : 500));
    if (def.props.includes('case')) light[`--${p}-text-case`] = c.text.case ?? 'none';
    if (format !== 'hsl') light[`--${p}-text-font`] = font(c.text.font);
    if (def.props.includes('icon')) light[`--${p}-icon`] = `${c.icon ?? ICON_DEFAULT[name]}px`;
    if (c.ring) light[`--${p}-ring-w`] = `${c.ring.width}px`;
    for (const [key, cssName] of Object.entries(OWN_COLORS[name] ?? {})) {
      if (!c[key]) continue;
      light[`--${p}-${cssName}`] = convert(c[key].light);
      dark[`--${p}-${cssName}`] = convert(c[key].dark);
    }
    // Web shadows, as Foundations shadows (defaultShadow until set). Ghost never has one.
    if (format !== 'hsl' && name === 'input') light['--field-shadow'] = shadow(c.shadow ?? defaultShadow(name, c.borderWidth));
    for (const [variant, v] of Object.entries(c.variants)) {
      for (const [slot, col] of Object.entries(v)) {
        if (!SLOT_VAR[slot] || !col) continue;
        const key = `--${p}-${variant}-${SLOT_VAR[slot]}`;
        light[key] = convert(col.light);
        dark[key] = convert(col.dark);
        if (ALPHA_SLOTS.has(slot)) {
          light[`${key}-a`] = String(col.alpha.light);
          dark[`${key}-a`] = String(col.alpha.dark);
        }
      }
      if (v.borderWidth !== undefined) Object.assign(light, { [`--button-${variant}-border-w`]: `${v.borderWidth}px`, [`--button-${variant}-edge-w`]: `${v.edgeWidth}px` });
      if (format !== 'hsl' && name === 'button') light[`--button-${variant}-shadow`] = variant === 'ghost' ? NO_SHADOW : shadow(c.shadow ?? defaultShadow(name));
    }
  }
  return { light, dark };
}

/** A shape's colour slots as Tailwind colours (name → CSS), for both kits' theme maps. */
export function componentColors(shape, css) {
  const out = {};
  for (const name of COMPONENT_NAMES) {
    const c = shape[name];
    if (!c) continue;
    const p = COMPONENTS[name].prefix;
    for (const [key, cssName] of Object.entries(OWN_COLORS[name] ?? {})) if (c[key]) out[`${p}-${cssName}`] = css(`${p}-${cssName}`, false);
    for (const [variant, v] of Object.entries(c.variants)) {
      for (const slot of Object.keys(v)) {
        if (!SLOT_VAR[slot]) continue;
        const key = `${p}-${variant}-${SLOT_VAR[slot]}`;
        out[key] = css(key, ALPHA_SLOTS.has(slot));
      }
    }
  }
  return out;
}

/**
 * Label-on-fill pairings for every variant (the fill blended over the page at its opacity), in one mode: what the
 * contrast gate and the Studio's Accessibility tab count. Input's focus and error borders aren't text.
 *   → [{ component, variant, label, fg, bg, fgRole, bgRole }]
 */
export function componentPairs(shape, mode, background, blend) {
  const out = [];
  for (const name of COMPONENT_NAMES) {
    const c = shape?.[name];
    if (!c) continue;
    for (const [variant, v] of Object.entries(c.variants)) {
      if (!v.label || !v.fill) continue;
      const alpha = v.fill.alpha[mode];
      const bg = alpha >= 1 ? v.fill[mode] : alpha <= 0 ? background : blend(v.fill[mode], background, alpha);
      out.push({ component: name, variant, label: `${COMPONENTS[name].label} ${variant}: label on fill`, fg: v.label[mode], bg, fgRole: v.label.role, bgRole: alpha <= 0 ? 'background' : v.fill.role });
    }
    // Input's placeholder, on the default state's fill.
    if (c.placeholder) {
      const fill = c.variants.default.fill;
      const alpha = fill.alpha[mode];
      const bg = alpha >= 1 ? fill[mode] : alpha <= 0 ? background : blend(fill[mode], background, alpha);
      out.push({ component: name, variant: 'placeholder', label: 'Input placeholder on fill', fg: c.placeholder[mode], bg, fgRole: c.placeholder.role, bgRole: alpha <= 0 ? 'background' : fill.role });
    }
  }
  return out;
}


/** A corner in words: 'pill', or px. */
const cornerText = (px) => (px >= 9999 ? 'pill' : `${round(px, 2)}px corners`);

/**
 * The component layer in a few lines for the agent docs (DESIGN.md, llms.txt): sizes, corners and the selected chip,
 * the same in both kits.
 */
export function describeComponents(shape) {
  const { button, chip, badge, input } = shape;
  const role = (c) => (c?.role ?? 'its style').replace(/-/g, ' ');
  return [
    `Button ${button.h.md}px tall (small ${button.h.sm}, large ${button.h.lg}), ${button.x.md}px padding, ${cornerText(button.radius)}, ${button.text.size}px text`,
    `Chip ${chip.h.md}px, ${cornerText(chip.radius)}; selected is ${role(chip.variants.selected.fill)} with ${role(chip.variants.selected.label)} text`,
    `Badge ${cornerText(badge.radius)}, ${badge.text.size}px text`,
    `Input, Textarea and Select ${input.h.md}px, ${cornerText(input.radius)}`,
  ];
}
