'use client';
import { systemRadii, type HalftoneSystem } from '@halftone-ds/tokens/system';
import { MinusIcon, PlusIcon } from 'lucide-react';
import * as React from 'react';
import { ExtraTag } from '@/components/theme/studio/colours-section';
import { HexField, TokenPicker } from '@/components/theme/studio/fields';
import { ItemMenu } from '@/components/theme/studio/item-menu';
import { EditedDot, Field, inputClass, ItemPopover, openItem, smallButton } from '@/components/theme/studio/item-popover';
import { LABELS, ORDER } from '@/components/theme/studio/parts';
import { FoundationSection, KnobLock, NewMenu, Segmented, type SectionId } from '@/components/theme/studio/section';
import {
  addExtra,
  checkExtraName,
  deleteExtra,
  extraLabel,
  extrasOf,
  freeName,
  layerCss,
  overridesOf,
  renameExtra,
  roleHex,
  roleTarget,
  setBorder,
  setRadius,
  setRole,
  setShadow,
  shadowLayers,
  updateExtra,
  type Layer,
  type Mode,
} from '@/lib/studio/foundations';
import { usageOf } from '@/lib/studio/usage';
import { base } from '@/lib/theme/base';
import { useMode } from '@/lib/theme/mode';
import { setRecipe, useLiveTheme, type LockKey } from '@/lib/theme/store';

/**
 * Foundations › Corners, Shadows and Borders (wireframes 1, 2 and 8). Each base knob is the recipe axis that
 * rewrites every item you haven't edited (Base radius, Depth, Border width), with its lock for shuffle.
 */

/** A recipe axis as a small select in a section header, with its lock. */
function Knob<K extends 'radius' | 'depth' | 'border'>({ axis, label }: { axis: K; label: string }) {
  const { recipe } = useLiveTheme();
  const id = React.useId();
  return (
    <div className="flex items-center gap-1">
      <label htmlFor={id} className="text-muted-foreground text-xs">
        {label}
      </label>
      <select id={id} value={recipe[axis]} onChange={(e) => setRecipe({ [axis]: e.target.value })} className="border-border bg-background focus-visible:ring-ring h-7 rounded-full border px-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2">
        {ORDER[axis].map((v) => (
          <option key={v} value={v}>
            {LABELS[v] ?? v}
          </option>
        ))}
      </select>
      <KnobLock keys={[axis]} label={label.toLowerCase()} />
    </div>
  );
}

/** "Used by Card, Input, Menu +4", from the kits' usage map. */
function UsedBy({ keys }: { keys: string[] }) {
  const list = usageOf(keys);
  if (!list.length) return <span>No kit component draws it directly.</span>;
  const names = list.map((u) => u.entry.title);
  return (
    <span>
      Used by <span className="text-foreground">{names.slice(0, 5).join(', ')}</span>
      {names.length > 5 ? ` +${names.length - 5}` : ''}
    </span>
  );
}

const num = (value: number, onChange: (v: number) => void, { id, min, max, step = 1, label }: { id?: string; min: number; max: number; step?: number; label?: string }) => (
  <input
    id={id}
    aria-label={label}
    type="number"
    inputMode="decimal"
    min={min}
    max={max}
    step={step}
    value={value}
    onChange={(e) => {
      const v = Number(e.target.value);
      if (e.target.value !== '' && Number.isFinite(v) && v >= min && v <= max) onChange(v);
    }}
    className={`${inputClass} w-full tabular-nums`}
  />
);

// ---- corners ----------------------------------------------------------------------------------------

const RADIUS_LABEL: Record<string, string> = { sm: 'Small', md: 'Medium', lg: 'Large', xl: 'XL', '2xl': '2XL', full: 'Full' };

function CornerTile({ px, label, extra }: { px: number; label: string; extra?: boolean }) {
  return (
    <span className="flex w-full flex-col items-center gap-1.5 p-1.5">
      <span className="border-muted-foreground bg-muted size-12 border-l-2 border-t-2" style={{ borderTopLeftRadius: Math.min(px, 9999) }} aria-hidden />
      <span className="text-muted-foreground text-xs">{label}</span>
      {extra ? <ExtraTag /> : null}
    </span>
  );
}

function CornerItem({ step, px }: { step: string; px: number }) {
  const { system: doc, theme } = useLiveTheme();
  const id = React.useId();
  const full = step === 'full';
  const edited = !full && overridesOf(doc).has(`radius.${step}`);
  const label = `${RADIUS_LABEL[step]}${full ? '' : ` · ${px}`}`;
  return (
    <ItemMenu
      id={`corner.${step}`}
      spec={{
        title: `${RADIUS_LABEL[step]} · corner`,
        usage: { keys: [`radius.${step}`], label: `rounded-${step}` },
        copy: { cls: `rounded-${step}`, value: full ? '9999px' : `${px}px` },
        onReset: edited ? () => setRadius(step, null) : null,
        onDuplicate: () => {
          const token = freeName(doc, 'radius', `${step}-copy`);
          addExtra('radius', { name: token, value: full ? 9999 : px });
          openItem(`extra.radius.${token}`);
        },
        lock: ['radius'],
      }}>
      <ItemPopover
        id={`corner.${step}`}
        title={RADIUS_LABEL[step]}
        slot={step}
        trigger={
          <button type="button" aria-label={`Corner ${label}${edited ? ', edited' : ''}. Edit`} className="hover:bg-accent focus-visible:ring-ring relative w-full rounded-lg focus-visible:outline-none focus-visible:ring-2">
            <CornerTile px={full ? 9999 : px} label={label} />
            {edited ? <EditedDot className="absolute left-1.5 top-1.5" /> : null}
          </button>
        }
        preview={<div className="bg-primary-subtle border-primary h-14 border-2" style={{ borderRadius: full ? 9999 : px }} aria-hidden />}
        status={{
          edited: edited ? { onReset: () => setRadius(step, null) } : null,
          note: full ? 'Always a circle: rounded-full stays 9999px.' : edited ? 'Overridden: it no longer follows Base radius.' : `Follows Base radius (${theme.radius}px × its ratio).`,
          usedBy: <UsedBy keys={[`radius.${step}`]} />,
        }}>
        {full ? null : (
          <Field label="Radius px" htmlFor={id}>
            {num(px, (v) => setRadius(step, v), { id, min: 0, max: 9999 })}
          </Field>
        )}
      </ItemPopover>
    </ItemMenu>
  );
}

function ExtraCorner({ item }: { item: { name: string; value: number } }) {
  const { system: doc } = useLiveTheme();
  const id = React.useId();
  const name = item.name;
  return (
    <ItemMenu
      id={`extra.radius.${name}`}
      spec={{
        title: `${extraLabel(name)} · extra`,
        copy: { cls: `rounded-${name}`, value: `${item.value}px` },
        onDuplicate: () => {
          const token = freeName(doc, 'radius', `${name}-copy`);
          addExtra('radius', { ...item, name: token });
          openItem(`extra.radius.${token}`);
        },
        onDelete: () => deleteExtra('radius', name),
      }}>
      <ItemPopover
        id={`extra.radius.${name}`}
        title={extraLabel(name)}
        extra={{ name: extraLabel(name), token: name, onRename: (t) => renameExtra(doc, 'radius', name, t), check: (t) => checkExtraName(doc, 'radius', name, t), onDelete: () => deleteExtra('radius', name) }}
        trigger={
          <button type="button" aria-label={`${extraLabel(name)}, extra corner, ${item.value}px. Edit`} className="hover:bg-accent focus-visible:ring-ring w-full rounded-lg focus-visible:outline-none focus-visible:ring-2">
            <CornerTile px={item.value} label={`${extraLabel(name)} · ${item.value}`} extra />
          </button>
        }
        preview={<div className="bg-primary-subtle border-primary h-14 border-2" style={{ borderRadius: item.value }} aria-hidden />}
        status={{ note: <span>Exported as <code className="font-mono">rounded-{name}</code>. No kit component reads it.</span> }}>
        <Field label="Radius px" htmlFor={id}>
          {num(item.value, (v) => updateExtra('radius', name, (e) => ({ ...e, value: v }), `extra.radius.${name}`), { id, min: 0, max: 9999 })}
        </Field>
      </ItemPopover>
    </ItemMenu>
  );
}

export function CornersSection() {
  const { system: doc, theme } = useLiveTheme();
  const radii = systemRadii(doc, base, theme) as Record<string, number>;
  const extras = extrasOf(doc, 'radius') as unknown as { name: string; value: number }[];
  return (
    <FoundationSection
      id="corners"
      title="Corners"
      count={6 + extras.length}
      knob={<Knob axis="radius" label="Base radius" />}
      add={<NewFrom section="corners" kind="radius" label="New corner" options={Object.keys(radii).map((s) => ({ id: s, label: `${RADIUS_LABEL[s]} · ${radii[s]}px` }))} make={(s, token) => ({ name: token, value: radii[s] })} />}>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {[...Object.entries(radii), ['full', 9999] as const].map(([step, px]) => (
          <CornerItem key={step} step={step} px={px} />
        ))}
        {extras.map((item, i) => (
          <ExtraCorner key={i} item={item} />
        ))}
      </div>
    </FoundationSection>
  );
}

/** "+ New" for a section that copies an item: pick what to start from, the copy lands at the end and opens. */
function NewFrom({ section, kind, label, options, make }: { section: SectionId; kind: 'radius' | 'shadow' | 'border'; label: string; options: { id: string; label: string }[]; make: (from: string, token: string) => Record<string, unknown> & { name: string } }) {
  const { system: doc } = useLiveTheme();
  return (
    <NewMenu
      section={section}
      label={label}
      heading={`${label} · start from`}
      options={options}
      onPick={(from) => {
        const token = freeName(doc, kind, `new-${kind === 'radius' ? 'corner' : kind}`);
        addExtra(kind, make(from, token));
        requestAnimationFrame(() => openItem(`extra.${kind}.${token}`));
      }}
    />
  );
}

// ---- shadows ----------------------------------------------------------------------------------------

const describeLayers = (layers: Layer[]) =>
  layers.length ? layers.map((l) => `${l.x} ${l.y} ${l.blur} ${l.spread} · ${l.color === '#000000' ? 'black' : l.color} ${Math.round(l.alpha * 100)}%`).join(' + ') : 'none';

/** The layer editor: x, y, blur, spread, colour, alpha and inset per layer, plus and minus a layer. */
function Layers({ layers, onChange }: { layers: Layer[]; onChange: (layers: Layer[], coalesce?: string) => void }) {
  const set = (i: number, patch: Partial<Layer>, key?: string) => onChange(layers.map((l, j) => (j === i ? { ...l, ...patch } : l)), key && `${i}.${key}`);
  return (
    <div className="flex flex-col gap-2">
      {layers.map((l, i) => (
        <fieldset key={i} className="border-border flex flex-col gap-1.5 rounded-lg border p-2">
          <legend className="text-muted-foreground px-1 text-xs font-medium">Layer {i + 1}</legend>
          <div className="grid grid-cols-4 gap-1.5">
            {(['x', 'y', 'blur', 'spread'] as const).map((k) => (
              <label key={k} className="flex flex-col gap-0.5 text-[11px]">
                <span className="text-muted-foreground uppercase">{k === 'blur' ? 'B' : k === 'spread' ? 'S' : k.toUpperCase()}</span>
                {num(l[k], (v) => set(i, { [k]: v }, k), { min: k === 'blur' ? 0 : -200, max: k === 'blur' ? 400 : 200, label: `Layer ${i + 1} ${k}` })}
              </label>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <HexField label={`Layer ${i + 1} colour`} value={l.color} onChange={(hex) => set(i, { color: hex }, 'color')} />
            <div className="w-20 shrink-0">{num(Math.round(l.alpha * 100), (v) => set(i, { alpha: v / 100 }, 'alpha'), { min: 0, max: 100, label: `Layer ${i + 1} opacity, percent` })}</div>
            <span className="text-muted-foreground text-xs">%</span>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={!!l.inset}
                onChange={(e) => {
                  const { inset: _i, ...rest } = l;
                  onChange(layers.map((x, j) => (j === i ? (e.target.checked ? { ...rest, inset: true } : rest) : x)));
                }}
              />
              Inset
            </label>
            <button type="button" onClick={() => onChange(layers.filter((_, j) => j !== i))} className={smallButton} aria-label={`Remove layer ${i + 1}`}>
              <MinusIcon className="size-3.5" aria-hidden />
              Remove
            </button>
          </div>
        </fieldset>
      ))}
      <button type="button" className={`${smallButton} self-start`} onClick={() => onChange([...layers, { x: 0, y: 4, blur: 12, spread: -2, color: '#000000', alpha: 0.08 }])}>
        <PlusIcon className="size-3.5" aria-hidden />
        Add a layer
      </button>
    </div>
  );
}

function ShadowCard({ css, label, meta, extra }: { css: string; label: string; meta: string; extra?: boolean }) {
  return (
    <span className="flex w-full flex-col gap-2 p-2">
      <span className="bg-card border-border flex h-16 items-end rounded-lg border p-2" style={{ boxShadow: css }}>
        <span className="text-xs font-medium">{label}</span>
      </span>
      <span className="text-muted-foreground truncate font-mono text-[11px]">{meta}</span>
      {extra ? <ExtraTag /> : null}
    </span>
  );
}

function ShadowEditor({ value, onChange, mode, setMode }: { value: { light: Layer[]; dark: Layer[] }; onChange: (v: { light: Layer[]; dark: Layer[] }, coalesce?: string) => void; mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <>
      <Field label="Editing">
        <Segmented
          label="Shadow mode"
          value={mode}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          onChange={setMode}
        />
      </Field>
      <Layers layers={value[mode]} onChange={(layers, c) => onChange({ ...value, [mode]: layers }, c && `${mode}.${c}`)} />
    </>
  );
}

function ShadowItem({ level }: { level: string }) {
  const { system: doc } = useLiveTheme();
  const site = useMode();
  const [picked, setPicked] = React.useState<Mode | null>(null);
  const mode = picked ?? site;
  const value = shadowLayers(doc, level);
  const edited = overridesOf(doc).has(`shadow.${level}`);
  const cls = { '1': 'shadow-sm', '2': 'shadow-md', '3': 'shadow-lg' }[level]!;
  return (
    <ItemMenu
      id={`shadow.${level}`}
      spec={{
        title: `Shadow ${level}`,
        usage: { keys: [`shadow.${level}`], label: `Shadow ${level}` },
        copy: { cls, variable: `--shadow-${level}`, value: layerCss(value[mode]) },
        onReset: edited ? () => setShadow(level, null) : null,
        onDuplicate: () => {
          const token = freeName(doc, 'shadow', `shadow-${level}-copy`);
          addExtra('shadow', { name: token, light: value.light, dark: value.dark });
          openItem(`extra.shadow.${token}`);
        },
        lock: ['depth'],
      }}>
      <ItemPopover
        id={`shadow.${level}`}
        title={`Shadow ${level}`}
        slot={cls}
        trigger={
          <button type="button" aria-label={`Shadow ${level}: ${describeLayers(value[mode])}${edited ? ', edited' : ''}. Edit`} className="hover:bg-accent focus-visible:ring-ring relative w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2">
            <ShadowCard css={layerCss(value[site])} label={`Shadow ${level}`} meta={describeLayers(value[site])} />
            {edited ? <EditedDot className="absolute right-2 top-2" /> : null}
          </button>
        }
        preview={<ShadowCard css={layerCss(value[mode])} label={`Shadow ${level} · ${mode}`} meta={describeLayers(value[mode])} />}
        status={{ edited: edited ? { onReset: () => setShadow(level, null) } : null, note: edited ? 'Overridden: it no longer follows Depth.' : 'Follows Depth until you edit it.', usedBy: <UsedBy keys={[`shadow.${level}`]} /> }}>
        <ShadowEditor value={value} mode={mode} setMode={setPicked} onChange={(v, c) => setShadow(level, v, c && `shadow.${level}.${c}`)} />
      </ItemPopover>
    </ItemMenu>
  );
}

function ExtraShadow({ item }: { item: { name: string; light: Layer[]; dark: Layer[] } }) {
  const { system: doc } = useLiveTheme();
  const site = useMode();
  const [picked, setPicked] = React.useState<Mode | null>(null);
  const mode = picked ?? site;
  const name = item.name;
  return (
    <ItemMenu
      id={`extra.shadow.${name}`}
      spec={{
        title: `${extraLabel(name)} · extra`,
        copy: { cls: `shadow-${name}`, variable: `--shadow-${name}`, value: layerCss(item[mode]) },
        onDuplicate: () => {
          const token = freeName(doc, 'shadow', `${name}-copy`);
          addExtra('shadow', { ...item, name: token });
          openItem(`extra.shadow.${token}`);
        },
        onDelete: () => deleteExtra('shadow', name),
      }}>
      <ItemPopover
        id={`extra.shadow.${name}`}
        title={extraLabel(name)}
        extra={{ name: extraLabel(name), token: name, onRename: (t) => renameExtra(doc, 'shadow', name, t), check: (t) => checkExtraName(doc, 'shadow', name, t), onDelete: () => deleteExtra('shadow', name) }}
        trigger={
          <button type="button" aria-label={`${extraLabel(name)}, extra shadow. Edit`} className="hover:bg-accent focus-visible:ring-ring w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2">
            <ShadowCard css={layerCss(item[site])} label={extraLabel(name)} meta={describeLayers(item[site])} extra />
          </button>
        }
        preview={<ShadowCard css={layerCss(item[mode])} label={`${extraLabel(name)} · ${mode}`} meta={describeLayers(item[mode])} />}
        status={{ note: <span>Exported as <code className="font-mono">shadow-{name}</code>. No kit component reads it.</span> }}>
        <ShadowEditor value={item} mode={mode} setMode={setPicked} onChange={(v, c) => updateExtra('shadow', name, (e) => ({ ...e, ...v }), c && `extra.shadow.${name}.${c}`)} />
      </ItemPopover>
    </ItemMenu>
  );
}

export function ShadowsSection() {
  const { system: doc } = useLiveTheme();
  const extras = extrasOf(doc, 'shadow') as unknown as { name: string; light: Layer[]; dark: Layer[] }[];
  return (
    <FoundationSection
      id="shadows"
      title="Shadows"
      count={3 + extras.length}
      knob={<Knob axis="depth" label="Depth" />}
      add={<NewFrom section="shadows" kind="shadow" label="New shadow" options={['1', '2', '3'].map((l) => ({ id: l, label: `Shadow ${l}` }))} make={(l, token) => ({ name: token, ...shadowLayers(doc, l) })} />}>
      <div className="grid gap-2 sm:grid-cols-3">
        {['1', '2', '3'].map((level) => (
          <ShadowItem key={level} level={level} />
        ))}
        {extras.map((item, i) => (
          <ExtraShadow key={i} item={item} />
        ))}
      </div>
    </FoundationSection>
  );
}

// ---- borders ----------------------------------------------------------------------------------------

function BorderSample({ width, style, color, label, extra }: { width: number; style: string; color: string; label: string; extra?: boolean }) {
  return (
    <span className="flex w-full flex-col gap-1.5 p-2">
      <span className="bg-background flex h-12 items-center rounded-md px-3 text-sm" style={{ border: `${width}px ${style} ${color}` }}>
        {label}
      </span>
      {extra ? <ExtraTag /> : null}
    </span>
  );
}

function BorderItem({ role, label }: { role: 'border' | 'input'; label: string }) {
  const { system: doc, theme } = useLiveTheme();
  const mode = useMode();
  const widthId = React.useId();
  const styleId = React.useId();
  const overrides = overridesOf(doc);
  const own = [...overrides].filter((p) => p.startsWith('border.') || p.startsWith(`roles.${role}.`));
  const width = doc.border.width ?? theme.borderWidth;
  const style = doc.border.style ?? 'solid';
  const target = roleTarget(doc, role);
  const reset = () => {
    setBorder(null);
    setRole(role, 'light', null);
    setRole(role, 'dark', null);
  };
  return (
    <ItemMenu
      id={`border.${role}`}
      spec={{
        title: `${label} · border`,
        usage: { keys: ['border.width', `color.${role}`], label: `${label} border` },
        copy: { cls: role === 'border' ? 'border' : 'border border-input', variable: '--border-width', value: `${width}px ${style}` },
        onReset: own.length ? reset : null,
        onDuplicate: () => {
          const token = freeName(doc, 'border', `${role}-copy`);
          addExtra('border', { name: token, width, style });
          openItem(`extra.border.${token}`);
        },
        lock: ['border'],
      }}>
      <ItemPopover
        id={`border.${role}`}
        title={label}
        slot={role === 'border' ? 'border' : 'border-input'}
        trigger={
          <button type="button" aria-label={`${label} border: ${width}px ${style}${own.length ? ', edited' : ''}. Edit`} className="hover:bg-accent focus-visible:ring-ring relative w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2">
            <BorderSample width={width} style={style} color={theme.resolved[mode][role]} label={`${label} · ${width}px ${style}`} />
            {own.length ? <EditedDot className="absolute right-2 top-2" /> : null}
          </button>
        }
        status={{
          edited: own.length ? { label: own.length > 1 ? `${own.length} edited` : 'edited', action: own.length > 1 ? 'reset all' : 'reset', onReset: reset } : null,
          note: (
            <>
              Width and style are one setting for every border (the kits draw one width).
              {/* A filled or underlined field draws its own, darker edge (field-edge, for 3:1), not this colour. */}
              {role === 'input' && doc.recipe.field !== 'outline'
                ? ` ${doc.recipe.field === 'filled' ? 'Filled' : 'Underlined'} fields draw their own darker edge; this colour is for checkboxes, toggles and the outline field style. A field's own edge is Components › Input › Default.`
                : null}
            </>
          ),
          usedBy: <UsedBy keys={['border.width', `color.${role}`]} />,
        }}>
        <Field label="Style" htmlFor={styleId}>
          <select id={styleId} value={style} onChange={(e) => setBorder({ style: e.target.value === 'solid' && !doc.border.style ? null : e.target.value })} className={`${inputClass} w-full`}>
            {['solid', 'dashed', 'dotted'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Width px" htmlFor={widthId}>
          {num(width, (v) => setBorder({ width: v }), { id: widthId, min: 0, max: 16, step: 0.5 })}
        </Field>
        {(['light', 'dark'] as const).map((m) => (
          <Field key={m} label={m === 'light' ? 'Colour' : 'Dark'}>
            <TokenPicker doc={doc} value={target[m]} hex={roleHex(doc, role, m)} label={`${label} border colour, ${m}`} onPick={(v) => setRole(role, m, v)} />
          </Field>
        ))}
      </ItemPopover>
    </ItemMenu>
  );
}

function ExtraBorder({ item }: { item: { name: string; width: number; style?: string } }) {
  const { system: doc, theme } = useLiveTheme();
  const mode = useMode();
  const widthId = React.useId();
  const styleId = React.useId();
  const name = item.name;
  return (
    <ItemMenu
      id={`extra.border.${name}`}
      spec={{
        title: `${extraLabel(name)} · extra`,
        copy: { cls: `border-${name}`, variable: `--border-${name}-width`, value: `${item.width}px ${item.style ?? 'solid'}` },
        onDuplicate: () => {
          const token = freeName(doc, 'border', `${name}-copy`);
          addExtra('border', { ...item, name: token });
          openItem(`extra.border.${token}`);
        },
        onDelete: () => deleteExtra('border', name),
      }}>
      <ItemPopover
        id={`extra.border.${name}`}
        title={extraLabel(name)}
        extra={{ name: extraLabel(name), token: name, onRename: (t) => renameExtra(doc, 'border', name, t), check: (t) => checkExtraName(doc, 'border', name, t), onDelete: () => deleteExtra('border', name) }}
        trigger={
          <button type="button" aria-label={`${extraLabel(name)}, extra border. Edit`} className="hover:bg-accent focus-visible:ring-ring w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2">
            <BorderSample width={item.width} style={item.style ?? 'solid'} color={theme.resolved[mode].border} label={`${extraLabel(name)} · ${item.width}px`} extra />
          </button>
        }
        status={{ note: <span>Exported as <code className="font-mono">border-{name}</code> (width and style; the colour is any border colour class). No kit component reads it.</span> }}>
        <Field label="Style" htmlFor={styleId}>
          <select id={styleId} value={item.style ?? 'solid'} onChange={(e) => updateExtra('border', name, (x) => ({ ...x, style: e.target.value }))} className={`${inputClass} w-full`}>
            {['solid', 'dashed', 'dotted'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Width px" htmlFor={widthId}>
          {num(item.width, (v) => updateExtra('border', name, (x) => ({ ...x, width: v }), `extra.border.${name}`), { id: widthId, min: 0, max: 16, step: 0.5 })}
        </Field>
      </ItemPopover>
    </ItemMenu>
  );
}

export function BordersSection() {
  const { system: doc, theme } = useLiveTheme();
  const extras = extrasOf(doc, 'border') as unknown as { name: string; width: number; style?: string }[];
  const width = doc.border.width ?? theme.borderWidth;
  const style = doc.border.style ?? 'solid';
  return (
    <FoundationSection
      id="borders"
      title="Borders"
      count={2 + extras.length}
      knob={<Knob axis="border" label="Width" />}
      add={
        <NewFrom
          section="borders"
          kind="border"
          label="New border"
          options={[
            { id: 'border', label: 'Default' },
            { id: 'input', label: 'Input' },
          ]}
          make={(_from, token) => ({ name: token, width, style })}
        />
      }>
      <div className="grid gap-2 sm:grid-cols-2">
        <BorderItem role="border" label="Default" />
        <BorderItem role="input" label="Input" />
        {extras.map((item, i) => (
          <ExtraBorder key={i} item={item} />
        ))}
      </div>
    </FoundationSection>
  );
}
