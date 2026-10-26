/**
 * The semantic colour map a theme writes: shadcn names (plus success/warning/info) → primitive
 * references per mode. With a curated seed this is exactly the kit's original map; a generated seed
 * moves the brand steps to wherever the seed landed (its anchor).
 */
import { STEPS } from './palettes.mjs';

const n = (step) => `{primitive.color.neutral.${step}}`;
const b = (step) => `{primitive.color.brand.${step}}`;
const p = (ramp, step) => `{primitive.color.${ramp}.${step}}`;

/** The brand step for dark mode: light seeds stay, darker ones lift so they read on a dark page. */
const DARK_STEP = { 600: '500', 700: '400', 800: '300', 900: '200', 950: '100' };
export const darkStep = (anchor) => DARK_STEP[anchor] ?? anchor;

/**
 * The status tones' steps, as offsets from the step their seed sits on (600 for the curated ramps the kits
 * ship), light and dark: a status seed that lands on another step moves its tone with it, as the brand does.
 */
const STATUS_STEPS = { danger: [0, -1], success: [1, -1], warning: [1, -2], info: [1, -1] };
const status = (ramp, anchor = '600') => ({ light: p(ramp, shift(anchor, STATUS_STEPS[ramp][0])), dark: p(ramp, shift(anchor, STATUS_STEPS[ramp][1])) });

/**
 * The tints: colours come from the ramps, not from opacity (a colour at partial opacity takes on whatever is
 * behind it, so its contrast changes with the surface). `<tone>-subtle` is a tinted surface (an Alert, an
 * IconCircle, a selected card), `<tone>-border` its edge: a light step on a light page, a dark one on a dark page.
 * Text on a tint is `foreground`; the tone itself is an icon or a dot on it (contrast.mjs checks both).
 */
const TINT_TONES = { primary: 'brand', success: 'success', warning: 'warning', destructive: 'danger', info: 'info' };
export const TINT_ROLES = Object.keys(TINT_TONES).flatMap((tone) => [`${tone}-subtle`, `${tone}-border`]);
const tints = () =>
  Object.fromEntries(
    Object.entries(TINT_TONES).flatMap(([tone, ramp]) => [
      [`${tone}-subtle`, { light: p(ramp, '100'), dark: p(ramp, '950') }],
      [`${tone}-border`, { light: p(ramp, '300'), dark: p(ramp, '900') }],
    ])
  );

/**
 * Roles a theme derives from others rather than picking: the tints, `muted-subtle` (a surface a step off the
 * page) and the pressed fills (the next step of the fill's ramp, away from the page). The fixer moves one of these,
 * not the ink on it, when a pairing on it fails (fix.mjs).
 */
export const isDerived = (name) => /-(subtle|pressed)$/.test(name);

/**
 * { name: { light: ref, dark: ref } } in the order the kit's tokens.json lists them. `anchors` holds the step
 * each status seed sits on (`{ danger: '500' }`); a status without one uses its 600, the curated ramps' seed.
 */
export function semanticColors(anchor = '600', anchors = {}) {
  const brand = { light: b(anchor), dark: b(darkStep(anchor)) };
  const onDark = { light: n(0), dark: n(950) };
  return {
    background: { light: n(0), dark: n(950) },
    foreground: { light: n(950), dark: n(50) },
    card: { light: n(0), dark: n(900) },
    'card-foreground': { light: n(950), dark: n(50) },
    popover: { light: n(0), dark: n(900) },
    'popover-foreground': { light: n(950), dark: n(50) },
    primary: brand,
    'primary-foreground': onDark,
    secondary: { light: n(100), dark: n(800) },
    'secondary-foreground': { light: n(900), dark: n(50) },
    muted: { light: n(100), dark: n(800) },
    'muted-foreground': { light: n(600), dark: n(400) },
    accent: { light: n(100), dark: n(800) },
    'accent-foreground': { light: n(900), dark: n(50) },
    destructive: status('danger', anchors.danger),
    'destructive-foreground': onDark,
    success: status('success', anchors.success),
    'success-foreground': onDark,
    warning: status('warning', anchors.warning),
    'warning-foreground': onDark,
    info: status('info', anchors.info),
    'info-foreground': onDark,
    border: { light: n(200), dark: n(800) },
    input: { light: n(200), dark: n(800) },
    ring: brand,
    sidebar: { light: n(50), dark: n(900) },
    'sidebar-foreground': { light: n(950), dark: n(50) },
    'sidebar-primary': brand,
    'sidebar-primary-foreground': onDark,
    'sidebar-accent': { light: n(100), dark: n(800) },
    'sidebar-accent-foreground': { light: n(900), dark: n(50) },
    'sidebar-border': { light: n(200), dark: n(800) },
    'sidebar-ring': brand,
    'chart-1': { light: b(500), dark: b(400) },
    'chart-2': { light: p('success', 500), dark: p('success', 400) },
    'chart-3': { light: p('warning', 500), dark: p('warning', 400) },
    'chart-4': { light: p('danger', 500), dark: p('danger', 400) },
    'chart-5': { light: p('info', 500), dark: p('info', 400) },
    'muted-subtle': { light: n(50), dark: n(900) },
    ...tints(),
    'primary-pressed': { light: b(shift(anchor, 1)), dark: b(shift(darkStep(anchor), -1)) },
    'secondary-pressed': { light: n(200), dark: n(700) },
  };
}

function shift(step, by) {
  return STEPS[Math.min(STEPS.length - 1, Math.max(0, STEPS.indexOf(step) + by))];
}

/**
 * The colours a recipe's styles add (button, field), from the base colours after their contrast fix, so a moved
 * primary moves the button with it. Field edges that are the field's only boundary (filled, underline) are a
 * mid neutral, which the gate holds to 3:1 (contrast.mjs).
 */
export function styleColors({ button, field }, anchor, colors) {
  const dark = darkStep(anchor);
  const buttons = {
    solid: { button: colors.primary, 'button-foreground': colors['primary-foreground'], 'button-edge': colors.primary },
    soft: { button: { light: b(100), dark: b(900) }, 'button-foreground': { light: b(700), dark: b(200) }, 'button-edge': { light: b(100), dark: b(900) } },
    outline: { button: colors.background, 'button-foreground': colors.primary, 'button-edge': colors.primary },
    raised: { button: colors.primary, 'button-foreground': colors['primary-foreground'], 'button-edge': { light: b(shift(anchor, 2)), dark: b(shift(dark, 2)) } },
  };
  const fields = {
    outline: { field: colors.input, 'field-edge': colors.input },
    filled: { field: colors.muted, 'field-edge': { light: n(500), dark: n(400) } },
    underline: { field: colors.background, 'field-edge': { light: n(500), dark: n(500) } },
  };
  return { ...buttons[button], ...fields[field] };
}

/** Tokens that share the brand step; when the fixer moves `primary`, these move with it. */
export const BRAND_LINKED = ['ring', 'sidebar-primary', 'sidebar-ring'];

/** The neutral steps a foreground can flip between. */
export const FOREGROUND_CHOICES = [n(0), n(950)];
