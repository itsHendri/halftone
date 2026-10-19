/** Halftone ⇄ shadcn: the preset codec, the recipe mapping and the registry items (lib/theme/shadcn.mjs). */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  contrastPairs,
  DEFAULT_RECIPE,
  decodeShadcnPreset,
  encodeShadcnPreset,
  generateTheme,
  isShadcnPresetCode,
  normalizeRecipe,
  recipeFromShadcn,
  shadcnFont,
  shadcnTheme,
} from '../lib/theme/index.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const base = JSON.parse(readFileSync(join(here, 'fixtures/tokens.json'), 'utf8'));

const THEMES = ['neutral', 'stone', 'zinc', 'gray', 'amber', 'blue', 'cyan', 'emerald', 'fuchsia', 'green', 'indigo', 'lime', 'orange', 'pink', 'purple', 'red', 'rose', 'sky', 'teal', 'violet', 'yellow', 'mauve', 'olive', 'mist', 'taupe'];
const BASES = ['neutral', 'stone', 'zinc', 'gray', 'mauve', 'olive', 'mist', 'taupe'];
const FONTS = ['inter', 'noto-sans', 'nunito-sans', 'figtree', 'roboto', 'raleway', 'dm-sans', 'public-sans', 'outfit', 'jetbrains-mono', 'geist', 'geist-mono', 'lora', 'merriweather', 'playfair-display', 'noto-serif', 'roboto-slab', 'oxanium', 'manrope', 'space-grotesk', 'montserrat', 'ibm-plex-sans', 'source-sans-3', 'instrument-sans', 'eb-garamond', 'instrument-serif'];

test('decodes the changelog example the way shadcn does', () => {
  assert.deepEqual(decodeShadcnPreset('b5owWMfJ8l'), {
    version: 'b',
    menuColor: 'inverted-translucent',
    menuAccent: 'subtle',
    radius: 'large',
    font: 'inter',
    iconLibrary: 'hugeicons',
    theme: 'mauve',
    baseColor: 'mauve',
    style: 'mira',
    chartColor: 'amber',
    fontHeading: 'oxanium',
  });
  assert.equal(encodeShadcnPreset(decodeShadcnPreset('b5owWMfJ8l')), 'b5owWMfJ8l');
});

test('a v1 code has no heading font and takes its chart colour from the theme', () => {
  const v1 = 'a' + encodeShadcnPreset({ theme: 'stone', baseColor: 'stone' }).slice(1);
  const p = decodeShadcnPreset(v1);
  assert.equal(p.version, 'a');
  assert.equal(p.fontHeading, 'inherit');
  assert.equal(p.chartColor, 'lime');
});

test('anything else is not a shadcn code', () => {
  for (const s of ['ht1-29B3XC60003T', 'xyz', 'b', 'b12345678901', 'b5ow-WMfJ8', '', null]) {
    assert.equal(decodeShadcnPreset(s), null, String(s));
  }
  assert.equal(isShadcnPresetCode('b5owWMfJ8l'), true);
  // A Halftone preset name can look like a code; the CLI checks presets first.
  assert.equal(isShadcnPresetCode('bold'), true);
});

test('maps a coloured theme to its Tailwind 600 and keeps the grey', () => {
  const { recipe, notes } = recipeFromShadcn(decodeShadcnPreset(encodeShadcnPreset({ theme: 'blue', baseColor: 'neutral', chartColor: 'blue' })));
  assert.equal(recipe.brand, '#2563eb');
  assert.equal(recipe.neutral, 'neutral');
  assert.equal(recipe.radius, 'lg');
  assert.deepEqual(recipe.font, { heading: 'inter', body: 'inter', mono: 'system-mono' });
  assert.deepEqual(notes, []);
});

test('a monochrome theme gets its grey 900; shadcn-only greys map to the nearest, with a note', () => {
  const zinc = recipeFromShadcn(decodeShadcnPreset(encodeShadcnPreset({ theme: 'zinc', baseColor: 'zinc', chartColor: 'zinc' })));
  assert.equal(zinc.recipe.brand, '#18181b');
  const mist = recipeFromShadcn(decodeShadcnPreset(encodeShadcnPreset({ theme: 'mist', baseColor: 'mist', chartColor: 'mist' })));
  assert.equal(mist.recipe.neutral, 'slate');
  assert.equal(mist.recipe.brand, '#0f172a');
  assert.match(mist.notes[0], /no mist grey, so it uses slate/);
});

test('radius, fonts and the rest are approximated with a note each', () => {
  const { recipe, notes } = recipeFromShadcn(decodeShadcnPreset('b5owWMfJ8l'));
  assert.equal(recipe.radius, 'xl');
  assert.equal(recipe.font.heading, 'space-grotesk');
  const text = notes.join('\n');
  for (const want of [/Radius large/, /Oxanium/, /Hugeicons/, /Chart colour amber/, /Menu colour/, /Style Mira/]) assert.match(text, want);
});

test('a mono body font takes the mono role too', () => {
  const { recipe } = recipeFromShadcn(decodeShadcnPreset(encodeShadcnPreset({ theme: 'teal', baseColor: 'zinc', font: 'jetbrains-mono' })));
  assert.equal(recipe.font.body, 'jetbrains-mono');
  assert.equal(recipe.font.mono, 'jetbrains-mono');
});

test('every theme, grey and font maps to a recipe that generates and passes AA', () => {
  let i = 0;
  for (const theme of THEMES) {
    for (const baseColor of BASES) {
      const font = FONTS[i % FONTS.length];
      const fontHeading = i % 3 ? 'inherit' : FONTS[(i * 7) % FONTS.length];
      i++;
      const { recipe } = recipeFromShadcn(decodeShadcnPreset(encodeShadcnPreset({ theme, baseColor, font, fontHeading, radius: ['default', 'none', 'small', 'medium', 'large'][i % 5] })));
      assert.deepEqual(normalizeRecipe(recipe), recipe, `${theme}/${baseColor}`);
      const t = generateTheme(recipe, base);
      for (const mode of ['light', 'dark']) {
        const pairs = contrastPairs(t.resolved[mode], mode, { strict: true });
        assert.ok(pairs.length > 20);
        const failing = pairs.filter((p) => p.ratio < p.threshold);
        assert.deepEqual(failing.map((p) => p.label), [], `${theme}/${baseColor} ${mode}`);
      }
    }
  }
});

test('a registry:theme item carries every colour, the radius, shadows and its fonts', () => {
  const theme = generateTheme(normalizeRecipe({ ...DEFAULT_RECIPE, font: { heading: 'fraunces', body: 'inter', mono: 'ibm-plex-mono' } }), base);
  const item = shadcnTheme(theme, { fontsUrl: 'https://example.com/r/' });
  assert.equal(item.type, 'registry:theme');
  assert.equal(item.name, `halftone-${theme.code}`);
  // Every shadcn colour; the button and field styles are Halftone's own and stay behind.
  const colours = Object.keys(theme.resolved.light).filter((c) => !/^(button|field)(-|$)/.test(c));
  assert.ok(colours.length >= 37);
  assert.equal(item.cssVars.light.button, undefined);
  for (const c of colours) {
    assert.match(item.cssVars.light[c], /^oklch\(/, c);
    assert.match(item.cssVars.dark[c], /^oklch\(/, c);
  }
  assert.match(item.cssVars.light.radius, /rem$/);
  assert.ok(item.cssVars.light['shadow-1'] && item.cssVars.dark['shadow-3']);
  assert.equal(item.cssVars.theme['radius-lg'], 'var(--radius)');
  assert.equal(item.cssVars.theme['shadow-md'], 'var(--shadow-2)');
  assert.deepEqual(item.registryDependencies, [
    'https://example.com/r/font/inter.json',
    'https://example.com/r/font/heading-fraunces.json',
    'https://example.com/r/font/mono-ibm-plex-mono.json',
  ]);
});

test('system fonts have no font item and no dependency', () => {
  const item = shadcnTheme(generateTheme(DEFAULT_RECIPE, base));
  assert.equal(item.registryDependencies, undefined);
  assert.equal(shadcnFont('system'), null);
});

test('font items name their fontsource package and variable', () => {
  assert.deepEqual(shadcnFont('inter').font, {
    family: "'Inter Variable', sans-serif",
    provider: 'google',
    import: 'Inter',
    variable: '--font-sans',
    subsets: ['latin'],
    dependency: '@fontsource-variable/inter',
  });
  assert.equal(shadcnFont('source-serif-4', 'heading').font.import, 'Source_Serif_4');
  assert.equal(shadcnFont('source-serif-4', 'heading').font.variable, '--font-heading');
  assert.equal(shadcnFont('ibm-plex-mono', 'mono').font.dependency, '@fontsource/ibm-plex-mono');
  // On code only: shadcn applies a font to html unless it has a selector.
  assert.equal(shadcnFont('ibm-plex-mono', 'mono').font.selector, 'code, kbd, pre, samp');
  assert.equal(shadcnFont('inter').font.selector, undefined);
  assert.equal(shadcnFont('fraunces', 'heading').font.selector, 'h1, h2, h3, h4, h5, h6');
});
