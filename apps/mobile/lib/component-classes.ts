/**
 * What the component layer (TOKENS.components) picks in JS rather than through a variable: a label's weight (a
 * custom font is one family per weight, which Text's useFontStyle reads from the font-* class), its case, and a
 * shadow (the kit's shadows are fixed values, not variables). The web export draws the same classes.
 */

/** A weight as the font-* class Text reads. */
export const WEIGHT_CLASS: Record<number, string> = { 400: 'font-normal', 500: 'font-medium', 600: 'font-semibold', 700: 'font-bold' };

/** A label's weight and case: the component's own until a system sets them. */
export const labelClass = (text: { weight: number; case: string }) => [WEIGHT_CLASS[text.weight] ?? 'font-medium', text.case === 'uppercase' ? 'uppercase' : ''].join(' ');

/** A shadow level (the theme's shadow-sm / md / lg), or `fallback` (the kit's own) while the system sets none. */
export const shadowClass = (shadow: 'none' | '1' | '2' | '3' | null, fallback: string) =>
  shadow === null ? fallback : { none: 'shadow-none', '1': 'shadow-sm', '2': 'shadow-md', '3': 'shadow-lg' }[shadow];
