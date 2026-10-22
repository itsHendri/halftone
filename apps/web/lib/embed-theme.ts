import { COMPONENT_VARS, THEME, TOKENS } from '@/lib/theme';

/**
 * A live theme from the docs site's picker, for the kit inside its browser frame. Same contract as the
 * mobile kit (apps/mobile/lib/embed-theme.ts); here `vars` are oklch, as app/tokens.css writes them.
 *
 *   host → kit   { type: 'kit:tokens', v: 1, code, vars: { light, dark } }
 *                { type: 'kit:tokens', v: 1, code: null }   back to the committed theme
 *   kit → host   { type: 'kit:applied', code }
 *
 * The docs site also caches the theme in sessionStorage (EMBED_THEME_KEY) so embedBootScript paints it
 * before React runs; the checks and selectors there mirror these.
 */
export type EmbedTokens = {
  code: string | null;
  vars?: { light: Record<string, string>; dark: Record<string, string> };
  /** Google Fonts family names by role; loaded from fonts.googleapis.com while the theme is live. */
  fonts?: { heading?: string; body?: string; mono?: string };
};

export const EMBED_THEME_KEY = 'kit.embed.tokens';
export const OVERRIDE_STYLE_ID = 'kit-theme-override';
const FONTS_ID = 'kit-theme-fonts';
const FAMILY = /^[A-Za-z0-9 ]{1,40}$/;
const SANS = 'ui-sans-serif, system-ui, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
/** A theme code: ht1- and 12 characters (the default typeset), or ht2- and 16. */
const THEME_CODE = /^(ht1-[0-9A-Z]{12}|ht2-[0-9A-Z]{16}|ht3-[0-9A-Z]{18})$/i;
/** The typeset's variables (halftone-tokens' typeVars): app/tokens.css scales text-xs…4xl by them. */
const TYPE_VARS = ['--type-scale', '--leading-factor', '--typeset-leading', '--typeset-flow', '--typeset-measure'];
/** The text styles' variables (halftone-tokens' textStyleVars): the type-h1…type-blockquote utilities and Prose. */
const TEXT_STYLE_VARS = Object.keys(TOKENS.textStyles).flatMap((s) => ['size', 'leading', 'weight', 'tracking', 'font'].map((k) => `--type-${s}-${k}`));
/** The button and field styles' numbers (their colours are THEME keys); the component layer's are COMPONENT_VARS. */
const STYLE_VARS = ['--button-alpha', '--button-border-w', '--button-edge-w', '--field-alpha', '--field-border-w', '--field-edge-w', '--field-radius', '--field-radius-b', '--field-x', '--field-shadow'];

const kebab = (s: string) => s.replace(/([A-Z])/g, '-$1').replace(/([a-z])(\d)/g, '$1-$2').toLowerCase();
const ALLOWED_VARS = new Set([...Object.keys(THEME.light).map((k) => `--${kebab(k)}`), '--radius', '--radius-control', '--border-width', '--icon-stroke', '--shadow-1', '--shadow-2', '--shadow-3', '--density', ...TYPE_VARS, ...TEXT_STYLE_VARS, ...STYLE_VARS, ...COMPONENT_VARS]);
const SAFE_VALUE = /^[\w.%\s(),#/*-]{1,80}$/;

function cleanVars(map: unknown): Record<string, string> {
  if (!map || typeof map !== 'object') return {};
  return Object.fromEntries(
    Object.entries(map as Record<string, unknown>).filter(
      ([name, value]) => ALLOWED_VARS.has(name) && typeof value === 'string' && SAFE_VALUE.test(value) && !/url/i.test(value)
    ) as [string, string][]
  );
}

export function parseEmbedTokens(data: unknown): EmbedTokens | null {
  const d = data as { type?: unknown; v?: unknown; code?: unknown; vars?: { light?: unknown; dark?: unknown } } | null;
  if (!d || d.type !== 'kit:tokens' || d.v !== 1) return null;
  if (d.code === null) return { code: null };
  if (typeof d.code !== 'string' || !THEME_CODE.test(d.code)) return null;
  const f = (d as { fonts?: { heading?: unknown; body?: unknown; mono?: unknown } }).fonts;
  const family = (v: unknown) => (typeof v === 'string' && FAMILY.test(v) ? v : undefined);
  return {
    code: d.code,
    vars: { light: cleanVars(d.vars?.light), dark: cleanVars(d.vars?.dark) },
    fonts: { heading: family(f?.heading), body: family(f?.body), mono: family(f?.mono) },
  };
}

/** Put the theme on the page, or take it off. Beats app/tokens.css (`:root`, `.dark`) on specificity. */
export function applyEmbedTokens(tokens: EmbedTokens) {
  let style = document.getElementById(OVERRIDE_STYLE_ID);
  applyFonts(tokens);
  if (tokens.code === null || !tokens.vars) {
    style?.remove();
    return;
  }
  if (!style) {
    style = document.createElement('style');
    style.id = OVERRIDE_STYLE_ID;
    document.head.appendChild(style);
  }
  const block = (selector: string, vars: Record<string, string>) =>
    `${selector}{${Object.entries(vars).map(([k, v]) => `${k}:${v};`).join('')}}`;
  // The live fonts replace app/fonts.ts's (a theme without a font goes back to the system stack).
  const fontVars = {
    '--kit-font-body': tokens.fonts?.body ? `"${tokens.fonts.body}", ${SANS}` : SANS,
    '--kit-font-heading': tokens.fonts?.heading ? `"${tokens.fonts.heading}", ${SANS}` : 'var(--kit-font-body)',
    '--kit-font-mono': tokens.fonts?.mono ? `"${tokens.fonts.mono}", ${MONO}` : MONO,
  };
  style.textContent = block(':root:root:root', { ...tokens.vars.light, ...fontVars }) + block('.dark:root:root:root', tokens.vars.dark);
}

function applyFonts(tokens: EmbedTokens) {
  const families = [...new Set([tokens.fonts?.heading, tokens.fonts?.body, tokens.fonts?.mono].filter((f): f is string => !!f))];
  let link = document.getElementById(FONTS_ID) as HTMLLinkElement | null;
  if (tokens.code === null || !families.length) {
    link?.remove();
    return;
  }
  const href = `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700`).join('&')}&display=swap`;
  if (!link) {
    link = document.createElement('link');
    link.id = FONTS_ID;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.href !== href) link.href = href;
}
