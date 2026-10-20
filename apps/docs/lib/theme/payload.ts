/**
 * What the docs site sends each embedded kit for a theme, in that kit's own variable format (the format
 * its tokens:build writes), text styles included (--type-<style>-*). Shared contract: apps/mobile/lib/embed-theme.ts and apps/web/lib/embed-theme.ts.
 */
import { FONTS, fontByFamily, googleFontsHref, themeHex, themeTextStyles, themeVars, type Theme } from '@halftone-ds/tokens/theme';

type FontRole = 'heading' | 'body' | 'mono';
/** `roles`: each text style's font role, for the mobile kit, which picks fonts in JS (the web's are variables). */
type Fonts = { heading?: string; body?: string; mono?: string; roles?: Record<string, FontRole> };
export type KitPayload = {
  code: string | null;
  vars?: Record<'light' | 'dark', Record<string, string>>;
  hex?: Record<'light' | 'dark', Record<string, string>>;
  fonts?: Fonts;
};
export type KitPayloads = { code: string | null; mobile: KitPayload; web: KitPayload };

/** `live: false` (the committed theme) tells the kits to drop any override. */
export function kitPayloads(theme: Theme, live: boolean): KitPayloads {
  if (!live) return { code: null, mobile: { code: null }, web: { code: null } };
  const f = theme.fonts;
  // Mono: system-mono is 'Menlo', the platform font, not a Google font.
  const mono = theme.recipe.font.mono === 'system-mono' ? undefined : f.mono;
  const fonts: Fonts = { heading: f.heading || undefined, body: f.body || undefined, mono };
  const roles = Object.fromEntries(Object.entries(themeTextStyles(theme)).map(([name, style]) => [name, style.font]));
  return {
    code: theme.code,
    mobile: { code: theme.code, vars: themeVars(theme, 'hsl'), hex: themeHex(theme), fonts: { ...fonts, roles } },
    web: { code: theme.code, vars: themeVars(theme, 'oklch'), fonts },
  };
}

const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/**
 * Google Fonts for a theme's heading, body and mono, or null for the system fonts. A system's font may be any Google
 * Font (theme.fonts holds the families): a Halftone pick loads as before, any other family at 400–700 (Google Fonts
 * serves the weights a family has and skips the rest).
 */
export function fontsHref(theme: Theme) {
  const ids = new Set<string>();
  const others: string[] = [];
  for (const role of ['heading', 'body', 'mono'] as const) {
    const family = theme.fonts[role];
    if (!family || (role === 'mono' && theme.recipe.font.mono === 'system-mono')) continue;
    const pick = FONTS.find((f) => f.family.toLowerCase() === family.toLowerCase());
    if (pick) ids.add(pick.id);
    else others.push(family);
  }
  const href = googleFontsHref([...ids]);
  const extra = [...new Set(others)].map((family) => `family=${family.replace(/ /g, '+')}:wght@${fontByFamily(family).weights.join(';')}`);
  if (!extra.length) return href;
  return href ? href.replace('&display=swap', `&${extra.join('&')}&display=swap`) : `https://fonts.googleapis.com/css2?${extra.join('&')}&display=swap`;
}

/**
 * Variables that shape components (radius, border, stroke, density, type, depth, and the button and field
 * styles' numbers): never the site's. The styles' colours (--button, --field-edge…) are colours like any other.
 */
const SHAPE = /^--(radius|border-width|icon-stroke|density|control-|type-|leading-|typeset-|shadow-|button-(alpha|border-w|edge-w)$|field-(alpha|border-w|edge-w|radius|radius-b|x|shadow)$)/;
type Modes = Record<'light' | 'dark', Record<string, string>>;
const pick = (vars: Modes, keep: (k: string) => boolean): Modes => ({
  light: Object.fromEntries(Object.entries(vars.light).filter(([k]) => keep(k))),
  dark: Object.fromEntries(Object.entries(vars.dark).filter(([k]) => keep(k))),
});

/** A theme's variables in two halves: colour (the site and the components) and shape (components only). */
export function splitVars(theme: Theme) {
  const vars = themeVars(theme, 'oklch');
  return { colour: pick(vars, (k) => !SHAPE.test(k)), shape: pick(vars, (k) => SHAPE.test(k)) };
}

const block = (selector: string, vars: Record<string, string>) =>
  `${selector}{${Object.entries(vars).map(([k, v]) => `${k}:${v};`).join('')}}\n`;

/**
 * The docs site's own colours for a theme. The site takes colour and nothing else: its font, radius, border,
 * stroke and depth are pinned in app/global.css, so picking a theme never moves the page. More specific than
 * app/tokens.css (`:root`, `.dark`); Fumadocs reads the same variables (fumadocs-ui/css/shadcn.css).
 */
export function siteCss(theme: Theme) {
  const { colour } = splitVars(theme);
  return block(':root:root', colour.light) + block('.dark:root:root', colour.dark);
}

/**
 * The rest of a theme, for components rendered by this site (studio specimens, Foundations): everything
 * under `.kit-scope` takes the theme's fonts, radius, border, stroke, density, typeset and depth. Colours
 * come from the page, which already follows the theme (or the ambient drift).
 */
export function kitScopeCss(theme: Theme) {
  const { shape } = splitVars(theme);
  const f = theme.fonts;
  const body = f.body ? `"${f.body}", ${SANS}` : SANS;
  const heading = f.heading ? `"${f.heading}", ${SANS}` : body;
  const mono = theme.recipe.font.mono === 'system-mono' ? MONO : `"${f.mono}", ${MONO}`;
  const fonts = { '--kit-font-body': body, '--kit-font-heading': heading, '--kit-font-mono': mono };
  return block('.kit-scope', { ...shape.light, ...fonts }) + block('.dark .kit-scope', shape.dark);
}
