/**
 * DESIGN.md (google-labs-code/design.md, spec version "alpha"): the tokens as YAML front matter plus
 * short, platform-neutral prose an agent can load on its own. The spec has no light/dark modes, so
 * `colors` carries the light value under each name and the dark one under `<name>-dark`.
 * The detailed rules stay in DESIGN_SYSTEM.md; this file points there instead of repeating them.
 *   options: { out: 'DESIGN.md', name?: string, description?: string, platform?: 'mobile' | 'web' }
 */
import { describeTintLimits, textOnTintLimits } from '../lib/contrast.mjs';
import { describeComponents } from '../lib/theme/components.mjs';
import { describeExtras } from '../lib/theme/extras.mjs';
import { themeFonts } from './fonts.mjs';
import { themeStatus } from '../lib/theme/index.mjs';
import { group } from '../lib/resolve.mjs';

const q = (s) => JSON.stringify(String(s));
const px = (n) => `${n}px`;

/** The Text variants of components/ui/text.tsx, as typography tokens, at the theme's typeset. */
function typography(prim, type) {
  const size = Object.fromEntries(group(prim, ['font', 'size']).map((t) => [t.key, Math.round(t.value * type.scale * 10) / 10]));
  const families = Object.fromEntries(group(prim, ['font', 'family']).map((t) => [t.key, t.value]));
  const heading = families.heading || families.sans || 'system-ui';
  const sans = families.body || families.sans || 'system-ui';
  const mono = families.mono || 'monospace';
  const levels = [
    ['h1', heading, size['4xl'], 800, 1.1, '-0.025em'],
    ['h2', heading, size['3xl'], 600, 1.2, '-0.025em'],
    ['h3', heading, size['2xl'], 600, 1.25, '-0.025em'],
    ['h4', heading, size.xl, 600, 1.3, '-0.025em'],
    ['lead', sans, size.xl, 400, 1.4],
    ['large', sans, size.lg, 600, 1.4],
    ['body', sans, size.base, 400, type.leading],
    ['small', sans, size.sm, 500, 1],
    ['muted', sans, size.sm, 400, 1.4],
    ['code', mono, size.sm, 600, 1.4],
  ];
  return levels
    .map(([name, family, fontSize, weight, lineHeight, tracking]) =>
      [
        `  ${name}:`,
        `    fontFamily: ${q(family)}`,
        `    fontSize: ${px(fontSize)}`,
        `    fontWeight: ${weight}`,
        `    lineHeight: ${lineHeight}`,
        ...(tracking ? [`    letterSpacing: ${tracking}`] : []),
      ].join('\n')
    )
    .join('\n');
}

/**
 * The contrast sentence. A passing palette says the build names any pairing that falls short (and --strict
 * fails on it); a failing one, which only builds without --strict, names its pairings.
 */
function contrastLine(ctx) {
  const failures = ctx.contrastFailures ?? [];
  if (!failures.length) {
    return `Every \`X\` / \`X-foreground\` pairing, muted text on every surface, and every status tone used as text
clears WCAG AA (4.5:1) in both themes; the build names any pairing that falls short, and \`--strict\` fails on it.`;
  }
  return `${failures.length} pairing(s) in this palette fall below WCAG AA (4.5:1). Fix them before handing a prototype
over (\`npm run tokens:build -- --strict\` fails on them):

${failures.map((f) => `- ${f.trim()}`).join('\n')}`;
}

/** How the theme's styles read in DESIGN.md. */
const STYLE_TEXT = {
  button: {
    solid: 'The primary button is a solid brand fill.',
    soft: 'The primary button is a soft brand tint with brand text.',
    outline: 'The primary button is a brand outline with brand text, no fill.',
    raised: 'The primary button is a solid brand fill with a darker bottom edge.',
  },
  field: {
    outline: 'Text fields are outlined boxes.',
    filled: 'Text fields are tinted, with a line along the bottom.',
    underline: 'Text fields are a single line, no box.',
  },
};

export default function designMd(ctx, options) {
  const name = options.name ?? 'Halftone';
  // The component layer: one theme for both kits (Button, Chip, Badge, Input).
  const { button, input } = ctx.components;
  const corner = (r) => (r >= 9999 ? '"{rounded.full}"' : px(r));
  const description =
    options.description ?? 'Brand-agnostic prototype kit: shadcn semantics, light and dark, WCAG AA enforced at build time.';
  const colors = ctx.colors
    .flatMap((c) => [`  ${c.name}: ${q(c.light)}`, `  ${c.name}-dark: ${q(c.dark)}`])
    .join('\n');
  // The theme's radius: rounded-* are multiples of its base (rounded-lg); control is buttons and chips.
  const rounded = [
    ...ctx.radius.steps.map((s) => `  ${s.name}: ${px(s.px)}`),
    `  control: ${px(Math.min(ctx.shape.control, 9999))}`,
    `  full: ${px(9999)}`,
  ].join('\n');
  const fonts = themeFonts(ctx);
  const status = themeStatus(ctx.source);
  const fontName = (f) => (f ? f.family : 'the system font (SF / Roboto)');
  const spacing = group(ctx.prim, ['space'])
    .map((t) => `  ${q(t.key)}: ${px(t.value)}`)
    .join('\n');
  const hex = Object.fromEntries(ctx.colors.map((c) => [c.name, c.light]));
  const darkHex = Object.fromEntries(ctx.colors.map((c) => [c.name, c.dark]));
  const radius = Object.fromEntries(group(ctx.prim, ['radius']).map((t) => [t.key, t.value]));
  const duration = Object.fromEntries(group(ctx.prim, ['duration']).map((t) => [t.key, t.value]));

  // A system's own tokens: listed, never in the front matter's shared vocabulary.
  const extras = describeExtras(ctx.extras ?? { color: [], text: [], radius: [], shadow: [], border: [] }, { platform: options.platform ?? 'mobile' });
  const extrasSection = extras.length
    ? `
## Extras (this brand's own)

Tokens this system added beyond the kit's slots. No kit component uses them; use them in screens, as classes like
any token (never their hex). They are not part of the shared vocabulary above.

${extras.join('\n')}
`
    : '';

  const contents = `---
version: alpha
name: ${q(name)}
description: ${q(description)}
colors:
${colors}
typography:
${typography(ctx.prim, ctx.type)}
rounded:
${rounded}
spacing:
${spacing}
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: ${corner(button.radius)}
    height: ${px(button.h.md)}
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: ${corner(button.radius)}
    height: ${px(button.h.md)}
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.lg}"
    padding: 16px
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: ${corner(input.radius)}
    height: ${px(input.h.md)}
---

<!-- ${ctx.header} -->

# ${name}

## Overview

A neutral, brand-agnostic base for clickable prototypes on phone and web. Calm surfaces, one brand
colour reserved for the primary action and focus, generous spacing, and both light and dark themes
from day one. ${status.applied ? `The applied theme is \`${status.code}\`${status.drift.length ? ' (edited by hand since)' : ''}. ` : ''}Re-branding means applying a
theme (\`npx halftone-tokens theme apply <code|file.halftone.json>\`, both from Studio on the docs site) or editing
\`tokens/tokens.json\`; everything else follows. The full rules and the component registry are in
\`DESIGN_SYSTEM.md\` — read it before building UI.

## Colors

Semantic names only (the shadcn vocabulary), each usable as \`bg-\`, \`text-\` and \`border-\`. Never a
hex literal or a Tailwind palette colour in UI code. Keys ending in \`-dark\` are the dark theme.

- **Primary (${hex.primary} / dark ${darkHex.primary}):** the single most important action, links and focus.
- **Background (${hex.background}) and Card (${hex.card}):** the page canvas and raised surfaces.
- **Muted foreground (${hex['muted-foreground']}):** helper text, captions, placeholders.
- **Destructive, Success, Warning, Info:** status only, each with its own \`-foreground\`.
- **Chart 1–5:** data series.

${contrastLine(ctx)}

A tone's text on that tone's own tint (\`text-success\` on \`bg-success/15\`) is a weaker pairing. With
this palette it clears AA only for:

${describeTintLimits(textOnTintLimits(ctx.colors))}.

On a stronger tint, the text stays \`text-foreground\` and the tint, an icon or a dot carries the
colour. \`halftone-tokens check\` flags class strings that break this.
${extrasSection}
## Typography

Headings (h1–h4, titles) use ${fontName(fonts.heading)}; everything else uses ${fontName(fonts.body)}; code and
figures (\`font-mono\`) use ${fonts.mono ? fonts.mono.family : 'the system monospace font'}. Typeset: body text ${ctx.type.size}px (every
\`text-*\` size scales with it), running text leading ${ctx.type.leading}. Long-form text (articles, help, rendered
markdown) goes in \`Prose\`: ${ctx.type.flow}em between blocks, lines up to ${ctx.type.measure} characters.
Use the Text variants (h1–h4, lead, large, body, small, muted, code) rather than raw sizes. Medium weight for row titles, semibold for headings and
values, bold only for hero amounts.

## Layout

A 4-pt grid, restricted to the steps in \`spacing\` (0–64px). Screen edge padding 20px, 20px between
sections, 16px inside cards, 12px vertical in list rows. Siblings are spaced with gaps, not margins,
and spacing varies to create hierarchy. Interactive targets are at least 44×44.

## Elevation & Depth

Mostly flat: hierarchy comes from surface colour (background → card) and borders. A shadow is only
for something you can press or something floating above the page (dialogs, sheets, menus, toasts,
a floating button). Content — inputs included — stays flat.

## Shapes

Buttons ${button.radius >= 9999 ? 'are pills' : `have ${button.radius}px corners`}. Inputs ${input.radius}px, cards ${radius.lg}px, larger surfaces ${radius.xl}px, sheet tops
${radius['2xl']}px; chips, avatars and dots are fully round.

## Components

Only components listed in the registry in \`DESIGN_SYSTEM.md\` exist. ${STYLE_TEXT.button[ctx.styles.button]} ${STYLE_TEXT.field[ctx.styles.field]}
Button, Chip, Badge and Input draw the theme's component tokens, the same in both kits: ${describeComponents(ctx.components).join('; ')}.
Never restyle them by hand. Phones raise any tap target under 44px to 44.
Motion: ${duration.fast}ms for micro-feedback, ${duration.base}ms for most transitions, ${duration.slow}ms for sheets, and
nothing moves when the OS asks for reduced motion.

## Do's and Don'ts

- Do keep the brand colour for the primary action and focus; one primary action per screen.
- Do check every screen in light and dark.
- Don't nest cards inside cards or put a section title inside its card.
- Don't use grey-on-grey text below 4.5:1, tap targets under 44×44, or icon-only buttons without a label.
- Don't invent a component: if it is not in the registry, stop and add it properly.
`;
  return [{ path: options.out, contents }];
}
