'use client';
import { COLOR_ROLES, type HalftoneSystem } from '@halftone-ds/tokens/system';
import { CheckIcon, ChevronDownIcon, SearchIcon } from 'lucide-react';
import * as React from 'react';
import { inputClass } from '@/components/theme/studio/item-popover';
import { RAMP_LABELS, rampsOf, readHex, targetLabel } from '@/lib/studio/foundations';

/** A colour square with a hairline, so white and black both show. */
export function Swatch({ hex, className = 'size-5' }: { hex: string | null | undefined; className?: string }) {
  return <span className={`ring-foreground/15 inline-block shrink-0 rounded ring-1 ring-inset ${className}`} style={{ background: hex ?? 'transparent' }} aria-hidden />;
}

/**
 * A hex value: the browser's colour picker and the hex as text. Valid text applies as you type; a drag of the picker
 * applies live and is one undo step (the caller coalesces it).
 */
export function HexField({ id, value, onChange, label }: { id?: string; value: string; onChange: (hex: string) => void; label: string }) {
  const [draft, setDraft] = React.useState<string | null>(null);
  const shown = draft ?? value.toUpperCase();
  const invalid = draft !== null && readHex(draft) === null;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5">
      <input
        type="color"
        value={value}
        aria-label={`${label}, colour picker`}
        onChange={(e) => onChange(e.target.value.toLowerCase())}
        className="border-border size-8 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-0"
      />
      <input
        id={id}
        value={shown}
        spellCheck={false}
        autoComplete="off"
        aria-label={id ? undefined : label}
        aria-invalid={invalid}
        onChange={(e) => {
          setDraft(e.target.value);
          // Six digits apply as you type; '#abc' waits for the blur, so typing '#e11d48' doesn't flash #ee1111.
          const hex = /^#?[0-9a-f]{6}$/i.test(e.target.value.trim()) ? readHex(e.target.value) : null;
          if (hex && hex !== value) onChange(hex);
        }}
        onBlur={() => {
          const hex = draft === null ? null : readHex(draft);
          if (hex && hex !== value) onChange(hex);
          setDraft(null);
        }}
        className={`${inputClass} w-full font-mono uppercase`}
      />
    </div>
  );
}

type Option = { value: string; label: string; hex: string; group: string };

/** Every step of every ramp, as the token picker lists them (the neutral's white and black too). */
function options(doc: HalftoneSystem): Option[] {
  const ramps = rampsOf(doc);
  const out: Option[] = [];
  for (const role of COLOR_ROLES) {
    const values = ramps[role].values as Record<string, string>;
    const steps = Object.keys(values).sort((a, b) => Number(a) - Number(b));
    for (const step of steps) out.push({ value: `${role}.${step}`, label: `${RAMP_LABELS[role]} ${step}`, hex: values[step], group: RAMP_LABELS[role] });
  }
  return out;
}

/**
 * A role's colour in one mode: a ramp step from a searchable list (as Subframe's token picker), or any hex typed into
 * the search. A combobox: the arrows move through the list, Enter picks.
 */
export function TokenPicker({ doc, value, hex, onPick, label }: { doc: HalftoneSystem; value: string | null; hex: string; onPick: (value: string) => void; label: string }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);
  const listId = React.useId();
  // After a pick (or Esc from the list) focus goes back to the closed picker's button, not the popover.
  const refocus = React.useRef(false);
  const all = React.useMemo(() => options(doc), [doc]);
  const q = query.trim().toLowerCase();
  const typed = readHex(query);
  const list = [
    ...(typed ? [{ value: typed, label: `Use ${typed.toUpperCase()}`, hex: typed, group: 'Custom' }] : []),
    ...all.filter((o) => !q || o.label.toLowerCase().includes(q) || o.value.includes(q) || o.hex.includes(q.replace(/^#/, ''))),
  ];
  const pick = (o: Option | undefined) => {
    if (!o) return;
    onPick(o.value);
    refocus.current = true;
    setOpen(false);
    setQuery('');
  };
  if (!open) {
    return (
      <button
        type="button"
        ref={(el) => {
          if (el && refocus.current) {
            refocus.current = false;
            el.focus();
          }
        }}
        onClick={() => {
          setOpen(true);
          setActive(Math.max(0, all.findIndex((o) => o.value === value)));
        }}
        aria-label={`${label}: ${targetLabel(value)}. Change`}
        className="border-border hover:bg-accent focus-visible:ring-ring flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md border px-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2">
        <Swatch hex={hex} className="size-4" />
        <span className="min-w-0 flex-1 truncate">{targetLabel(value)}</span>
        <ChevronDownIcon className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
      </button>
    );
  }
  const activeOption = list[Math.min(active, list.length - 1)];
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="relative">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2" aria-hidden />
        <input
          // A field the person asked for: it takes focus when the list opens.
          autoFocus
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeOption ? `${listId}-${activeOption.value}` : undefined}
          aria-label={`${label}: search tokens or type a hex`}
          placeholder="brand 600, #2563eb…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onBlur={(e) => {
            if (!e.currentTarget.parentElement?.parentElement?.contains(e.relatedTarget)) setOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((i) => Math.max(0, Math.min(list.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1))));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              pick(activeOption);
            }
          }}
          className={`${inputClass} w-full pl-7`}
        />
      </div>
      <ul id={listId} role="listbox" aria-label={`${label} tokens`} className="border-border max-h-56 overflow-y-auto rounded-md border p-1">
        {list.length ? (
          list.map((o, i) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value}
                id={`${listId}-${o.value}`}
                role="option"
                aria-selected={selected}
                ref={i === active ? (el) => el?.scrollIntoView({ block: 'nearest' }) : undefined}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(o)}
                onMouseMove={() => setActive(i)}
                className={`flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm ${i === active ? 'bg-accent text-accent-foreground' : ''}`}>
                <Swatch hex={o.hex} className="size-4" />
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                <span className="text-muted-foreground font-mono text-[11px] uppercase">{o.hex}</span>
                {selected ? <CheckIcon className="size-3.5 shrink-0" aria-hidden /> : <span className="w-3.5" />}
              </li>
            );
          })
        ) : (
          <li className="text-muted-foreground px-1.5 py-1 text-sm">No token matches. Type a hex to use any colour.</li>
        )}
      </ul>
    </div>
  );
}
