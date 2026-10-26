'use client';
import { textStyles, type HalftoneSystem } from '@halftone-ds/tokens/system';
import { CheckIcon, SearchIcon } from 'lucide-react';
import * as React from 'react';
import { ExtraTag } from '@/components/theme/studio/colours-section';
import { ItemMenu } from '@/components/theme/studio/item-menu';
import { EditedDot, Field, inputClass, ItemPopover, openItem } from '@/components/theme/studio/item-popover';
import { LABELS, ORDER } from '@/components/theme/studio/parts';
import { FoundationSection, KnobLock, NewMenu } from '@/components/theme/studio/section';
import { addExtra, checkExtraName, deleteExtra, extraLabel, extrasOf, freeName, renameExtra, setFont, setTextStyle, TEXT_LABELS, TEXT_STYLE_NAMES, updateExtra, type TextStyleName } from '@/lib/studio/foundations';
import { drawnWeight, familyCss, isPick, loadedWeights, picksFor, previewHref, useGoogleFonts, weightRange, type FontRole } from '@/lib/studio/fonts';
import { setRecipe, useLiveTheme } from '@/lib/theme/store';

/**
 * Foundations › Typography (wireframes 1, 2 and 8): the Scale knob, a card per font role, then the 11 text styles the
 * kits draw (Text h1–h4, lead, large, p, small, muted, blockquote, code), then your own. A style follows the scale
 * until you edit it; reset brings it back.
 */

type Style = { font: FontRole; weight: number; size: number; leading: number; tracking: number };
const memo = new WeakMap<HalftoneSystem, ReturnType<typeof textStyles>>();
const stylesOf = (doc: HalftoneSystem) => {
  let s = memo.get(doc);
  if (!s) memo.set(doc, (s = textStyles(doc)));
  return s;
};
const SAMPLE: Record<string, string> = { code: 'const paid = true;', blockquote: '“Send it the day the work ends.”', muted: 'Updated two minutes ago', small: 'Due in 14 days' };
const ROLES: FontRole[] = ['heading', 'body', 'mono'];
const ROLE_LABEL: Record<FontRole, string> = { heading: 'Heading', body: 'Body', mono: 'Mono' };
const round = (n: number, p = 2) => Number(n.toFixed(p));
const meta = (family: string, s: Style) => `${family || 'System'} ${s.weight} · ${round(s.size, 1)} / ${round(s.size * s.leading, 1)} · ${round(s.tracking, 3)}em`;

/** The role's family as the theme draws it ('' is the platform font). */
function useFamily() {
  const { theme } = useLiveTheme();
  return (role: FontRole) => (role === 'mono' && theme.recipe.font.mono === 'system-mono' ? '' : theme.fonts[role]);
}

/** A sample line in a style, in the role's font (the page's .kit-scope sets --kit-font-*). */
function Sample({ name, style }: { name: string; style: Style }) {
  return (
    <span
      className="block min-w-0 truncate"
      style={{ fontFamily: `var(--kit-font-${style.font})`, fontSize: Math.min(style.size, 40), lineHeight: `${Math.min(style.size, 40) * style.leading}px`, fontWeight: style.weight, letterSpacing: `${style.tracking}em` }}>
      {SAMPLE[name] ?? 'Case studies'}
    </span>
  );
}

// ---- the Scale knob ----------------------------------------------------------------------------------------

function ScaleKnob() {
  const { recipe } = useLiveTheme();
  const ids = { size: React.useId(), leading: React.useId(), flow: React.useId(), measure: React.useId() };
  return (
    <div className="flex items-center gap-1">
      <ItemPopover
        id="knob.scale"
        title="Scale"
        slot="base"
        align="end"
        trigger={
          <button type="button" className="border-border hover:bg-accent focus-visible:ring-ring inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2">
            Scale · {recipe.size}px · {LABELS[recipe.leading].toLowerCase()}
          </button>
        }
        status={{ note: 'Rewrites every text style you haven’t edited. Edited styles keep their values.' }}>
        {(['size', 'leading', 'flow', 'measure'] as const).map((key) => (
          <Field key={key} label={{ size: 'Base size', leading: 'Leading', flow: 'Flow', measure: 'Measure' }[key]} htmlFor={ids[key]}>
            <select id={ids[key]} value={recipe[key]} onChange={(e) => setRecipe({ [key]: e.target.value })} className={`${inputClass} w-full`}>
              {ORDER[key].map((v) => (
                <option key={v} value={v}>
                  {LABELS[v] ?? v}
                </option>
              ))}
            </select>
          </Field>
        ))}
      </ItemPopover>
      <KnobLock keys={['size', 'leading', 'flow', 'measure']} label="the scale" />
    </div>
  );
}

// ---- fonts ----------------------------------------------------------------------------------------

function FontList({ role, current, onPick }: { role: FontRole; current: string; onPick: (family: string) => void }) {
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);
  const listId = React.useId();
  const google = useGoogleFonts();
  const q = query.trim().toLowerCase();
  const picks = picksFor(role).filter((f) => !q || f.family.toLowerCase().includes(q));
  const pickNames = new Set(picksFor(role).map((f) => f.family));
  // The list is in popularity order; a search puts the exact name first, then names that start with it.
  const rank = (family: string) => (family.toLowerCase() === q ? 0 : family.toLowerCase().startsWith(q) ? 1 : 2);
  const rest = (google ?? [])
    .filter((f) => !pickNames.has(f.family) && (!q || f.family.toLowerCase().includes(q)))
    .sort((a, b) => (q ? rank(a.family) - rank(b.family) : 0))
    .slice(0, q ? 60 : 30);
  const options = [
    ...picks.map((f) => ({ family: f.system ? '' : f.family, label: f.system ? (role === 'mono' ? 'System mono' : 'System') : f.family, weights: f.weights, group: 'Halftone picks' })),
    ...rest.map((f) => ({ family: f.family, label: f.family, weights: f.weights, group: 'All Google Fonts' })),
  ];
  const href = previewHref(options.map((o) => o.family));
  const pick = (i: number) => {
    const o = options[i];
    if (o) onPick(o.family || (role === 'mono' ? 'Menlo' : 'System'));
  };
  return (
    <div className="flex flex-col gap-1.5">
      {href ? <link rel="stylesheet" href={href} /> : null}
      <div className="relative">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2" aria-hidden />
        <input
          data-autofocus
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={options[active] ? `${listId}-${active}` : undefined}
          aria-label={`Search fonts for ${ROLE_LABEL[role].toLowerCase()}`}
          placeholder="Search Google Fonts"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((i) => Math.max(0, Math.min(options.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1))));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              pick(active);
            }
          }}
          className={`${inputClass} w-full pl-7`}
        />
      </div>
      <ul id={listId} role="listbox" aria-label="Fonts" className="border-border max-h-64 overflow-y-auto rounded-md border p-1">
        {options.map((o, i) => (
          <React.Fragment key={`${o.group}-${o.label}`}>
            {i === 0 || options[i - 1].group !== o.group ? (
              <li role="presentation" className="text-muted-foreground px-1.5 pb-0.5 pt-1.5 text-[11px] font-medium uppercase tracking-wide">
                {o.group}
              </li>
            ) : null}
            <li
              id={`${listId}-${i}`}
              role="option"
              aria-selected={o.family === current}
              ref={i === active ? (el) => el?.scrollIntoView({ block: 'nearest' }) : undefined}
              onMouseDown={(e) => e.preventDefault()}
              onMouseMove={() => setActive(i)}
              onClick={() => pick(i)}
              className={`flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 ${i === active ? 'bg-accent text-accent-foreground' : ''}`}>
              <span className="min-w-0 flex-1 truncate text-base" style={{ fontFamily: familyCss(o.family, role) }}>
                {o.label}
              </span>
              <span className="text-muted-foreground font-mono text-[11px]">{weightRange(o.weights)}</span>
              {o.family === current ? <CheckIcon className="size-3.5 shrink-0" aria-hidden /> : <span className="w-3.5" />}
            </li>
          </React.Fragment>
        ))}
        {google === null ? <li className="text-muted-foreground px-1.5 py-1 text-xs">Loading every Google Font…</li> : null}
        {!options.length && google ? <li className="text-muted-foreground px-1.5 py-1 text-sm">No family matches.</li> : null}
      </ul>
    </div>
  );
}

function FontCard({ role }: { role: FontRole }) {
  const { system: doc } = useLiveTheme();
  const family = useFamily()(role);
  const pick = !family || isPick(family);
  const edited = !!doc.fonts[role];
  // The weights the kits load, not every weight the family has: those are what a text style can draw.
  const loaded = loadedWeights(family);
  return (
    <ItemMenu
      id={`font.${role}`}
      spec={{ title: `${ROLE_LABEL[role]} font`, usage: { keys: [`font.${role}`], label: `${ROLE_LABEL[role]} font` }, copy: { cls: role === 'body' ? 'font-sans' : `font-${role}`, variable: `--kit-font-${role}`, value: family || 'system-ui' }, onReset: edited ? () => setFont(role, null) : null, lock: [role] }}>
      <ItemPopover
        id={`font.${role}`}
        title={`${ROLE_LABEL[role]} font`}
        slot={role}
        width="w-96"
        trigger={
          <button
            type="button"
            aria-label={`${ROLE_LABEL[role]} font: ${family || 'System'}. Change`}
            className="border-border hover:bg-accent focus-visible:ring-ring flex w-full min-w-0 flex-col gap-2 rounded-xl border p-3 text-left focus-visible:outline-none focus-visible:ring-2">
            <span className="text-4xl leading-none" style={{ fontFamily: familyCss(family, role) }} aria-hidden>
              Aa
            </span>
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <span className="truncate">{family || (role === 'mono' ? 'System mono' : 'System')}</span>
              {edited ? <EditedDot /> : null}
            </span>
            <span className="text-muted-foreground text-xs">
              {ROLE_LABEL[role]} · {pick ? 'Halftone pick' : 'Google Font'} · {loaded ? `loads ${weightRange(loaded)}` : 'every weight'}
            </span>
          </button>
        }
        preview={
          <p className="truncate text-2xl" style={{ fontFamily: familyCss(family, role) }}>
            {family || 'System'} · Aa Bb 123
          </p>
        }
        status={{
          edited: edited ? { onReset: () => setFont(role, null) } : null,
          note: pick ? 'A Halftone pick: a theme code carries it.' : 'Outside the picks: the system shares as a JSON link and a .halftone.json, not a code.',
        }}>
        <FontList role={role} current={family} onPick={(f) => setFont(role, f)} />
      </ItemPopover>
    </ItemMenu>
  );
}

// ---- text styles ----------------------------------------------------------------------------------------

function StyleFields({ style, family, onChange, edited, onReset }: { style: Style; family: (r: FontRole) => string; onChange: (patch: Partial<Style>, coalesce?: string) => void; edited: string[]; onReset?: (key: keyof Style) => void }) {
  const ids = { font: React.useId(), weight: React.useId(), size: React.useId(), leading: React.useId(), tracking: React.useId() };
  const mark = (key: keyof Style) =>
    edited.includes(key) && onReset ? (
      <button type="button" onClick={() => onReset(key)} aria-label={`Reset ${key} to the scale`} className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1 text-xs underline underline-offset-2">
        <EditedDot />
        reset
      </button>
    ) : null;
  const num = (key: 'size' | 'leading' | 'tracking', step: number, min: number, max: number) => (
    <input
      id={ids[key]}
      type="number"
      inputMode="decimal"
      step={step}
      min={min}
      max={max}
      value={round(style[key], key === 'tracking' ? 3 : 2)}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (e.target.value !== '' && Number.isFinite(v) && v >= min && v <= max) onChange({ [key]: v }, `type.${key}`);
      }}
      className={`${inputClass} w-full tabular-nums`}
    />
  );
  return (
    <>
      <Field label="Font" htmlFor={ids.font}>
        <select id={ids.font} value={style.font} onChange={(e) => onChange({ font: e.target.value as FontRole })} className={`${inputClass} w-full`}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]} · {family(r) || 'System'}
            </option>
          ))}
        </select>
        {mark('font')}
      </Field>
      <Field label="Weight" htmlFor={ids.weight}>
        <select id={ids.weight} value={style.weight} onChange={(e) => onChange({ weight: Number(e.target.value) })} className={`${inputClass} w-full`}>
          {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((w) => {
            // The kits load a few weights of a font; another draws as the nearest one, here and in both kits.
            const drawn = drawnWeight(family(style.font), w);
            return (
              <option key={w} value={w}>
                {w}
                {drawn !== w ? ` (draws as ${drawn})` : ''}
              </option>
            );
          })}
        </select>
        {mark('weight')}
      </Field>
      <Field label="Size px" htmlFor={ids.size}>
        {num('size', 1, 4, 400)}
        {mark('size')}
      </Field>
      <Field label="Line ×" htmlFor={ids.leading}>
        {num('leading', 0.05, 0.5, 4)}
        {mark('leading')}
      </Field>
      <Field label="Track em" htmlFor={ids.tracking}>
        {num('tracking', 0.005, -0.5, 1)}
        {mark('tracking')}
      </Field>
    </>
  );
}

function TextStyleRow({ name }: { name: TextStyleName }) {
  const { system: doc } = useLiveTheme();
  const family = useFamily();
  const style = stylesOf(doc)[name] as Style & { edited: string[] };
  const edited = style.edited;
  const label = TEXT_LABELS[name];
  return (
    <ItemMenu
      id={`text.${name}`}
      spec={{
        title: `${label} · text style`,
        usage: { keys: [`type.${name}`], label },
        copy: { cls: `type-${name}`, variable: `--type-${name}-size`, value: `${round(style.size, 1)}px/${round(style.size * style.leading, 1)}px ${style.weight}` },
        onReset: edited.length ? () => setTextStyle(name, null) : null,
        onDuplicate: () => {
          const token = freeName(doc, 'text', `${name}-copy`);
          const { font, weight, size, leading, tracking } = style;
          addExtra('text', { name: token, font, weight, size, leading, tracking });
          openItem(`extra.text.${token}`);
        },
      }}>
      <ItemPopover
        id={`text.${name}`}
        title={label}
        slot={name}
        trigger={
          <button
            type="button"
            aria-label={`${label}, ${meta(family(style.font), style)}${edited.length ? ', edited' : ''}. Edit`}
            className="hover:bg-accent focus-visible:ring-ring grid w-full min-w-0 grid-cols-[7rem_minmax(0,1fr)] items-center gap-x-3 gap-y-0.5 rounded-lg px-2 py-2 text-left focus-visible:outline-none focus-visible:ring-2 sm:grid-cols-[8rem_minmax(0,1fr)_auto]">
            <span className="flex items-center gap-1.5 text-xs font-medium">
              {label}
              <code className="bg-muted text-muted-foreground rounded px-1 font-mono text-[10px]">{name}</code>
              {edited.length ? <EditedDot /> : null}
            </span>
            <Sample name={name} style={style} />
            <span className="text-muted-foreground font-mono text-[11px] max-sm:col-span-2">{meta(family(style.font), style)}</span>
          </button>
        }
        preview={<Sample name={name} style={style} />}
        status={{
          edited: edited.length ? { label: `${edited.map((k) => k.charAt(0).toUpperCase() + k.slice(1)).join(', ')} edited`, action: 'reset to scale', onReset: () => setTextStyle(name, null) } : null,
        }}>
        <StyleFields style={style} family={family} edited={edited} onChange={(patch, c) => setTextStyle(name, patch, c ? `text.${name}.${c}` : undefined)} onReset={(key) => setTextStyle(name, { [key]: null })} />
      </ItemPopover>
    </ItemMenu>
  );
}

function ExtraTextRow({ item }: { item: Style & { name: string } }) {
  const { system: doc } = useLiveTheme();
  const family = useFamily();
  const name = item.name;
  const id = `extra.text.${name}`;
  return (
    <ItemMenu
      id={id}
      spec={{
        title: `${extraLabel(name)} · extra`,
        copy: { cls: `type-${name}`, variable: `--type-${name}-size`, value: `${item.size}px/${round(item.size * item.leading, 1)}px ${item.weight}` },
        onDuplicate: () => {
          const token = freeName(doc, 'text', `${name}-copy`);
          addExtra('text', { ...item, name: token });
          openItem(`extra.text.${token}`);
        },
        onDelete: () => deleteExtra('text', name),
      }}>
      <ItemPopover
        id={id}
        title={extraLabel(name)}
        extra={{ name: extraLabel(name), token: name, onRename: (typed) => renameExtra(doc, 'text', name, typed), check: (typed) => checkExtraName(doc, 'text', name, typed), onDelete: () => deleteExtra('text', name) }}
        trigger={
          <button
            type="button"
            aria-label={`${extraLabel(name)}, extra text style. Edit`}
            className="hover:bg-accent focus-visible:ring-ring grid w-full min-w-0 grid-cols-[7rem_minmax(0,1fr)] items-center gap-x-3 gap-y-0.5 rounded-lg px-2 py-2 text-left focus-visible:outline-none focus-visible:ring-2 sm:grid-cols-[8rem_minmax(0,1fr)_auto]">
            <span className="flex min-w-0 flex-col gap-0.5 text-xs font-medium">
              <span className="truncate">{extraLabel(name)}</span>
              <ExtraTag />
            </span>
            <Sample name={name} style={item} />
            <span className="text-muted-foreground font-mono text-[11px] max-sm:col-span-2">{meta(family(item.font), item)}</span>
          </button>
        }
        preview={<Sample name={name} style={item} />}
        status={{ note: <span>Exported as <code className="font-mono">type-{name}</code> (web) and <code className="font-mono">text-type-{name}</code> (mobile). No kit component reads it.</span> }}>
        <StyleFields style={item} family={family} edited={[]} onChange={(patch, c) => updateExtra('text', name, (e) => ({ ...e, ...patch }), c ? `extra.text.${name}.${c}` : undefined)} />
      </ItemPopover>
    </ItemMenu>
  );
}

export function TypographySection() {
  const { system: doc } = useLiveTheme();
  const extras = extrasOf(doc, 'text') as unknown as (Style & { name: string })[];
  const styles = stylesOf(doc);
  return (
    <FoundationSection
      id="typography"
      title="Typography"
      count={TEXT_STYLE_NAMES.length + extras.length}
      knob={<ScaleKnob />}
      add={
        <NewMenu
          section="typography"
          label="New text style"
          heading="New text style · start from"
          options={TEXT_STYLE_NAMES.map((n) => ({ id: n, label: TEXT_LABELS[n] }))}
          onPick={(from) => {
            const { font, weight, size, leading, tracking } = styles[from as TextStyleName];
            const token = freeName(doc, 'text', 'new-text-style');
            addExtra('text', { name: token, font, weight, size, leading, tracking });
            requestAnimationFrame(() => openItem(`extra.text.${token}`));
          }}
        />
      }>
      <div className="grid gap-2 sm:grid-cols-3">
        {ROLES.map((role) => (
          <FontCard key={role} role={role} />
        ))}
      </div>
      <ul className="divide-border flex flex-col divide-y">
        {TEXT_STYLE_NAMES.map((name) => (
          <li key={name}>
            <TextStyleRow name={name} />
          </li>
        ))}
        {extras.map((item, i) => (
          <li key={`extra-${i}`}>
            <ExtraTextRow item={item} />
          </li>
        ))}
      </ul>
    </FoundationSection>
  );
}
