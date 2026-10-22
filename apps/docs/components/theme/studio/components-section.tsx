'use client';
import { ROLE_NAMES, systemRadii } from '@halftone-ds/tokens/system';
import { COMPONENTS, CORNERS, TOUCH_TARGET, type ComponentColor, type ComponentName, type ComponentShape } from '@halftone-ds/tokens/theme';
import * as React from 'react';
import { Ratio } from '@/components/theme/studio/colours-section';
import { TokenPicker, type PickerOption } from '@/components/theme/studio/fields';
import { ItemMenu } from '@/components/theme/studio/item-menu';
import { EditedDot, Field, inputClass, ItemPopover, openItem } from '@/components/theme/studio/item-popover';
import { LABELS, ORDER } from '@/components/theme/studio/parts';
import { FoundationSection, KnobLock } from '@/components/theme/studio/section';
import {
  colorCss,
  COMPONENT_ORDER,
  CORNER_LABELS,
  editedSlots,
  editsOf,
  prefixOf,
  resetComponent,
  resetSize,
  resetVariant,
  roleName,
  setCorner,
  setSize,
  setStyle,
  setText,
  setVariant,
  SIZE_LABELS,
  SLOT_LABELS,
  STYLE_LABELS,
  VARIANT_LABELS,
  variantContrast,
  type Slot,
} from '@/lib/studio/components';
import { addExtra, freeName, TEXT_LABELS, TEXT_STYLE_NAMES, type Mode } from '@/lib/studio/foundations';
import { usageOf } from '@/lib/studio/usage';
import { base } from '@/lib/theme/base';
import { useMode } from '@/lib/theme/mode';
import { setRecipe, useLiveTheme, type LockKey } from '@/lib/theme/store';

/**
 * Foundations › Components (wireframe 7, direction B): Button, Chip, Badge and Input, each a card whose header holds
 * what every variant shares (Style, Corner, Size, Text) and whose items are the variants (Input: its states), each
 * with a colour popover of roles. One theme for both kits: everything here reaches the mobile and the web kit alike.
 * Icon stroke and density, the controls the section grew from, stay in its header.
 */

// ---- the section header's recipe knobs ---------------------------------------------------------------------------

function RecipeKnob({ axis, label }: { axis: 'stroke' | 'density'; label: string }) {
  const { recipe } = useLiveTheme();
  const id = React.useId();
  return (
    <div className="flex items-center gap-1">
      <label htmlFor={id} className="text-muted-foreground text-xs">
        {label}
      </label>
      <select id={id} value={recipe[axis]} onChange={(e) => setRecipe({ [axis]: e.target.value })} className="border-border bg-background focus-visible:ring-ring h-7 rounded-full border px-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2">
        {(ORDER[axis] as readonly string[]).map((v) => (
          <option key={v} value={v}>
            {LABELS[v] ?? v}
          </option>
        ))}
      </select>
      <KnobLock keys={[axis]} label={label.toLowerCase()} />
    </div>
  );
}

// ---- shared bits -------------------------------------------------------------------------------------------------

/** "Used by Button, Alert dialog", from the kits' usage map. */
function UsedBy({ name }: { name: ComponentName }) {
  const list = usageOf([`component.${name}`]);
  if (!list.length) return null;
  const names = list.map((u) => u.entry.title);
  return (
    <span>
      Used by <span className="text-foreground">{names.slice(0, 4).join(', ')}</span>
      {names.length > 4 ? ` +${names.length - 4}` : ''}
    </span>
  );
}

const num = (value: number, onChange: (v: number) => void, { id, min, max, label }: { id?: string; min: number; max: number; label?: string }) => (
  <input
    id={id}
    aria-label={label}
    type="number"
    inputMode="numeric"
    min={min}
    max={max}
    value={value}
    onChange={(e) => {
      const v = Number(e.target.value);
      if (e.target.value !== '' && Number.isFinite(v) && v >= min && v <= max) onChange(v);
    }}
    className={`${inputClass} w-20 tabular-nums`}
  />
);

/** A header knob's chip: "Corner · full", with the edited mark. */
const chipClass =
  'border-border hover:bg-accent focus-visible:ring-ring inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2';

function Radios<T extends string>({ label, name, value, options, onChange }: { label: string; name: string; value: T | null; options: { value: T; label: string; hint?: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-0.5">
      {options.map((o) => (
        <label key={o.value} className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm">
          <input type="radio" name={name} checked={value === o.value} onChange={() => onChange(o.value)} />
          <span className="flex-1">{o.label}</span>
          {o.hint ? <span className="text-muted-foreground text-xs tabular-nums">{o.hint}</span> : null}
        </label>
      ))}
    </div>
  );
}

// ---- the specimen: a variant as the kits draw it ------------------------------------------------------------------

function Specimen({ name, variant, shape, mode, text, placeholder }: { name: ComponentName; variant: string; shape: ComponentShape; mode: Mode; text?: string; placeholder: string }) {
  const v = shape.variants[variant];
  const p = prefixOf(name);
  const label = text ?? VARIANT_LABELS[variant];
  const font: React.CSSProperties = {
    fontFamily: `var(--${p}-text-font)`,
    fontSize: shape.text.size,
    lineHeight: `${shape.text.leading}px`,
    letterSpacing: `${shape.text.tracking}em`,
    fontWeight: name === 'input' ? 400 : 500,
  };
  if (name === 'input') {
    const d = shape.variants.default;
    const border = v.border ?? d.border;
    const ring = v.ring;
    return (
      <span
        className="inline-flex w-48 items-center whitespace-nowrap"
        style={{
          ...font,
          height: shape.h.md,
          paddingInline: shape.x.md,
          background: colorCss(v.fill ?? d.fill, mode),
          color: colorCss(v.label ?? d.label, mode),
          borderTopLeftRadius: shape.radius,
          borderTopRightRadius: shape.radius,
          borderBottomLeftRadius: shape.radiusBottom,
          borderBottomRightRadius: shape.radiusBottom,
          borderStyle: 'solid',
          borderColor: colorCss(border, mode),
          borderWidth: 'var(--field-border-w)',
          borderBottomWidth: 'var(--field-edge-w)',
          boxShadow: ring ? `0 0 0 3px ${colorCss(ring, mode)}` : undefined,
          opacity: variant === 'disabled' ? 0.5 : 1,
        }}>
        {/* A field's placeholder is muted text; the disabled one is drawn with CSS content: it's faint on purpose (a
            disabled control), and the item's own label names it. */}
        {variant === 'disabled' ? (
          <span className="before:content-[attr(data-text)]" data-text="name@studio.com" style={{ color: placeholder }} aria-hidden />
        ) : variant === 'default' ? (
          <span style={{ color: placeholder }}>name@studio.com</span>
        ) : (
          label
        )}
      </span>
    );
  }
  const borderWidth = name === 'button' ? v.borderWidth ?? 0 : 'var(--border-width)';
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center whitespace-nowrap"
      style={{
        ...font,
        height: shape.h.md,
        paddingInline: shape.x.md,
        paddingBlock: name === 'badge' ? 2 : undefined,
        borderRadius: shape.radius,
        background: colorCss(v.fill, mode),
        color: colorCss(v.label, mode),
        borderStyle: 'solid',
        borderColor: colorCss(v.border, mode),
        borderWidth,
        borderBottomWidth: name === 'button' ? v.edgeWidth ?? 0 : borderWidth,
      }}>
      {label}
    </span>
  );
}

// ---- header knobs ------------------------------------------------------------------------------------------------

function StyleKnob({ name }: { name: ComponentName }) {
  const { system: doc, theme } = useLiveTheme();
  const def = COMPONENTS[name];
  const style = theme.components[name].style ?? def.styles[0];
  const edited = (name === 'chip' || name === 'badge') && !!editsOf(doc, name).style;
  const lock: LockKey[] = name === 'button' ? ['button'] : name === 'input' ? ['field'] : [];
  const id = `component.${name}.style`;
  return (
    <ItemMenu id={id} spec={{ title: `${def.label} style`, copy: { value: style }, onReset: edited ? () => setStyle(name, null) : null, lock }}>
      <ItemPopover
        id={id}
        title={`${def.label} style`}
        slot="style"
        trigger={
          <button type="button" aria-label={`${def.label} style: ${STYLE_LABELS[style] ?? style}${edited ? ', edited' : ''}. Change`} className={chipClass}>
            {STYLE_LABELS[style] ?? style}
            {edited ? <EditedDot /> : null}
          </button>
        }
        status={{
          edited: edited ? { onReset: () => setStyle(name, null) } : null,
          note: name === 'button' || name === 'input' ? 'The theme’s own style (it keeps a theme code). Rewrites every variant you haven’t edited.' : 'Rewrites every variant you haven’t edited.',
        }}>
        <Radios label={`${def.label} style`} name={`${name}-style`} value={style} options={def.styles.map((s) => ({ value: s, label: STYLE_LABELS[s] ?? s }))} onChange={(s) => setStyle(name, s)} />
      </ItemPopover>
    </ItemMenu>
  );
}

function CornerKnob({ name }: { name: ComponentName }) {
  const { system: doc, theme } = useLiveTheme();
  const def = COMPONENTS[name];
  const shape = theme.components[name];
  const set = editsOf(doc, name).radius;
  const radii = systemRadii(doc, base, theme) as Record<string, number>;
  const px = typeof set === 'number' ? set : name === 'input' ? radii[shape.corner ?? 'md'] : shape.radius;
  const current = typeof set === 'number' ? `${set}px` : (CORNER_LABELS[shape.corner ?? 'full'] ?? shape.corner);
  const id = `component.${name}.corner`;
  const inputId = React.useId();
  const pill = name === 'button' || name === 'chip';
  const reset = set !== undefined ? () => setCorner(name, null) : null;
  return (
    <ItemMenu id={id} spec={{ title: `${def.label} corner`, copy: { variable: `--${prefixOf(name)}-radius`, value: px >= 9999 ? '9999px' : `${px}px` }, onReset: reset, lock: pill ? ['controls'] : [] }}>
      <ItemPopover
        id={id}
        title={`${def.label} corner`}
        slot="corner"
        trigger={
          <button type="button" aria-label={`${def.label} corner: ${current}${reset ? ', edited' : ''}. Change`} className={chipClass}>
            Corner · {String(current).toLowerCase()}
            {reset ? <EditedDot /> : null}
          </button>
        }
        status={{
          edited: reset ? { onReset: reset } : null,
          note:
            set === undefined
              ? pill
                ? `Follows the theme’s shape: ${theme.recipe.controls === 'pill' ? 'pills' : 'the base radius (Large)'}. Both kits.`
                : `Follows ${CORNER_LABELS[shape.corner ?? 'md']}, a Foundations corner. Both kits.`
              : typeof set === 'number'
                ? 'Overridden in px: it no longer follows a Foundations corner.'
                : `Follows ${CORNER_LABELS[set]}, a Foundations corner.`,
        }}>
        <Radios
          label={`${def.label} corner`}
          name={`${name}-corner`}
          value={typeof set === 'string' ? set : typeof set === 'number' ? null : (shape.corner ?? null)}
          options={CORNERS.map((c) => ({ value: c, label: CORNER_LABELS[c], hint: c === 'full' ? 'pill' : `${radii[c]}px` }))}
          onChange={(c) => setCorner(name, c)}
        />
        <Field label="Override" htmlFor={inputId} hint="px, for this component only">
          {num(Math.min(px, 9999), (v) => setCorner(name, v), { id: inputId, min: 0, max: 9999 })}
        </Field>
        {pill ? (
          <Field label="Default">
            <select
              aria-label="Default shape of buttons and chips"
              value={theme.recipe.controls}
              onChange={(e) => setRecipe({ controls: e.target.value as 'pill' | 'match' })}
              className={`${inputClass} flex-1`}>
              <option value="pill">Pills (Button and Chip)</option>
              <option value="match">Base radius (Button and Chip)</option>
            </select>
          </Field>
        ) : null}
      </ItemPopover>
    </ItemMenu>
  );
}

function SizeKnob({ name }: { name: ComponentName }) {
  const { system: doc, theme } = useLiveTheme();
  const def = COMPONENTS[name];
  const shape = theme.components[name];
  const size = editsOf(doc, name).size ?? {};
  const edited = Object.keys(size).length > 0;
  const id = `component.${name}.size`;
  const value = (k: string) => (k === 'x' ? shape.x.md : shape.h[k as 'sm'])!;
  const md = shape.h.md;
  const summary = md !== undefined ? `${md}${md < TOUCH_TARGET ? ` (${TOUCH_TARGET} on phones)` : ''}` : `padding ${shape.x.md}`;
  return (
    <ItemMenu id={id} spec={{ title: `${def.label} size`, copy: { variable: md !== undefined ? `--${prefixOf(name)}-h-md` : `--${prefixOf(name)}-x`, value: `${md ?? shape.x.md}px` }, onReset: edited ? () => resetSize(name) : null, lock: name === 'button' || name === 'input' ? ['density'] : [] }}>
      <ItemPopover
        id={id}
        title={`${def.label} size`}
        slot="size"
        trigger={
          <button type="button" aria-label={`${def.label} size: ${summary}${edited ? ', edited' : ''}. Change`} className={chipClass}>
            Size · {summary}
            {edited ? <EditedDot /> : null}
          </button>
        }
        status={{
          edited: edited ? { label: Object.keys(size).length > 1 ? `${Object.keys(size).length} edited` : 'edited', action: Object.keys(size).length > 1 ? 'reset all' : 'reset', onReset: () => resetSize(name) } : null,
          note:
            name === 'input'
              ? `Both kits, from density until you set it. A text field is at least ${TOUCH_TARGET} tall on phones.`
              : name === 'badge'
                ? 'Both kits. A badge isn’t pressed, so it has no height of its own.'
                : `Both kits${name === 'button' ? ', from density until you set it' : ''}. On phones, a tap area under ${TOUCH_TARGET} is raised to ${TOUCH_TARGET}; the ${def.label.toLowerCase()} keeps its height.`,
        }}>
        {def.sizes.map((k) => (
          <SizeRow key={k} name={name} k={k} value={value(k)} edited={size[k] !== undefined} />
        ))}
      </ItemPopover>
    </ItemMenu>
  );
}

function SizeRow({ name, k, value, edited }: { name: ComponentName; k: 'sm' | 'md' | 'lg' | 'x'; value: number; edited: boolean }) {
  const id = React.useId();
  const label = name === 'chip' && k === 'md' ? 'Height' : SIZE_LABELS[k];
  return (
    <Field label={label} htmlFor={id}>
      {num(value, (v) => setSize(name, k, v), { id, min: k === 'x' ? 0 : 16, max: k === 'x' ? 64 : 120 })}
      <span className="text-muted-foreground text-xs">px</span>
      {edited ? (
        <button type="button" onClick={() => setSize(name, k, null)} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs underline underline-offset-2" aria-label={`Reset ${label}`}>
          <EditedDot />
          reset
        </button>
      ) : null}
    </Field>
  );
}

function TextKnob({ name }: { name: ComponentName }) {
  const { system: doc, theme } = useLiveTheme();
  const def = COMPONENTS[name];
  const shape = theme.components[name];
  const set = editsOf(doc, name).text;
  const style = set ?? def.text;
  const id = `component.${name}.text`;
  const selectId = React.useId();
  const label = TEXT_LABELS[style as keyof typeof TEXT_LABELS] ?? style;
  const reset = set ? () => setText(name, null) : null;
  return (
    <ItemMenu id={id} spec={{ title: `${def.label} text`, copy: { variable: `--${prefixOf(name)}-text-size`, value: `${shape.text.size}px` }, onReset: reset }}>
      <ItemPopover
        id={id}
        title={`${def.label} text`}
        slot="text"
        trigger={
          <button type="button" aria-label={`${def.label} text: ${label}${reset ? ', edited' : ''}. Change`} className={chipClass}>
            Text · {label.toLowerCase()}
            {reset ? <EditedDot /> : null}
          </button>
        }
        status={{
          edited: reset ? { onReset: reset } : null,
          note: `A Foundations text style: its font, size and tracking. The ${def.label.toLowerCase()} keeps its own weight (${name === 'input' ? 'regular' : 'medium'}) and a line height that fits it (${shape.text.size} on ${shape.text.leading}).`,
        }}>
        <Field label="Style" htmlFor={selectId}>
          <select id={selectId} value={style} onChange={(e) => setText(name, e.target.value)} className={`${inputClass} flex-1`}>
            {TEXT_STYLE_NAMES.map((s) => (
              <option key={s} value={s}>
                {TEXT_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
      </ItemPopover>
    </ItemMenu>
  );
}

// ---- variants ----------------------------------------------------------------------------------------------------

/** The roles a slot can take: every semantic colour (the style's own last), and None for a fill or a border. */
function roleOptions(theme: ReturnType<typeof useLiveTheme>['theme'], mode: Mode, slot: Slot): PickerOption[] {
  const style = ['button', 'button-foreground', 'button-edge', 'field', 'field-edge'];
  const roles = [...ROLE_NAMES.filter((r) => !style.includes(r)), ...style];
  return [
    ...(slot === 'fill' || slot === 'border' ? [{ value: 'none', label: 'None', hex: null, group: 'None' }] : []),
    ...roles.map((r) => ({ value: r, label: roleName(r), hex: theme.resolved[mode][r] ?? null, group: style.includes(r) ? 'Style' : 'Roles' })),
  ];
}

function SlotRow({ name, variant, slot, color, edited }: { name: ComponentName; variant: string; slot: Slot; color: ComponentColor | undefined; edited: boolean }) {
  const { system: doc, theme } = useLiveTheme();
  const mode = useMode();
  const label = `${COMPONENTS[name].label} ${VARIANT_LABELS[variant]} ${SLOT_LABELS[slot].toLowerCase()}`;
  const items = React.useMemo(() => roleOptions(theme, mode, slot), [theme, mode, slot]);
  const derived = slot === 'pressed' && !edited;
  const display = (v: string | null) => (derived ? `Derived · ${roleName(color?.role ?? null).toLowerCase()}${color && color.alpha[mode] < 1 ? ` ${Math.round(color.alpha[mode] * 100)}%` : ''}` : roleName(v));
  return (
    <Field label={SLOT_LABELS[slot]}>
      <TokenPicker doc={doc} value={color?.role ?? null} hex={color?.[mode] ?? null} items={items} allowHex={false} display={display} placeholder="primary, muted…" label={label} onPick={(v) => setVariant(name, variant, slot, v)} />
      {edited ? (
        <button type="button" onClick={() => setVariant(name, variant, slot, null)} className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1 text-xs underline underline-offset-2" aria-label={`Reset ${label}`}>
          <EditedDot />
          reset
        </button>
      ) : null}
    </Field>
  );
}

function VariantItem({ name, variant }: { name: ComponentName; variant: string }) {
  const { system: doc, theme } = useLiveTheme();
  const mode = useMode();
  const def = COMPONENTS[name];
  const shape = theme.components[name];
  const v = shape.variants[variant];
  const slots = def.variants[variant] as Slot[];
  const edits = editedSlots(doc, name, variant);
  const edited = edits.length > 0;
  const id = `component.${name}.${variant}`;
  const p = prefixOf(name);
  const title = `${def.label} ${VARIANT_LABELS[variant]}`;
  const pairs = variantContrast(theme, name, variant);
  const fill = v.fill ?? shape.variants.default?.fill;
  return (
    <ItemMenu
      id={id}
      className="inline-flex"
      spec={{
        title: `${title} · ${name === 'input' ? 'state' : 'variant'}`,
        usage: { keys: [`component.${name}`], label: def.label },
        copy: { cls: `bg-${p}-${variant}-${slots.includes('fill') ? 'bg' : 'border'}`, variable: `--${p}-${variant}-${slots.includes('fill') ? 'bg' : 'border'}`, value: (fill ?? v.border)?.[mode].toUpperCase() },
        onReset: edited ? () => resetVariant(name, variant) : null,
        onDuplicate: fill
          ? () => {
              const token = freeName(doc, 'color', `${name}-${variant}`);
              addExtra('color', { name: token, value: { light: fill.light, dark: fill.dark } });
              openItem(`extra.color.${token}`);
            }
          : undefined,
      }}>
      <ItemPopover
        id={id}
        title={title}
        slot={variant}
        trigger={
          <button type="button" aria-label={`${title}${edited ? ', edited' : ''}. Edit its colours`} className="hover:bg-accent/60 focus-visible:ring-ring relative inline-flex rounded-xl p-1.5 focus-visible:outline-none focus-visible:ring-2">
            <Specimen name={name} variant={variant} shape={shape} mode={mode} placeholder={theme.resolved[mode]['muted-foreground']} />
            {edited ? <EditedDot className="absolute right-1 top-1" /> : null}
          </button>
        }
        preview={
          <div className="grid grid-cols-2 gap-2">
            {(['light', 'dark'] as const).map((m) => (
              <div key={m} className="ring-foreground/10 flex flex-col items-start gap-1.5 overflow-hidden rounded-lg p-2 ring-1 ring-inset" style={{ background: theme.resolved[m].background }}>
                <span className="max-w-full origin-left scale-[0.8]">
                  <Specimen name={name} variant={variant} shape={shape} mode={m} placeholder={theme.resolved[m]['muted-foreground']} />
                </span>
                <span className="font-mono text-[10px] uppercase" style={{ color: theme.resolved[m]['muted-foreground'] }}>
                  {m}
                </span>
              </div>
            ))}
          </div>
        }
        status={{
          edited: edited ? { label: edits.length > 1 ? `${edits.length} edited` : 'edited', action: edits.length > 1 ? 'reset all' : 'reset', onReset: () => resetVariant(name, variant) } : null,
          contrast: pairs.length ? (
            <div className="flex flex-col gap-0.5">
              {pairs.map((r) => (
                <Ratio key={r.mode} fg={r.fg} bg={r.bg} label={`Label on fill, ${r.mode} ·`} />
              ))}
            </div>
          ) : null,
          usedBy: <UsedBy name={name} />,
          note:
            variant === 'disabled'
              ? 'Drawn at 50% opacity, over these colours.'
              : variant === 'focus' || variant === 'error'
                ? `Its ring is the border at ${variant === 'focus' ? '50%' : '20% (40% in dark)'}.`
                : slots.includes('pressed')
                  ? 'Pressed (and hover) is the fill at 90% until you set it.'
                  : undefined,
        }}>
        {slots.map((slot) => (
          <SlotRow key={slot} name={name} variant={variant} slot={slot} color={v[slot] ?? (variant === 'disabled' ? shape.variants.default[slot] : undefined)} edited={edits.includes(slot)} />
        ))}
      </ItemPopover>
    </ItemMenu>
  );
}

// ---- the cards -------------------------------------------------------------------------------------------------

function ComponentCard({ name }: { name: ComponentName }) {
  const { system: doc } = useLiveTheme();
  const def = COMPONENTS[name];
  const edited = !!doc.components?.[name];
  const headingId = `component-${name}-title`;
  return (
    <section aria-labelledby={headingId} className="border-border flex flex-col gap-3 rounded-xl border p-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <h3 id={headingId} className="flex items-center gap-1.5 text-sm font-semibold">
          {def.label}
          {name === 'badge' ? <span className="text-muted-foreground text-xs font-normal">the “Tag”</span> : null}
          {name === 'input' ? <span className="text-muted-foreground text-xs font-normal">also Textarea, Select</span> : null}
          {edited ? (
            <button type="button" onClick={() => resetComponent(name)} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-normal underline underline-offset-2" aria-label={`Reset every edit to ${def.label}`}>
              <EditedDot />
              reset
            </button>
          ) : null}
        </h3>
        <div className="flex-1" />
        <div className="flex flex-wrap items-center gap-1.5">
          <StyleKnob name={name} />
          <CornerKnob name={name} />
          <SizeKnob name={name} />
          <TextKnob name={name} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {Object.keys(def.variants).map((variant) => (
          <VariantItem key={variant} name={name} variant={variant} />
        ))}
      </div>
    </section>
  );
}

export function ComponentsSection() {
  return (
    <FoundationSection
      id="components"
      title="Components"
      count={COMPONENT_ORDER.length}
      knob={
        <div className="flex flex-wrap items-center gap-2">
          <RecipeKnob axis="stroke" label="Icon stroke" />
          <RecipeKnob axis="density" label="Density" />
        </div>
      }>
      <p className="text-muted-foreground -mt-2 text-xs">One theme for both kits: every change here reaches the mobile and the web kit alike.</p>
      <div className="flex flex-col gap-3">
        {COMPONENT_ORDER.map((name) => (
          <ComponentCard key={name} name={name} />
        ))}
      </div>
    </FoundationSection>
  );
}
