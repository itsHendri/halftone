// npm test -w packages/tokens — the component layer: Button, Chip, Badge and Input (semantic.component.*).
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { blend } from '../lib/color.mjs';
import { componentPairs, componentVarNames, COMPONENTS, fittedLeading } from '../lib/theme/components.mjs';
import { loadTokens } from '../lib/resolve.mjs';
import {
  applySystem,
  DEFAULT_RECIPE,
  generateSystem,
  generateTheme,
  hasOverrides,
  migrate,
  normalizeSystem,
  systemCode,
  systemOverrides,
  themeVars,
  validateSystem,
} from '../lib/theme/index.mjs';
import nativewind3 from '../targets/nativewind3.mjs';
import shadcnWeb from '../targets/shadcn-web.mjs';
import tsTheme from '../targets/ts-theme.mjs';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = JSON.parse(readFileSync(join(pkg, 'test/fixtures/halftone-tokens.json'), 'utf8'));
const FIXED = { id: 'test', updatedAt: '2026-10-22T12:00:00.000Z' };
const sys = (parts = {}, recipe = DEFAULT_RECIPE) => ({ ...migrate(recipe, undefined, FIXED), ...parts });
const theme = generateTheme(DEFAULT_RECIPE, base);

/** Write tokens to a temp file and load them as the build does. */
async function built(tokens) {
  const dir = mkdtempSync(join(tmpdir(), 'halftone-components-'));
  try {
    const path = join(dir, 'tokens.json');
    writeFileSync(path, JSON.stringify(tokens));
    const ctx = await loadTokens(path);
    ctx.header = 'test';
    return ctx;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('the defaults are what the mobile kit drew: density heights, pill corners, Body and Small text', () => {
  const { button, chip, badge, input } = theme.components;
  assert.deepEqual([button.radius, button.h, button.x], [9999, { sm: 40, md: 48, lg: 56 }, { sm: 16, md: 20, lg: 24 }]);
  // text-base (16 on 24) and text-sm (14 on 20), the kits' own weights kept by the components.
  assert.deepEqual(button.text, { style: 'p', font: 'body', size: 16, leading: 24, tracking: 0, weight: 500, case: 'none' });
  assert.deepEqual([chip.radius, chip.h, chip.x, chip.text.size, chip.text.leading], [9999, { sm: 32, md: 36, lg: 40 }, { md: 14 }, 14, 20]);
  // A badge is as tall as its text, padding (2 + 2; none at S) and border.
  assert.deepEqual([badge.radius, badge.h, badge.x, badge.text.size, badge.text.leading], [9999, { sm: 22, md: 26 }, { md: 8 }, 14, 20]);
  // What every variant shares: the kits' gaps (Button S tighter), the theme's border, kit icons and shadows, a 3px ring.
  assert.deepEqual([button.gap, chip.gap, badge.gap, input.gap], [{ sm: 6, md: 8, lg: 8 }, { md: 6 }, { md: 4 }, undefined]);
  assert.deepEqual([button.border, chip.borderWidth, badge.borderWidth, input.borderWidth, input.edgeWidth], [null, 1, 1, 1, 1]);
  assert.deepEqual([button.icon, chip.icon, badge.icon, button.shadow, input.shadow], [null, 14, null, null, null]);
  assert.deepEqual([button.ring, input.ring], [{ width: 3, role: null }, { width: 3, role: null }]);
  assert.deepEqual([button.focusBorder.role, input.placeholder.role, input.text.weight], ['ring', 'muted-foreground', 400]);
  // Button rings: the ring role at 50%, Destructive its own at 20% (40% in dark).
  assert.deepEqual([button.variants.primary.ring.role, button.variants.primary.ring.alpha.light], ['ring', 0.5]);
  assert.deepEqual([button.variants.destructive.ring.role, button.variants.destructive.ring.alpha.dark], ['destructive', 0.4]);
  // Input's focus and error states take the default state's fill and text until set.
  assert.deepEqual([input.variants.focus.fill.light, input.variants.error.label.light], [input.variants.default.fill.light, input.variants.default.label.light]);
  // Input: rounded-md (8 at the default radius), density's height, a 16px inset.
  assert.deepEqual([input.radius, input.radiusBottom, input.h, input.x], [8, 8, { sm: 32, md: 48, lg: 56 }, { md: 16 }]);
  // The colours are roles: the button style's for Primary, the inverted chip, the field style's fill.
  const role = (c) => [c.role, c.light, c.dark, c.alpha.light, c.alpha.dark];
  assert.deepEqual(role(button.variants.primary.fill), ['button', theme.resolved.light.button, theme.resolved.dark.button, 1, 1]);
  assert.deepEqual(role(button.variants.outline.fill), ['background', theme.resolved.light.background, theme.resolved.dark.input, 1, 0.3]);
  assert.deepEqual(role(button.variants.secondary.pressed), ['secondary', theme.resolved.light.secondary, theme.resolved.dark.secondary, 0.8, 0.8]);
  assert.deepEqual(role(chip.variants.selected.fill), ['foreground', theme.resolved.light.foreground, theme.resolved.dark.foreground, 1, 1]);
  assert.deepEqual(role(chip.variants.selected.label), ['background', theme.resolved.light.background, theme.resolved.dark.background, 1, 1]);
  assert.deepEqual(role(input.variants.default.fill), ['field', theme.resolved.light.field, theme.resolved.dark.field, 0, 0.3]);
  assert.deepEqual(role(input.variants.focus.ring), ['ring', theme.resolved.light.ring, theme.resolved.dark.ring, 0.5, 0.5]);
  // Borders: none is clear (the fill's colour at no opacity); a Button without one has no width.
  assert.deepEqual([badge.variants.default.border.light, badge.variants.default.border.alpha.light], [badge.variants.default.fill.light, 0]);
  assert.deepEqual([button.variants.primary.borderWidth, button.variants.outline.borderWidth, button.variants.ghost.borderWidth], [0, 1, 0]);
});

test('the layer follows the recipe: density, controls, the button and field styles, the typeset', () => {
  const t = generateTheme({ ...DEFAULT_RECIPE, density: 'compact', controls: 'match', button: 'raised', field: 'underline', size: '14' }, base);
  const { button, chip, input } = t.components;
  assert.deepEqual(button.h, { sm: 36, md: 44, lg: 52 });
  assert.equal(button.corner, 'lg');
  assert.equal(button.radius, t.radius);
  assert.equal(chip.radius, t.radius);
  assert.deepEqual([button.variants.primary.borderWidth, button.variants.primary.edgeWidth], [0, 3]);
  assert.deepEqual([input.radius, input.radiusBottom, input.x.md], [0, 0, 0]);
  // A 14px typeset: Body is 14 on 21 (text-base scaled), as the kits' text-base was.
  assert.deepEqual([button.text.size, button.text.leading], [14, 21]);
  assert.equal(fittedLeading('small'), 20 / 14);
});

test('components in a document: validated per component, Button and Input styles fold into the recipe', () => {
  const doc = normalizeSystem(
    sys({
      components: {
        button: { style: 'soft', radius: 'md', size: { md: 44, x: 18 }, text: 'large', variants: { secondary: { fill: 'muted', border: 'border' } } },
        chip: { style: 'outline', variants: { selected: { fill: 'primary', label: 'primary-foreground' } } },
        badge: { style: 'square' },
        input: { style: 'filled', radius: 4, variants: { focus: { border: 'primary' } } },
      },
    })
  );
  assert.equal(doc.recipe.button, 'soft');
  assert.equal(doc.recipe.field, 'filled');
  // A chip's default style is no override.
  assert.deepEqual(doc.components.chip, { variants: { selected: { fill: 'primary', label: 'primary-foreground' } } });
  assert.deepEqual(doc.components.badge, { style: 'square' });
  assert.deepEqual(doc.components.input, { radius: 4, variants: { focus: { border: 'primary' } } });
  assert.deepEqual(
    systemOverrides(doc).filter((p) => p.startsWith('components.')),
    [
      'components.button.radius',
      'components.button.text',
      'components.button.size.md',
      'components.button.size.x',
      'components.button.variants.secondary.fill',
      'components.button.variants.secondary.border',
      'components.chip.variants.selected.fill',
      'components.chip.variants.selected.label',
      'components.badge.style',
      'components.input.radius',
      'components.input.variants.focus.border',
    ]
  );
  // A style alone keeps a theme code; a component edit is a system.
  const styled = normalizeSystem(sys({ components: { button: { style: 'outline' } } }));
  assert.deepEqual(styled.components, {});
  assert.equal(hasOverrides(styled), false);
  assert.ok(systemCode(styled));
  assert.equal(systemCode(doc), null);

  const { errors } = validateSystem(
    sys({
      components: {
        tag: {},
        chip: { style: 'pill', size: { lg: 40 }, variants: { hover: {}, selected: { fill: 'brand-ish', label: 'none' } } },
        badge: { size: { lg: 40 }, shadow: '2', ring: { width: 2 } },
        input: { variants: { focus: { pressed: 'primary' } }, radius: 'huge', text: 'h7', weight: 500, ring: { role: 'brand-ish', size: 2 }, border: 12 },
        button: { weight: 450, case: 'lower', icon: 4, shadow: 4, size: { gap: 30 } },
      },
    })
  );
  for (const path of [
    'components.tag',
    'components.chip.style',
    'components.chip.variants.hover',
    'components.chip.variants.selected.fill',
    'components.chip.variants.selected.label',
    'components.badge.size.lg',
    'components.badge.shadow',
    'components.badge.ring',
    'components.input.variants.focus.pressed',
    'components.input.radius',
    'components.input.text',
    'components.input.weight',
    'components.input.ring.role',
    'components.input.ring.size',
    'components.input.border',
    'components.button.weight',
    'components.button.case',
    'components.button.icon',
    'components.button.shadow',
    'components.button.size.gap',
  ]) {
    assert.ok(errors.some((e) => e.startsWith(`${path}:`)), `${path} in\n${errors.join('\n')}`);
  }
});

test('a system without component edits is the recipe theme; edits change only what they name', () => {
  assert.deepEqual(generateSystem(sys(), base), theme);
  const doc = sys({
    radius: { md: 6 },
    components: {
      button: { radius: 'md', size: { x: 18 }, text: 'large', variants: { secondary: { fill: 'muted', border: 'border' }, primary: { pressed: 'accent' } } },
      chip: { variants: { selected: { fill: 'primary', label: 'primary-foreground' } } },
      badge: { style: 'square' },
      input: { radius: 4, variants: { focus: { border: 'primary' } } },
    },
  });
  const t = generateSystem(doc, base);
  const { button, chip, badge, input } = t.components;
  assert.deepEqual([button.corner, button.radius], ['md', 6]);
  assert.deepEqual(button.x, { sm: 14, md: 18, lg: 22 });
  assert.equal(button.text.size, 18);
  assert.equal(button.text.leading, 28);
  // Secondary: the new fill, its pressed derived at 90%, a border that now has a width.
  const secondary = button.variants.secondary;
  assert.deepEqual([secondary.fill.role, secondary.fill.light, secondary.fill.edited], ['muted', t.resolved.light.muted, true]);
  assert.deepEqual([secondary.pressed.role, secondary.pressed.alpha.light, secondary.pressed.derived], ['muted', 0.9, true]);
  assert.deepEqual([secondary.border.role, secondary.borderWidth], ['border', t.borderWidth]);
  assert.deepEqual([button.variants.primary.pressed.role, button.variants.primary.pressed.alpha.light], ['accent', 1]);
  // Chip selected is a role now; its border (the fill by default) follows the fill.
  assert.deepEqual([chip.variants.selected.fill.light, chip.variants.selected.label.light], [t.resolved.light.primary, t.resolved.light['primary-foreground']]);
  assert.deepEqual([chip.variants.selected.border.role, chip.variants.selected.border.edited], ['primary', false]);
  assert.equal(chip.variants.unselected.fill.edited, false);
  // A square badge follows rounded-sm (the edited md doesn't touch it).
  assert.equal(badge.radius, t.components.badge.radius);
  assert.equal(badge.corner, 'sm');
  assert.deepEqual([input.radius, input.radiusBottom], [4, 4]);
  assert.deepEqual([input.variants.focus.border.light, input.variants.focus.ring.alpha.light], [t.resolved.light.primary, 0.5]);
  // Disabled follows the default state.
  assert.equal(input.variants.disabled.border.light, input.variants.default.border.light);
});

/** Every new property, set (Phase 6.1). */
const EVERYTHING = {
  button: { border: 2, size: { gap: 10, sm: 36 }, weight: 600, case: 'uppercase', icon: 20, shadow: '2', ring: { width: 2, role: 'primary' } },
  chip: { border: 0, size: { sm: 28, lg: 44, gap: 4 }, weight: 700, icon: 16 },
  badge: { border: 2, size: { sm: 20, md: 30, gap: 2 }, weight: 600, case: 'uppercase', icon: 10 },
  input: { style: 'filled', border: 3, shadow: 'none', ring: { width: 4, role: 'accent' }, placeholder: 'foreground', variants: { error: { fill: 'destructive', label: 'destructive-foreground' } } },
};

test('the open card’s properties: border, gap, weight, case, icon, shadow, focus ring, placeholder, S/M/L', () => {
  const doc = normalizeSystem(sys({ components: EVERYTHING }));
  assert.equal(doc.recipe.field, 'filled');
  assert.deepEqual(doc.components.button.ring, { width: 2, role: 'primary' });
  assert.ok(systemOverrides(doc).includes('components.button.ring.role'));
  assert.ok(systemOverrides(doc).includes('components.input.placeholder'));
  const { button, chip, badge, input } = generateSystem(doc, base).components;
  // Button: every drawn border is 2 (Ghost and Secondary have none), one gap, the label, the icon, shadow and ring.
  assert.deepEqual([button.variants.outline.borderWidth, button.variants.primary.borderWidth, button.variants.secondary.borderWidth], [2, 2, 0]);
  assert.deepEqual([button.h.sm, button.gap], [36, { sm: 10, md: 10, lg: 10 }]);
  assert.deepEqual([button.text.weight, button.text.case, button.icon, button.shadow, button.ring], [600, 'uppercase', 20, '2', { width: 2, role: 'primary' }]);
  assert.deepEqual([button.focusBorder.role, button.variants.destructive.ring.role, button.variants.ghost.ring.alpha.light], ['primary', 'primary', 0.5]);
  // Chip: S/M/L, no border, its own gap and icon.
  assert.deepEqual([chip.h, chip.borderWidth, chip.gap, chip.text.weight, chip.icon], [{ sm: 28, md: 36, lg: 44 }, 0, { md: 4 }, 700, 16]);
  // Badge: S and M set, a thicker border.
  assert.deepEqual([badge.h, badge.borderWidth, badge.gap, badge.text.case, badge.icon], [{ sm: 20, md: 30 }, 2, { md: 2 }, 'uppercase', 10]);
  // Input, filled: the border is its bottom line (a filled field has no box), no shadow, the ring and placeholder.
  assert.deepEqual([input.borderWidth, input.edgeWidth, input.shadow, input.ring], [0, 3, 'none', { width: 4, role: 'accent' }]);
  assert.deepEqual([input.placeholder.role, input.variants.focus.ring.role, input.variants.error.fill.role], ['foreground', 'accent', 'destructive']);
  // Nothing else moved.
  const plain = generateSystem(sys({ recipe: { ...DEFAULT_RECIPE, field: 'filled' } }), base).components;
  assert.deepEqual([button.radius, chip.x, badge.text, input.h], [plain.button.radius, plain.chip.x, { ...plain.badge.text, weight: 600, case: 'uppercase' }, plain.input.h]);
});

test('the build writes every component variable a live theme sends, with every property set', async () => {
  for (const components of [{}, EVERYTHING]) {
    const { tokens, theme: t } = applySystem(base, sys({ components }));
    const ctx = await built(tokens);
    for (const format of ['hsl', 'oklch']) {
      const live = themeVars(t, format);
      const contents = format === 'hsl' ? nativewind3(ctx, { css: 'global.css', tailwind: 'theme.js' })[0].contents : shadcnWeb(ctx, { out: 'web.css' })[0].contents;
      // The build's font variables add fallbacks (a live theme always sets --kit-font-*).
      const names = componentVarNames().filter((n) => live.light[n] !== undefined && !n.endsWith('-text-font'));
      assert.ok(names.length > 150, `${format}: ${names.length} variables`);
      for (const name of names) {
        const escaped = live.light[name].replace(/[.()*+?[\]\\|{}^$]/g, '\\$&');
        assert.match(contents, new RegExp(`${name}: ${escaped};`), `${format} ${name} (${Object.keys(components).length ? 'edited' : 'default'})`);
      }
      // Each variable the kits may draw is one an embedded kit accepts.
      for (const name of Object.keys(live.light).filter((n) => /^--(button|chip|badge|field)-/.test(n) && !/^--(button|field)-(alpha|border-w|edge-w|foreground|edge)$/.test(n))) {
        assert.ok(componentVarNames().includes(name), `${name} is in componentVarNames`);
      }
    }
  }
});

test('the tokens reach tokens.json and come back as the build reads them, in both kits', async () => {
  const doc = sys({ components: { chip: { variants: { selected: { fill: 'primary', label: 'primary-foreground' } } }, button: { size: { md: 52 } } } });
  const { tokens, theme: t } = applySystem(base, doc);
  assert.equal(tokens.semantic.component.chip.selected.fill.$value.light, '{semantic.color.primary}');
  assert.equal(tokens.semantic.component.chip.selected.fill.$type, 'color');
  assert.equal(tokens.semantic.component.button.height.md.$value, 52);
  assert.match(tokens.semantic.component.button.height.md.$description, /44/);
  // The button and field numbers moved into the layer.
  assert.equal(tokens.semantic.button, undefined);
  assert.equal(tokens.semantic.component.input['border-width'].$value, 1);
  const ctx = await built(tokens);
  for (const name of Object.keys(COMPONENTS)) {
    const a = ctx.components[name];
    const b = t.components[name];
    assert.deepEqual([a.radius, a.h, a.x, a.text.size, a.text.leading, a.text.font], [b.radius, b.h, b.x, b.text.size, b.text.leading, b.text.font], name);
    for (const [variant, v] of Object.entries(b.variants)) {
      for (const slot of ['fill', 'label', 'border', 'pressed', 'ring']) {
        if (!v[slot]) continue;
        assert.deepEqual(ctx.components[name].variants[variant][slot].light, v[slot].light, `${name}.${variant}.${slot}`);
        assert.deepEqual(ctx.components[name].variants[variant][slot].alpha, v[slot].alpha, `${name}.${variant}.${slot} alpha`);
      }
    }
  }
  // The build writes the same variables a live theme sends.
  const live = themeVars(t, 'hsl');
  const [css, tw] = nativewind3(ctx, { css: 'global.css', tailwind: 'theme.js' });
  for (const name of ['--chip-selected-bg', '--button-h-md', '--button-radius', '--badge-radius', '--field-focus-border', '--button-x', '--button-text-size']) {
    assert.match(css.contents, new RegExp(`${name}: ${live.light[name].replace(/[.()]/g, '\\$&')};`), name);
  }
  assert.match(tw.contents, /"button-primary-bg": "hsl\(var\(--button-primary-bg\) \/ var\(--button-primary-bg-a\)\)"/);
  assert.match(tw.contents, /"button-md": "var\(--button-h-md\)"/);
  assert.match(tw.contents, /"type-button": "var\(--button-text-size\)"/);
  const [web] = shadcnWeb(ctx, { out: 'web.css' });
  assert.match(web.contents, /--chip-selected-bg: oklch\(/);
  assert.match(web.contents, /--color-chip-selected-bg: color-mix\(in oklab, var\(--chip-selected-bg\) calc\(var\(--chip-selected-bg-a\) \* 100%\), transparent\);/);
  assert.match(web.contents, /--radius-button: var\(--button-radius\);/);
  assert.match(web.contents, /@utility type-button \{/);
  // Every variable is one the embedded kits accept.
  const names = new Set(componentVarNames());
  for (const name of Object.keys({ ...live.light, ...live.dark }).filter((n) => /^--(button|chip|badge|field)-/.test(n))) {
    if (!['--button-foreground', '--button-edge', '--field-edge', '--button-alpha', '--button-border-w', '--button-edge-w', '--field-alpha', '--field-border-w', '--field-edge-w', '--field-shadow'].includes(name)) assert.ok(names.has(name), name);
  }
  const [ts] = tsTheme(ctx, { out: 'theme.ts' });
  assert.match(ts.contents, /button: \{"height":\{"sm":40,"md":52,"lg":56\}/);
  assert.match(ts.contents, /export const COMPONENT_VARS = \[/);
});

test('ts-theme: a system with overrides has no code, and THEME_INFO says it may be null', async () => {
  const { tokens } = applySystem(base, sys({ name: 'Acme', radius: { lg: 22 } }));
  const [ts] = tsTheme(await built(tokens), { out: 'theme.ts' });
  assert.match(ts.contents, /export const THEME_INFO: ThemeInfo \| null = \{\n {2}"code": null,\n {2}"name": "Acme",/);
  assert.match(ts.contents, /\n {2}code: string \| null;\n/);
  // Tracking is typed as a number (a kit compares it with 0, and a system can set any value).
  assert.match(ts.contents, /chip: \{[^\n]*"tracking":0 as number/);
  assert.match(ts.contents, /\n {4}h1: \{[^\n]*"tracking":-0\.025 as number\}/);
});

test('a token file from before the layer gets the defaults', async () => {
  const ctx = await built(base);
  assert.deepEqual(ctx.components.button.h, { sm: 40, md: 48, lg: 56 });
  assert.equal(ctx.components.chip.variants.selected.fill.light, ctx.colors.find((c) => c.name === 'foreground').light);
});

test('label-on-fill pairings blend a see-through fill over the page', () => {
  const pairs = componentPairs(theme.components, 'dark', theme.resolved.dark.background, blend);
  const outline = pairs.find((p) => p.component === 'button' && p.variant === 'outline');
  assert.equal(outline.bg, blend(theme.resolved.dark.input, theme.resolved.dark.background, 0.3));
  const ghost = pairs.find((p) => p.component === 'button' && p.variant === 'ghost');
  assert.equal(ghost.bg, theme.resolved.dark.background);
  // Input's states each have text on a fill now, and the placeholder sits on the default fill.
  const placeholder = pairs.find((p) => p.component === 'input' && p.variant === 'placeholder');
  assert.deepEqual([placeholder.fg, placeholder.fgRole], [theme.resolved.dark['muted-foreground'], 'muted-foreground']);
});

test('usage: a component class counts as its component and the role it points at; comments are skipped', async () => {
  const { componentColourRoles, colourNames, usageIn } = await import('../lib/usage.mjs');
  const { tokens } = applySystem(base, sys());
  const roles = componentColourRoles(tokens);
  assert.deepEqual(roles['chip-selected-bg'], ['foreground']);
  const source = `// the theme's chip\nconst a = cn('h-chip-md rounded-chip', selected ? 'bg-chip-selected-bg' : 'bg-muted');`;
  assert.deepEqual([...usageIn(source, colourNames(tokens), roles)].sort(), ['color.foreground', 'color.muted', 'component.chip']);
  assert.ok(usageIn('className="h-(--field-h-md)"', colourNames(tokens), roles).has('component.input'));
});
