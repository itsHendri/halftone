import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge, told about the theme's own keys (tailwind.config.js). Without them it reads `border-field-w`
 * as a border colour and drops `border-field-edge`, the real one.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
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
