/**
 * The theme's fonts (primitive.font.family.heading / body / mono), as code that loads them:
 *   options: { platform: 'expo', out: 'lib/fonts.ts' }   @expo-google-fonts imports, one per weight, and
 *            the family name expo-font registers for each role and weight (FONT_FAMILY)
 *   options: { platform: 'next', out: 'app/fonts.ts' }   next/font/google, exposing --kit-font-heading,
 *            --kit-font-body and --kit-font-mono (app/tokens.css maps them to font-heading / font-sans / font-mono)
 *   options: { platform: 'web', out: 'src/fonts.css' }   any other web app: a Google Fonts @import and the same
 *            --kit-font-* variables. Import it FIRST in the app's stylesheet (before tailwindcss): a CSS @import of
 *            a URL only works at the very top, and the build hoists it there from the first imported file.
 * An empty family (heading, body) or Menlo (mono) is the platform's own font: nothing to load.
 *
 * A curated font (lib/theme/fonts.mjs) loads the weights it lists; any other Google Fonts family (a system's
 * fonts) loads 400–700 under the packages' own naming (fontByFamily). halftone-tokens theme apply installs the
 * @expo-google-fonts packages they need (see expoPackages).
 */
import { fontByFamily } from '../lib/theme/fonts.mjs';
import { group } from '../lib/resolve.mjs';

const SUFFIX = { 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold' };

/** The theme's fonts: { heading, body, mono }, each a FONTS entry or null (the platform's font). */
export function themeFonts(ctx) {
  const families = Object.fromEntries(group(ctx.prim, ['font', 'family']).map(({ key, value }) => [key, value]));
  const pick = (role) => {
    const family = families[role];
    if (!family) return null;
    const font = fontByFamily(family);
    return font.system ? null : font;
  };
  return { heading: pick('heading'), body: pick('body'), mono: pick('mono') };
}

/** The npm packages an Expo app needs for these fonts. */
export const expoPackages = (fonts) => [...new Set(Object.values(fonts).filter(Boolean).map((f) => `@expo-google-fonts/${f.id}`))];

function expo(ctx, fonts) {
  const used = [...new Map(Object.values(fonts).filter(Boolean).map((f) => [f.id, f])).values()];
  const name = (f, w) => `${f.expoPrefix}_${w}${SUFFIX[w]}`;
  const imports = used.flatMap((f) => f.weights.map((w) => `import { ${name(f, w)} } from '@expo-google-fonts/${f.id}/${w}${SUFFIX[w]}';`));
  const assets = used.flatMap((f) => f.weights.map((w) => name(f, w)));
  const family = (f) => (f ? `{ ${f.weights.map((w) => `${w}: '${name(f, w)}'`).join(', ')} }` : 'null');
  return `// ${ctx.header}
${imports.join('\n')}${imports.length ? '\n' : ''}
/** Font files for useFonts from expo-font (app/_layout.tsx). Empty when the theme uses the system font. */
export const FONT_ASSETS = ${assets.length ? `{ ${assets.join(', ')} }` : '{}'};

/**
 * The family expo-font registers for each role and weight (null: the system font). Android does not pick a
 * weight of a custom font from fontWeight, so components/ui/text.tsx sets the family per weight.
 */
export const FONT_FAMILY: Record<'heading' | 'body' | 'mono', Record<number, string> | null> = {
  heading: ${family(fonts.heading)},
  body: ${family(fonts.body)},
  mono: ${family(fonts.mono)},
};
`;
}

const nextName = (f) => f.family.replace(/ /g, '_');

function next(ctx, fonts) {
  const { heading, body, mono } = fonts;
  if (!heading && !body && !mono) {
    return `// ${ctx.header}
/** The theme uses the system fonts: no font variables (app/tokens.css falls back to the system stacks). */
export const fontVariables = '';
`;
  }
  const roles = [];
  if (body) roles.push(['body', body]);
  // The same family for both roles loads once; --kit-font-heading falls back to the body font.
  if (heading && heading.id !== body?.id) roles.push(['heading', heading]);
  if (mono) roles.push(['mono', mono]);
  const loaders = [...new Set(roles.map(([, f]) => nextName(f)))];
  return `// ${ctx.header}
import { ${loaders.join(', ')} } from 'next/font/google';

${roles
  .map(
    ([role, f]) =>
      `const ${role} = ${nextName(f)}({ subsets: ['latin'], weight: [${f.weights.map((w) => `'${w}'`).join(', ')}], variable: '--kit-font-${role}', display: 'swap' });`
  )
  .join('\n')}

/** Put on <html>: defines --kit-font-${roles.map(([r]) => r).join(' and --kit-font-')}, which app/tokens.css maps to font-sans, font-heading and font-mono. */
export const fontVariables = [${roles.map(([role]) => `${role}.variable`).join(', ')}].join(' ');
`;
}

const FALLBACK = { serif: 'serif', mono: 'monospace' };

function web(ctx, fonts) {
  const roles = [];
  if (fonts.body) roles.push(['body', fonts.body]);
  if (fonts.heading && fonts.heading.id !== fonts.body?.id) roles.push(['heading', fonts.heading]);
  if (fonts.mono) roles.push(['mono', fonts.mono]);
  if (!roles.length) return `/* ${ctx.header} */\n/* The theme uses the system fonts: nothing to load (tokens.css falls back to the system stacks). */\n`;
  const families = [...new Map(roles.map(([, f]) => [f.id, f])).values()].map((f) => `family=${f.family.replace(/ /g, '+')}:wght@${f.weights.join(';')}`);
  const stack = (role, f) => `'${f.family}', ${FALLBACK[role === 'mono' ? 'mono' : f.category] ?? 'sans-serif'}`;
  return `/* ${ctx.header} */
/* Import this file first in the app's stylesheet, before tailwindcss: a URL @import only works at the top. */
@import url('https://fonts.googleapis.com/css2?${families.join('&')}&display=swap');

:root {
${roles.map(([role, f]) => `  --kit-font-${role}: ${stack(role, f)};`).join('\n')}
}
`;
}

const PLATFORMS = { expo, next, web };

export default function fontsTarget(ctx, options) {
  const fonts = themeFonts(ctx);
  const platform = PLATFORMS[options.platform ?? 'expo'];
  if (!platform) throw new Error(`fonts: unknown platform "${options.platform}" (expo, next or web)`);
  const contents = platform(ctx, fonts);
  return [{ path: options.out, contents }];
}
