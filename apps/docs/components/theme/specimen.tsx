'use client';
import { FONTS } from '@halftone-ds/tokens/theme';
import type * as React from 'react';
import { useLiveTheme } from '@/lib/theme/store';

/**
 * Specimens of the live theme, rendered by this site. The site itself takes only the theme's colour, so a
 * specimen must sit inside `.kit-scope` (app/global.css) to show its fonts, radius, depth and stroke. This
 * site keeps its own reading sizes (tokens.config.json `typeset: false`), so the type specimens apply the
 * typeset's size and leading themselves, the way the kits' text classes do.
 */

/** Tailwind's text sizes and their line heights at 16px (halftone-tokens' TEXT_LINE_HEIGHT). */
const SCALE = [
  ['4xl', 36, 40],
  ['3xl', 30, 36],
  ['2xl', 24, 32],
  ['xl', 20, 28],
  ['lg', 18, 28],
  ['base', 16, 24],
  ['sm', 14, 20],
  ['xs', 12, 16],
] as const;

const familyName = (id: string) => {
  const f = FONTS.find((x) => x.id === id);
  if (!f) return id;
  if (f.system) return f.category === 'mono' ? 'System mono' : 'System';
  return f.family;
};

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{children}</p>;
}

/** The three faces, each in its own font. */
export function FontFaces() {
  const { recipe } = useLiveTheme();
  const faces = [
    ['Heading', recipe.font.heading, 'font-heading font-semibold'],
    ['Body', recipe.font.body, 'font-sans'],
    ['Mono', recipe.font.mono, 'font-mono'],
  ] as const;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {faces.map(([role, id, cls]) => (
        <div key={role} className="border-border bg-card flex flex-col gap-3 rounded-xl border p-4">
          <Label>{role}</Label>
          <span className={`text-5xl leading-none ${cls}`} aria-hidden>
            Aa
          </span>
          <span className={`text-sm ${cls === 'font-mono' ? 'font-mono' : 'font-sans'}`}>{familyName(id)}</span>
        </div>
      ))}
    </div>
  );
}

/** text-4xl … text-xs at the theme's size and leading; the larger steps in the heading font. */
export function TypeScale({ sample = 'Getting paid, on time' }: { sample?: string }) {
  const { theme } = useLiveTheme();
  const { scale, leadingFactor } = theme.type;
  return (
    <ul className="flex flex-col">
      {SCALE.map(([name, size, line]) => (
        <li key={name} className="border-border flex items-baseline gap-4 border-b py-2 last:border-b-0">
          <span className="text-muted-foreground w-24 shrink-0 font-mono text-xs">
            text-{name} {Math.round(size * scale * 10) / 10}
          </span>
          <span
            className={`min-w-0 truncate ${size >= 20 ? 'font-heading font-semibold tracking-tight' : 'font-sans'}`}
            style={{ fontSize: size * scale, lineHeight: `${line * scale * leadingFactor}px` }}>
            {sample}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Long-form text at the typeset: its size, leading, flow (space between blocks) and measure. */
export function ProseSample() {
  const { theme } = useLiveTheme();
  const { size, leading, flow, measure } = theme.type;
  return (
    <div className="flex flex-col font-sans" style={{ fontSize: size, lineHeight: leading, gap: `${flow}em`, maxWidth: `${measure}ch` }}>
      <h3 className="font-heading font-semibold tracking-tight" style={{ fontSize: '1.25em', lineHeight: 1.3 }}>
        Send it the day the work ends
      </h3>
      <p>
        An invoice sent the same day is paid in <strong>14 days</strong> on average; one sent a week later takes 23. The
        work is fresh, and the person who asked for it still remembers it.
      </p>
      <p>
        Put the purchase order in <code className="bg-muted rounded px-1 py-0.5 font-mono text-[0.875em]">reference</code>, and
        name the project, not the month.
      </p>
    </div>
  );
}

/** For Foundations › Type: the faces, the scale and a paragraph, at the live theme. */
export function TypeSpecimen() {
  const { theme } = useLiveTheme();
  const { size, leading, flow, measure } = theme.type;
  return (
    <div className="kit-scope not-prose my-6 flex flex-col gap-6">
      <FontFaces />
      <div className="border-border bg-card rounded-xl border p-4">
        <TypeScale />
      </div>
      <div className="border-border bg-card flex flex-col gap-3 rounded-xl border p-5">
        <Label>
          Prose · {size}px · leading {leading} · flow {flow}em · measure {measure}ch
        </Label>
        <ProseSample />
      </div>
    </div>
  );
}
