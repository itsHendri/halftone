import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/** The text styles' keys (Text's variants): text-type-h1, leading-type-h1, tracking-type-h1, font-type-h1. */
const TEXT_STYLES = ['h1', 'h2', 'h3', 'h4', 'lead', 'p', 'large', 'small', 'muted', 'code', 'blockquote'].map((s) => `type-${s}`);

/**
 * tailwind-merge, told about the theme's own keys (tailwind.config.js). Without them it reads `border-field-w`
 * as a border colour and drops `border-field-edge`, the real one, and `text-type-h1` as a colour that
 * `text-muted-foreground` replaces.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: TEXT_STYLES }],
      leading: [{ leading: TEXT_STYLES }],
      tracking: [{ tracking: TEXT_STYLES }],
      'font-weight': [{ font: TEXT_STYLES }],
      'border-w': [{ border: ['button-w', 'field-w'] }],
      'border-w-b': [{ 'border-b': ['button-edge-w', 'field-edge-w'] }],
      'rounded-t': [{ 'rounded-t': ['field'] }],
      'rounded-b': [{ 'rounded-b': ['field-b'] }],
      px: [{ px: ['field-x', 'control-x'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
