/**
 * The theme as shadcn registry `cssVars`, for the `registry:theme` items: `native` in the NativeWind 4 /
 * Tailwind 3 shape (HSL triplets + tailwind config extension), `web` in the Tailwind 4 shape (oklch).
 *   options: { out: 'tokens/generated/theme.registry.json' }
 */
import { hexToHslTriplet, hexToOklch } from '../lib/color.mjs';
import { radiusCss } from '../lib/resolve.mjs';

export default function registryTheme(ctx, options) {
  const radius = `${ctx.radius.base / 16}rem`;
  const vars = (convert, mode) => Object.fromEntries(ctx.colors.map((c) => [c.name, convert(c[mode])]));
  const theme = {
    native: {
      cssVars: {
        light: { radius, ...vars(hexToHslTriplet, 'light') },
        dark: vars(hexToHslTriplet, 'dark'),
      },
      tailwind: {
        config: {
          theme: {
            extend: {
              colors: Object.fromEntries(ctx.colors.map((c) => [c.name, `hsl(var(--${c.name}))`])),
              borderRadius: Object.fromEntries(ctx.radius.steps.map((s) => [s.name, radiusCss(s)])),
            },
          },
        },
      },
    },
    web: {
      cssVars: {
        theme: Object.fromEntries(ctx.radius.steps.map((s) => [`radius-${s.name}`, radiusCss(s)])),
        light: { radius, ...vars(hexToOklch, 'light') },
        dark: vars(hexToOklch, 'dark'),
      },
    },
  };
  return [{ path: options.out, contents: JSON.stringify(theme, null, 2) + '\n' }];
}
