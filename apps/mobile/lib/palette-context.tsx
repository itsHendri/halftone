import { useEmbedMessage } from '@/lib/embed';
import { applyEmbedTokens, cachedEmbedTokens, parseEmbedTokens, reportApplied, type ComponentLook, type EmbedTokens } from '@/lib/embed-theme';
import { FONT_FAMILY } from '@/lib/fonts';
import { NAV_THEME, THEME, TOKENS, type ThemeColorName } from '@/lib/theme';
import { useKitTheme, type ColorScheme } from '@/lib/theme-context';
import type { Theme } from 'expo-router/react-navigation';
import * as React from 'react';

/**
 * Semantic colours as hex for the current scheme: the ones a className cannot reach (SVG fills, chart
 * strokes, the navigation theme). Read them with `usePalette()`, never `THEME[scheme]`, so an override
 * reaches every consumer.
 *
 * The values default to the generated THEME (tokens/tokens.json). An override replaces some or all of
 * them at runtime; only the docs site's Studio sets one, in an embedded session (lib/embed-theme.ts),
 * together with the CSS variables behind the classNames, so both stay in step.
 */
export type Palette = Record<ThemeColorName, string>;
export type PaletteOverride = Partial<Record<ColorScheme, Partial<Palette>>>;

const PaletteContext = React.createContext<Palette | null>(null);
/** A live theme from the docs picker, when one is showing (embedded web only). */
type LiveTheme = { code: string; stroke?: number; fonts?: EmbedTokens['fonts']; components?: EmbedTokens['components'] };
const LiveThemeContext = React.createContext<LiveTheme | null>(null);

const liveTheme = (tokens: EmbedTokens | null): LiveTheme | null => {
  if (!tokens?.code) return null;
  const stroke = Number(tokens.vars?.light?.['--icon-stroke']);
  return { code: tokens.code, stroke: stroke > 0 && stroke < 5 ? stroke : undefined, fonts: tokens.fonts ?? {}, components: tokens.components ?? {} };
};

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const { scheme } = useKitTheme();
  const [override, setOverride] = React.useState<PaletteOverride | null>(() => cachedEmbedTokens()?.hex ?? null);
  const [live, setLive] = React.useState<LiveTheme | null>(() => liveTheme(cachedEmbedTokens()));

  // The docs picker's live theme (web export in a phone frame only).
  const onTokens = React.useCallback((data: unknown, origin: string) => {
    const tokens: EmbedTokens | null = parseEmbedTokens(data);
    if (!tokens) return;
    applyEmbedTokens(tokens);
    setOverride(tokens.code === null ? null : (tokens.hex ?? null));
    setLive(liveTheme(tokens));
    reportApplied(tokens.code, origin);
  }, []);
  useEmbedMessage('kit:tokens', onTokens);
  // The cached theme's CSS was painted before the bundle (public/index.html); its fonts load now.
  React.useEffect(() => {
    const cached = cachedEmbedTokens();
    if (cached) applyEmbedTokens(cached);
  }, []);

  const palette = React.useMemo<Palette>(
    () => ({ ...THEME[scheme], ...override?.[scheme] }),
    [scheme, override]
  );
  return (
    <PaletteContext.Provider value={palette}>
      <LiveThemeContext.Provider value={live}>{children}</LiveThemeContext.Provider>
    </PaletteContext.Provider>
  );
}

/** Semantic colours as hex for the scheme on screen, override included. Without a PaletteProvider
 *  (a component installed into another app), the generated THEME. */
export function usePalette(): Palette {
  const palette = React.useContext(PaletteContext);
  const { scheme } = useKitTheme();
  return palette ?? THEME[scheme];
}

/** The code of the docs picker's live theme, if one is on screen instead of the committed theme. */
export const useLiveThemeCode = () => React.useContext(LiveThemeContext)?.code ?? null;

/** A live theme's Google fonts by role (embedded web only), or null. */
export const useLiveFonts = () => React.useContext(LiveThemeContext)?.fonts ?? null;

/**
 * A live theme's look for one component (weight, case, shadow, icon size: what the kit picks in JS), or null
 * while the committed theme shows. Components add its classes over their own (embedded web only).
 */
export const useLiveComponent = (name: keyof typeof TOKENS.components): ComponentLook | null => React.useContext(LiveThemeContext)?.components?.[name] ?? null;

/** The theme's icon stroke width (Lucide), live override included. */
export const useIconStroke = () => React.useContext(LiveThemeContext)?.stroke ?? TOKENS.iconStroke;

/**
 * React Navigation's fonts (header titles use `bold`) from the theme's fonts, per weight. A live theme from
 * the docs picker (web only) uses its Google fonts, keeping the weights.
 */
function navFonts(base: Theme['fonts'], live: LiveTheme['fonts'] | null): Theme['fonts'] {
  const pick = (role: 'heading' | 'body', weight: number, fallback: Theme['fonts']['regular']) => {
    if (live) return live[role] ? { ...fallback, fontFamily: `"${live[role]}", ui-sans-serif, system-ui, sans-serif` } : fallback;
    const family = FONT_FAMILY[role]?.[weight];
    return family ? { fontFamily: family, fontWeight: 'normal' as const } : fallback;
  };
  return {
    regular: pick('body', 400, base.regular),
    medium: pick('body', 500, base.medium),
    bold: pick('heading', 600, base.bold),
    heavy: pick('heading', 700, base.heavy),
  };
}

/** The React Navigation theme, built from the palette so headers and tab bars follow an override. */
export function useNavTheme(): Theme {
  const { scheme } = useKitTheme();
  const palette = usePalette();
  const liveFonts = useLiveFonts();
  return React.useMemo(
    () => ({
      ...NAV_THEME[scheme],
      fonts: navFonts(NAV_THEME[scheme].fonts, liveFonts),
      colors: {
        background: palette.background,
        border: palette.border,
        card: palette.card,
        notification: palette.destructive,
        primary: palette.primary,
        text: palette.foreground,
      },
    }),
    [scheme, palette, liveFonts]
  );
}
