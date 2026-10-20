/**
 * Input for push-figma.mjs: semantic colours per mode, the numeric scales with their class names (so
 * Figma Variables carry `var(--primary)` / `p-4` code syntax), the theme's fonts as strings, and its
 * shadows for reference (Figma effect styles can't be written through the Variables API).
 *   options: { out: 'tokens/generated/figma-theme.mjs' }
 */
import { group } from '../lib/resolve.mjs';
import { themeFonts } from './fonts.mjs';

export default function figma(ctx, options) {
  const colors = Object.fromEntries(ctx.colors.map((c) => [c.name, { light: c.light, dark: c.dark }]));
  const num = (prefix, code) =>
    Object.fromEntries(
      group(ctx.prim, prefix)
        .filter((t) => typeof t.value === 'number')
        .map((t) => [t.key, { value: t.value, code: code(t.key) }])
    );
  // The theme's radius: rounded-* scale with its base (rounded-lg); rounded-control is buttons and chips.
  const radius = Object.fromEntries(ctx.radius.steps.map((s) => [s.name, { value: s.px, code: `rounded-${s.name}` }]));
  radius.control = { value: Math.min(ctx.shape.control, 9999), code: 'rounded-control' };
  radius.full = { value: 9999, code: 'rounded-full' };
  const numbers = {
    radius,
    space: num(['space'], (k) => `p-${k}`),
    'font-size': num(['font', 'size'], (k) => `text-${k}`),
    border: { width: { value: ctx.shape.borderWidth, code: 'border' } },
    icon: { stroke: { value: ctx.shape.stroke, code: 'strokeWidth' } },
  };
  const fonts = themeFonts(ctx);
  const strings = {
    font: {
      heading: { value: fonts.heading?.family ?? 'System', code: 'font-heading' },
      body: { value: fonts.body?.family ?? 'System', code: 'font-sans' },
    },
  };
  const contents =
    `// ${ctx.header}\nexport const COLORS = ${JSON.stringify(colors, null, 2)};\nexport const NUMBERS = ${JSON.stringify(numbers, null, 2)};\n` +
    `export const STRINGS = ${JSON.stringify(strings, null, 2)};\n` +
    `/** shadow-sm / -md / -lg as CSS, per mode: make them effect styles by hand (not in the Variables API). */\nexport const SHADOWS = ${JSON.stringify(ctx.shape.shadows, null, 2)};\n`;
  return [{ path: options.out, contents }];
}
