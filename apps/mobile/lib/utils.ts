import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/** The text styles' keys (Text's variants): text-type-h1, leading-type-h1, tracking-type-h1, font-type-h1. */
const TEXT_STYLES = ['h1', 'h2', 'h3', 'h4', 'lead', 'p', 'large', 'small', 'muted', 'code', 'blockquote'].map((s) => `type-${s}`);
/** The components' own keys (Button, Chip, Badge, Input): text-type-button, rounded-button, h-button-md, px-button-x… */
const COMPONENT_TEXT = ['button', 'chip', 'badge', 'field'].map((p) => `type-${p}`);
const BUTTON_VARIANTS = ['primary', 'secondary', 'outline', 'ghost', 'destructive'];

/**
 * tailwind-merge, told about the theme's own keys (tailwind.config.js). Without them it reads `border-field-w`
 * as a border colour and drops `border-field-edge`, the real one, and `text-type-h1` as a colour that
 * `text-muted-foreground` replaces.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: [...TEXT_STYLES, ...COMPONENT_TEXT] }],
      leading: [{ leading: [...TEXT_STYLES, ...COMPONENT_TEXT] }],
      tracking: [{ tracking: [...TEXT_STYLES, ...COMPONENT_TEXT] }],
      'font-weight': [{ font: TEXT_STYLES }],
      'border-w': [{ border: ['button-w', 'field-w', ...BUTTON_VARIANTS.map((v) => `button-${v}-w`)] }],
      'border-w-b': [{ 'border-b': ['button-edge-w', 'field-edge-w', ...BUTTON_VARIANTS.map((v) => `button-${v}-edge-w`)] }],
      rounded: [{ rounded: ['button', 'chip', 'badge', 'control'] }],
      'rounded-t': [{ 'rounded-t': ['field'] }],
      'rounded-b': [{ 'rounded-b': ['field-b'] }],
      h: [{ h: ['button-sm', 'button-md', 'button-lg', 'chip-md', 'field-sm', 'field-md', 'field-lg', 'control', 'control-sm', 'control-lg'] }],
      w: [{ w: ['button-md'] }],
      px: [{ px: ['field-x', 'control-x', 'button-x', 'button-x-sm', 'button-x-lg', 'chip-x', 'badge-x'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
