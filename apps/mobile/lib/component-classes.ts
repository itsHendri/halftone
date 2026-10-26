import { TOKENS } from '@/lib/theme';
import { useKitTheme } from '@/lib/theme-context';
import { Platform } from 'react-native';

/**
 * What the component layer (TOKENS.components) picks in JS rather than through a variable: a label's weight (a
 * custom font is one family per weight, which Text's useFontStyle reads from the font-* class), its case, and a
 * shadow (the kit's shadows are fixed values, not variables). The web export draws the same classes.
 */

/** A weight as the font-* class Text reads. */
export const WEIGHT_CLASS: Record<number, string> = { 400: 'font-normal', 500: 'font-medium', 600: 'font-semibold', 700: 'font-bold' };

/** A label's weight and case: the component's own until a system sets them. `live`: a live theme's, which must also
 *  undo a committed uppercase. */
export const labelClass = (text: { weight?: number; case?: string }, live = false) =>
  [text.weight ? (WEIGHT_CLASS[text.weight] ?? 'font-medium') : '', text.case === 'uppercase' ? 'uppercase' : live && text.case ? 'normal-case' : ''].join(' ').trim();

export type ShadowLevel = 'none' | '1' | '2' | '3';
/** A shadow level as the theme's shadow class (shadow-sm / md / lg; a live theme remaps them, lib/embed-theme.ts). */
export const shadowClass = (level: ShadowLevel) => ({ none: 'shadow-none', '1': 'shadow-sm', '2': 'shadow-md', '3': 'shadow-lg' })[level];

/**
 * A field's shadow on native: React Native's boxShadow, which draws outside the box whatever its fill. The shadow-*
 * classes set iOS's shadow props, which follow a see-through view's content, so a boxed field showed none. On the
 * web the class does it (`fieldShadowClass`).
 */
export function useFieldShadow(level: ShadowLevel) {
  const { scheme } = useKitTheme();
  if (Platform.OS === 'web' || level === 'none') return undefined;
  return { boxShadow: TOKENS.shadows[scheme][level] };
}
export const fieldShadowClass = (level: ShadowLevel) => (Platform.OS === 'web' ? shadowClass(level) : '');
