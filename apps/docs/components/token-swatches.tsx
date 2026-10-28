import { colorNames } from '@/lib/kit';

/**
 * Every semantic colour, painted with the site's own CSS variables (generated from the kit's tokens.json),
 * so the swatches follow the theme toggle like the rest of the page.
 */
/** The tints and pressed fills: derived from the roles, shown by TintSwatches instead. */
const TONES = ['primary', 'success', 'warning', 'destructive', 'info'] as const;
const derived = (n: string) => /-(subtle|pressed)$/.test(n) || TONES.some((t) => n === `${t}-border`);

export function TokenSwatches() {
  const bases = colorNames.filter((n) => !n.endsWith('-foreground') && !derived(n));
  return (
    <ul className="not-prose grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {bases.map((name) => {
        const fg = colorNames.includes(`${name}-foreground`) ? `${name}-foreground` : null;
        return (
          <li key={name} className="border-border overflow-hidden rounded-xl border">
            <div
              className="flex h-16 items-end p-2 text-sm font-medium"
              style={{ background: `var(--${name})`, color: fg ? `var(--${fg})` : undefined }}>
              {fg ? 'Aa' : null}
            </div>
            <div className="bg-card p-2">
              <code className="text-xs">{name}</code>
              {fg ? <p className="text-muted-foreground text-xs">+ {fg}</p> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The tints and pressed fills, as the kits draw them: each tone's `-subtle` surface inside its `-border`, with
 * body and muted text and the tone as a dot; `muted-subtle`; each pressed fill beside its fill, with the label.
 */
export function TintSwatches() {
  const pressed = (['primary', 'secondary'] as const).filter((n) => colorNames.includes(`${n}-pressed`));
  return (
    <div className="not-prose flex flex-col gap-3">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {TONES.filter((t) => colorNames.includes(`${t}-subtle`)).map((tone) => (
          <li key={tone} className="flex flex-col gap-1.5">
            <div
              className="flex h-16 flex-col justify-center gap-0.5 rounded-xl border px-3"
              style={{ background: `var(--${tone}-subtle)`, borderColor: `var(--${tone}-border)` }}>
              <span className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: `var(--${tone})` }} aria-hidden />
                Aa
              </span>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                muted text
              </span>
            </div>
            <code className="text-xs">{tone}-subtle</code>
            <code className="text-muted-foreground -mt-1 text-xs">+ {tone}-border</code>
          </li>
        ))}
        {colorNames.includes('muted-subtle') ? (
          <li className="flex flex-col gap-1.5">
            <div className="border-border flex h-16 flex-col justify-center gap-0.5 rounded-xl border px-3" style={{ background: 'var(--muted-subtle)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Aa
              </span>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                muted text
              </span>
            </div>
            <code className="text-xs">muted-subtle</code>
          </li>
        ) : null}
      </ul>
      {pressed.length ? (
        <ul className="grid grid-cols-2 gap-3">
          {pressed.map((n) => (
            <li key={n} className="flex flex-col gap-1.5">
              <div className="border-border grid h-12 grid-cols-2 overflow-hidden rounded-xl border text-sm font-medium" style={{ color: `var(--${n}-foreground)` }}>
                <span className="flex items-center px-3" style={{ background: `var(--${n})` }}>
                  {n}
                </span>
                <span className="flex items-center px-3" style={{ background: `var(--${n}-pressed)` }}>
                  pressed
                </span>
              </div>
              <code className="text-xs">{n}-pressed</code>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
