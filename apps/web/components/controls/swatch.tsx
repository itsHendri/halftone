'use client';
import { cn } from 'cn';
import * as React from 'react';

/** `#abc`, `abc`, `#aabbcc` → `#aabbcc`; null for anything else. */
export function readHex(input: string): string | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (!m) return null;
  const h = m[1].toLowerCase();
  return `#${h.length === 3 ? [...h].map((c) => c + c).join('') : h}`;
}

/** A colour square with a hairline, so white and black both show on any surface. */
export function Swatch({ hex, className }: { hex: string | null | undefined; className?: string }) {
  return <span aria-hidden className={cn('ring-foreground/15 inline-block size-5 shrink-0 rounded ring-1 ring-inset', className)} style={{ background: hex ?? 'transparent' }} />;
}

/**
 * A hex colour: the browser's colour picker beside the hex as text. Six typed digits apply as you type; a short `#abc`
 * waits for Enter or the blur, so typing `#e11d48` doesn't flash `#ee1111` on the way. A drag of the picker applies
 * live (coalesce it into one undo step in the caller).
 */
export function HexField({ id, value, onChange, label, className }: { id?: string; value: string; onChange: (hex: string) => void; label: string; className?: string }) {
  const [draft, setDraft] = React.useState<string | null>(null);
  const shown = draft ?? value.toUpperCase();
  const invalid = draft !== null && readHex(draft) === null;
  const commit = () => {
    const hex = draft === null ? null : readHex(draft);
    if (hex && hex !== value) onChange(hex);
    setDraft(null);
  };
  return (
    <div className={cn('flex min-w-0 flex-1 items-center gap-1.5', className)}>
      <input
        type="color"
        value={readHex(value) ?? '#000000'}
        aria-label={`${label}, colour picker`}
        onChange={(e) => onChange(e.target.value.toLowerCase())}
        className="border-border focus-visible:ring-ring/50 size-8 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5 outline-none focus-visible:ring-[3px] [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
      />
      <input
        id={id}
        value={shown}
        spellCheck={false}
        autoComplete="off"
        aria-label={id ? undefined : label}
        aria-invalid={invalid || undefined}
        onChange={(e) => {
          setDraft(e.target.value);
          const hex = /^#?[0-9a-f]{6}$/i.test(e.target.value.trim()) ? readHex(e.target.value) : null;
          if (hex && hex !== value) onChange(hex);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape' && draft !== null) {
            e.preventDefault();
            setDraft(null);
          }
        }}
        onBlur={commit}
        className="border-border bg-background focus-visible:ring-ring/50 aria-invalid:border-destructive h-8 w-full min-w-0 rounded-md border px-2 font-mono text-sm uppercase outline-none focus-visible:ring-[3px]"
      />
    </div>
  );
}
