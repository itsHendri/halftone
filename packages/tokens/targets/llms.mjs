/**
 * The tokens section of llms.txt: a compact Markdown fragment that registry-build stitches into the
 * app's llms.txt (and the docs site into /llms.txt).
 *   options: { out: 'tokens/generated/llms-tokens.md', platform?: 'mobile' | 'web' }
 */
import { group } from '../lib/resolve.mjs';
import { AA, describeTintLimits, textOnTintLimits } from '../lib/contrast.mjs';
import { themeStatus } from '../lib/theme/index.mjs';
import { themeFonts } from './fonts.mjs';
import { describeComponents } from '../lib/theme/components.mjs';
import { describeExtras } from '../lib/theme/extras.mjs';

export default function llms(ctx, options) {
  const rows = ctx.colors.map((c) => `| \`${c.name}\` | ${c.light} | ${c.dark} |`).join('\n');
  const steps = (prefix, unit = 'px') =>
    group(ctx.prim, prefix)
      .map((t) => `${t.key} ${t.value}${unit}`)
      .join(' · ');
  const fonts = themeFonts(ctx);
  const theme = themeStatus(ctx.source);
  const extras = describeExtras(ctx.extras ?? { color: [], text: [], radius: [], shadow: [], border: [] }, { platform: options.platform ?? 'mobile' });
  const contents = `<!-- ${ctx.header} -->
## Tokens

Colours are semantic names only, used as Tailwind classes (\`bg-primary\`, \`text-muted-foreground\`,
\`border-border\`, \`bg-success/15\`). Never hex, never Tailwind palette colours. Both themes are
required; ${ctx.contrastFailures?.length ? `${ctx.contrastFailures.length} pairing(s) in this palette fall below WCAG AA (${AA}:1): fix them (\`npm run tokens:build\` names them).` : `every fill/foreground pairing clears WCAG AA (${AA}:1); \`npm run tokens:build\` names any that falls short (\`--strict\` fails on it).`}
A tone's own text on its own tint (\`text-success\` on \`bg-success/15\`) clears AA only for these
tints; on a stronger one, put \`text-foreground\` on the tint:
${describeTintLimits(textOnTintLimits(ctx.colors))}.

| Name | Light | Dark |
|---|---|---|
${rows}

- Spacing (4-pt grid, Tailwind numeric scale): ${steps(['space'])}
- Radius (\`rounded-*\`): ${ctx.radius.steps.map((s) => `${s.name} ${s.px}px`).join(' · ')} (multiples of \`--radius\` = ${ctx.radius.base}px); \`rounded-control\` ${ctx.shape.control >= 9999 ? 'pill' : `${ctx.shape.control}px`}
- Depth: \`shadow-sm\` (controls, cards), \`shadow-md\` (raised, popovers), \`shadow-lg\` (menus, dialogs) are the theme's three elevation levels; no shadow colour modifiers on surfaces (thumbs and floating elements may add \`shadow-black/20\`)
- Border \`border\` ${ctx.shape.borderWidth}px · icon stroke ${ctx.shape.stroke} (an Icon's \`strokeWidth\` is relative to 2)
- Styles: ${ctx.styles.button} buttons, ${ctx.styles.field} fields
- Components (one theme for both kits; never restyle them by hand): ${describeComponents(ctx.components).join('; ')}. Phones raise any tap target under 44px to 44
- Fonts: headings ${fonts.heading?.family ?? 'system'}, body ${fonts.body?.family ?? 'system'}, mono ${fonts.mono?.family ?? 'system'} (applied by Text; \`font-heading\` makes any Text a heading, \`font-mono\` code and figures)
- Typeset: body ${ctx.type.size}px, leading ${ctx.type.leading}; every \`text-*\` size below scales by ${ctx.type.scale}${theme.applied ? `\n- Theme: \`${theme.code}\` (\`npx halftone-tokens theme show\`)` : ''}
- Font sizes (\`text-*\`): ${steps(['font', 'size'])}
- Durations: ${steps(['duration'], 'ms')}
${extras.length ? `\n### Extras (this brand's own)\n\nNo kit component uses these; screens may, as classes (never their hex):\n\n${extras.join('\n')}\n` : ''}`;
  return [{ path: options.out, contents }];
}
