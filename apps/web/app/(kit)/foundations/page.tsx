import type { Metadata } from 'next';
import theme from '@/tokens/generated/theme.registry.json';
import { THEME_INFO, TOKENS } from '@/lib/theme';

export const metadata: Metadata = { title: 'Foundations' };

const colors = Object.keys(theme.web.cssVars.light).filter((k) => k !== 'radius');
const fills = colors.filter((n) => !n.endsWith('-foreground'));
/** Literal class names: Tailwind only generates classes it can read in the source. */
const RADIUS_CLASS: Record<string, string> = { sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg', xl: 'rounded-xl', '2xl': 'rounded-2xl', control: 'rounded-control' };
/** rounded-sm…2xl are multiples of the theme's base radius (rounded-lg); rounded-control is buttons and chips. */
const radiusPx = (k: string) =>
  k === 'control'
    ? TOKENS.radius.control >= 9999
      ? 'pill'
      : `${TOKENS.radius.control}px`
    : `${Math.round(((TOKENS.radius.base * TOKENS.radius[k as 'sm']) / TOKENS.radius.lg) * 10) / 10}px`;
/** The theme's text styles (the mobile kit's Text variants), literal for Tailwind. Studio edits them in both kits. */
const TEXT_STYLE_CLASS = {
  h1: 'type-h1',
  h2: 'type-h2',
  h3: 'type-h3',
  h4: 'type-h4',
  lead: 'type-lead',
  large: 'type-large',
  p: 'type-p',
  small: 'type-small',
  muted: 'type-muted',
  blockquote: 'type-blockquote',
  code: 'type-code',
} as const;
const DEPTH: [string, string][] = [
  ['shadow-sm', 'Controls and cards'],
  ['shadow-md', 'Raised cards, popovers'],
  ['shadow-lg', 'Menus, dialogs'],
];
const fontName = (id: string) => (id === 'system' ? 'System' : id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '));

/** The theme tokens.json was generated from. Themes are picked on the docs site and applied with halftone-tokens. */
function ThemeSummary() {
  if (!THEME_INFO) return <p className="text-muted-foreground text-sm">No theme recorded. Apply one with <code>npx halftone-tokens theme apply &lt;code&gt;</code>.</p>;
  const { recipe } = THEME_INFO;
  const rows: [string, string][] = [
    ['Neutral', recipe.neutral],
    ['Radius', `${recipe.radius}${recipe.controls === 'pill' ? ' · pill controls' : ''}`],
    ['Type', recipe.font.heading === recipe.font.body ? fontName(recipe.font.heading) : `${fontName(recipe.font.heading)} / ${fontName(recipe.font.body)}`],
    ['Icons', `${recipe.stroke} stroke`],
    ['Depth', recipe.depth],
    ['Density', recipe.density],
    ['Border', recipe.border],
  ];
  return (
    <div className="border-border bg-card flex max-w-xl flex-col gap-4 rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <span className="bg-primary border-border size-10 rounded-full border" aria-hidden />
        <div>
          <p className="font-semibold">
            {THEME_INFO.name}
            {THEME_INFO.edited ? <span className="text-muted-foreground font-normal"> (edited by hand)</span> : null}
          </p>
          {/* A system with overrides has no code. */}
          {THEME_INFO.code ? (
            <code className="text-muted-foreground text-xs">{THEME_INFO.code}</code>
          ) : (
            <p className="text-muted-foreground text-xs">A system with overrides (no theme code)</p>
          )}
        </div>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-muted-foreground text-xs">
        Make and preview systems in Studio on the docs site (/studio), then apply one: <code>npx halftone-tokens theme apply &lt;code&gt;</code>.
      </p>
    </div>
  );
}

/** The design tokens, rendered with the live CSS variables so they follow the theme. */
export default function FoundationsPage() {
  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-2">
        <h1 className="type-h2">Foundations</h1>
        <p className="text-muted-foreground max-w-2xl">
          From tokens/tokens.json. Use the class names (<code>bg-primary</code>, <code>p-4</code>, <code>rounded-lg</code>), never the values.
        </p>
      </header>

      <section aria-labelledby="theme" className="flex flex-col gap-4">
        <h2 id="theme" className="type-h4">
          Theme
        </h2>
        <ThemeSummary />
      </section>

      <section aria-labelledby="colour" className="flex flex-col gap-4">
        <h2 id="colour" className="type-h4">
          Colour
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {fills.map((name) => {
            const fg = colors.includes(`${name}-foreground`) ? `${name}-foreground` : null;
            return (
              <li key={name} className="border-border overflow-hidden rounded-xl border">
                <div className="flex h-16 items-end p-2 text-sm font-medium" style={{ background: `var(--${name})`, color: fg ? `var(--${fg})` : undefined }}>
                  {fg ? 'Aa' : null}
                </div>
                <div className="bg-card p-2">
                  <code className="text-xs">bg-{name}</code>
                  {fg ? <p className="text-muted-foreground text-xs">text-{fg}</p> : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="radius" className="flex flex-col gap-4">
        <h2 id="radius" className="type-h4">
          Radius
        </h2>
        <ul className="flex flex-wrap gap-4">
          {Object.keys(RADIUS_CLASS).map((k) => (
            <li key={k} className="flex flex-col items-center gap-2">
              <div className={`bg-muted border-border size-16 border ${RADIUS_CLASS[k]}`} />
              <code className="text-xs">
                rounded-{k} · {radiusPx(k)}
              </code>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="depth" className="flex flex-col gap-4">
        <h2 id="depth" className="type-h4">
          Depth and borders
        </h2>
        <ul className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
          {DEPTH.map(([cls, use]) => (
            <li key={cls} className="flex flex-col gap-2">
              <div className={`bg-card border-border h-20 rounded-lg border ${cls}`} />
              <code className="text-xs">{cls}</code>
              <span className="text-muted-foreground text-xs">{use}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm">
          <code>border</code> is {TOKENS.borderWidth}px; icons draw at a {TOKENS.iconStroke} stroke.
        </p>
      </section>

      <section aria-labelledby="spacing" className="flex flex-col gap-4">
        <h2 id="spacing" className="type-h4">
          Spacing
        </h2>
        <ul className="flex flex-col gap-2">
          {Object.entries(TOKENS.space).map(([k, v]) => (
            <li key={k} className="flex items-center gap-3">
              <code className="w-14 text-xs">p-{k}</code>
              <span className="bg-primary h-3 rounded-sm" style={{ width: v }} />
              <span className="text-muted-foreground text-xs">{v}px</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="text-styles" className="flex flex-col gap-4">
        <h2 id="text-styles" className="type-h4">
          Text styles
        </h2>
        <p className="text-muted-foreground text-sm">
          The mobile kit&rsquo;s Text variants, as utilities: headings and labels use these, so a style edited in Studio changes
          them in both kits.
        </p>
        <ul className="flex flex-col gap-3">
          {(Object.keys(TEXT_STYLE_CLASS) as (keyof typeof TEXT_STYLE_CLASS)[]).map((k) => {
            const t = TOKENS.textStyles[k];
            return (
              <li key={k} className="flex items-baseline gap-4">
                <code className="text-muted-foreground w-40 shrink-0 text-xs">
                  {TEXT_STYLE_CLASS[k]} · {t.size}/{t.lineHeight} · {t.weight}
                </code>
                <span className={`${TEXT_STYLE_CLASS[k]} min-w-0`}>The quick brown fox</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="type" className="flex flex-col gap-4">
        <h2 id="type" className="type-h4">
          Type
        </h2>
        <ul className="flex flex-col gap-3">
          {Object.entries(TOKENS.fontSize)
            .reverse()
            .map(([k, v]) => (
              <li key={k} className="flex items-baseline gap-4">
                <code className="text-muted-foreground w-24 shrink-0 text-xs">
                  text-{k} · {v}
                </code>
                <span style={{ fontSize: v }}>Prototypes that look designed</span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
