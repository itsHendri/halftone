'use client';
import { ROLE_NAMES, systemRadii } from '@halftone-ds/tokens/system';
import { COMPONENTS, CORNERS, ICON_DEFAULT, RING_WIDTH, TOUCH_TARGET, WEIGHTS, type ComponentColor, type ComponentName, type ComponentShape } from '@halftone-ds/tokens/theme';
import { ChevronDownIcon, ChevronUpIcon, EyeIcon, XIcon } from 'lucide-react';
import * as React from 'react';
import { Ratio } from '@/components/theme/studio/colours-section';
import { InContext, Specimen, STEP_LABEL, type SpecimenState, type Step } from '@/components/theme/studio/component-specimen';
import { TokenPicker, type PickerOption } from '@/components/theme/studio/fields';
import { ItemMenu, showInComponents } from '@/components/theme/studio/item-menu';
import { EditedDot, inputClass } from '@/components/theme/studio/item-popover';
import { LABELS, ORDER } from '@/components/theme/studio/parts';
import { FoundationSection, KnobLock } from '@/components/theme/studio/section';
import {
  COMPONENT_ORDER,
  componentEdits,
  CORNER_LABELS,
  editedSlots,
  editsOf,
  GROUP_LABELS,
  groupEdits,
  prefixOf,
  resetComponent,
  resetGroup,
  resetVariant,
  roleName,
  setCorner,
  setProp,
  setRing,
  setSize,
  setStyle,
  setText,
  setVariant,
  SLOT_LABELS,
  STEP_SHORT,
  STYLE_LABELS,
  VARIANT_LABELS,
  colourName,
  pressedContrast,
  variantContrast,
  WEIGHT_LABELS,
  type Group,
  type Slot,
} from '@/lib/studio/components';
import { addExtra, freeName, TEXT_LABELS, TEXT_STYLE_NAMES, type Mode } from '@/lib/studio/foundations';
import { usageOf } from '@/lib/studio/usage';
import { base } from '@/lib/theme/base';
import { useMode } from '@/lib/theme/mode';
import { setRecipe, useLiveTheme, type LockKey } from '@/lib/theme/store';

/**
 * Foundations › Components (wireframe 9, the open card; apps/docs/design/studio-wireframes.md › The open card): Button,
 * Chip, Badge and Input, each a card. Collapsed, a card says its settings in plain text beside a small specimen; a
 * click opens it in place (one at a time). Open, the specimen (variants × sizes, a states row, the component in
 * context) sits beside a panel of real controls: Style · Shape · Size · Type · Icon · effects · Colours. A variant
 * column's header picks what Colours edits. On a phone the open card is full screen: the specimen first, one size at
 * a time, then the groups as an accordion. One theme for both kits: everything here reaches the mobile and the web
 * kit alike. Icon stroke and density, the controls the section grew from, stay in its header.
 */

type Theme = ReturnType<typeof useLiveTheme>['theme'];
type Doc = ReturnType<typeof useLiveTheme>['system'];
const PHONE = '(max-width: 767px)';

/** The open card goes full screen below 768px. */
function useNarrow() {
  return React.useSyncExternalStore(
    (l) => {
      const mq = window.matchMedia(PHONE);
      mq.addEventListener('change', l);
      return () => mq.removeEventListener('change', l);
    },
    () => window.matchMedia(PHONE).matches,
    () => false
  );
}

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

// ---- what a card says --------------------------------------------------------------------------------------------

const textLabel = (style: string | undefined) => TEXT_LABELS[(style ?? 'p') as keyof typeof TEXT_LABELS] ?? style ?? '';
const styleLabel = (name: ComponentName, shape: ComponentShape) => STYLE_LABELS[shape.style ?? COMPONENTS[name].styles[0]] ?? shape.style ?? '';
const cornerLabel = (shape: ComponentShape) => (shape.corner ? CORNER_LABELS[shape.corner] : `${shape.radius}px`);
/** How many of a component's pairings fail, light or dark. */
const failing = (theme: Theme, name: ComponentName) => new Set(variantContrast(theme, name, null).filter((r) => r.ratio < r.threshold).map((r) => r.variant)).size;

/** "Outline · Full · M 36 · Small 500 · AA": the collapsed card's settings in plain text. */
function summary(theme: Theme, name: ComponentName) {
  const shape = theme.components[name];
  const fails = failing(theme, name);
  const type = `${textLabel(shape.text.style ?? COMPONENTS[name].text)}${name === 'input' ? '' : ` ${shape.text.weight}`}${shape.text.case === 'uppercase' ? ' caps' : ''}`;
  return [styleLabel(name, shape), cornerLabel(shape), `M ${shape.h.md}`, type, fails ? `${fails} below AA` : 'AA'].join(' · ');
}

/** The card's item menu: Show usage, Copy, Reset every edit, and the style's lock. */
function cardMenu(name: ComponentName, doc: Doc) {
  const def = COMPONENTS[name];
  const edits = componentEdits(doc, name).length;
  const lock: LockKey[] = name === 'button' ? ['button'] : name === 'input' ? ['field'] : [];
  return {
    title: `${def.label} · component`,
    usage: { keys: [`component.${name}`], label: def.label },
    copy: { cls: name === 'input' ? 'rounded-t-field' : `rounded-${prefixOf(name)}`, variable: `--${prefixOf(name)}-radius` },
    onReset: edits ? () => resetComponent(name) : null,
    lock,
  };
}

// ---- the panel's controls ----------------------------------------------------------------------------------------

/** A segmented picker (a radio group, arrow keys move it). No option is checked when `value` is null. */
function Choice<T extends string | number>({ label, value, options, onChange }: { label: string; value: T | null; options: { value: T; label: string; title?: string }[]; onChange: (v: T) => void }) {
  const at = options.findIndex((o) => o.value === value);
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="bg-muted flex flex-wrap gap-0.5 rounded-lg p-0.5"
      onKeyDown={(e) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
        e.preventDefault();
        const next = options[(Math.max(0, at) + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length];
        onChange(next.value);
        e.currentTarget.querySelector<HTMLElement>(`[data-value="${next.value}"]`)?.focus();
      }}>
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          data-value={o.value}
          title={o.title}
          aria-label={o.title ? `${o.label}: ${o.title}` : undefined}
          tabIndex={o.value === value || (at < 0 && i === 0) ? 0 : -1}
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`focus-visible:ring-ring h-7 min-w-8 shrink-0 grow rounded-md px-2 text-xs font-medium whitespace-nowrap tabular-nums focus-visible:outline-none focus-visible:ring-2 ${
            o.value === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ResetLink({ label, onReset, children = 'reset' }: { label: string; onReset: () => void; children?: React.ReactNode }) {
  return (
    <button type="button" onClick={onReset} aria-label={label} className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex shrink-0 items-center gap-1 rounded text-xs underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2">
      <EditedDot />
      {children}
    </button>
  );
}

/** A slider with its value beside it, and a reset while the value is the system's own. */
function Slider({ label, value, min, max, step = 1, note, shown, edited, onChange, onReset }: { label: string; value: number; min: number; max: number; step?: number; note?: string; shown?: string; edited: boolean; onChange: (v: number) => void; onReset: () => void }) {
  const id = React.useId();
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="text-muted-foreground flex-1 text-xs font-medium">
          {label}
        </label>
        {edited ? <ResetLink label={`Reset ${label.toLowerCase()}`} onReset={onReset} /> : null}
        <span className="text-xs font-medium tabular-nums">{shown ?? `${value}px`}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={shown ?? `${value}px`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-foreground focus-visible:ring-ring h-6 w-full cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2"
      />
      {note ? <p className="text-muted-foreground text-xs">{note}</p> : null}
    </div>
  );
}

/** A labelled row: what the panel's pickers sit in. */
function Row({ label, children, htmlFor }: { label: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-muted-foreground text-xs font-medium">
          {label}
        </label>
      ) : (
        <span className="text-muted-foreground text-xs font-medium">{label}</span>
      )}
      {children}
    </div>
  );
}

/** The roles a colour can take: every semantic colour (the style's own last), and None for a fill or a border. */
function roleOptions(theme: Theme, mode: Mode, none: boolean): PickerOption[] {
  const style = ['button', 'button-foreground', 'button-edge', 'field', 'field-edge'];
  const roles = [...ROLE_NAMES.filter((r) => !style.includes(r)), ...style];
  return [
    ...(none ? [{ value: 'none', label: 'None', hex: null, group: 'None' }] : []),
    ...roles.map((r) => ({ value: r, label: roleName(r), hex: theme.resolved[mode][r] ?? null, group: style.includes(r) ? 'Style' : 'Roles' })),
  ];
}

function RolePicker({ label, color, none = false, display, onPick }: { label: string; color: ComponentColor | undefined; none?: boolean; display?: (v: string | null) => string; onPick: (role: string) => void }) {
  const { system: doc, theme } = useLiveTheme();
  const mode = useMode();
  const items = React.useMemo(() => roleOptions(theme, mode, none), [theme, mode, none]);
  return <TokenPicker doc={doc} value={color?.role ?? null} hex={color?.[mode] ?? null} items={items} allowHex={false} display={display ?? roleName} placeholder="primary, muted…" label={label} onPick={onPick} />;
}

// ---- the panel's groups ------------------------------------------------------------------------------------------

/** One group of the panel: its name, "edited · reset" and its lock. Always open on a wide screen; on a phone, an accordion row. */
function PanelGroup({ name, group, title, narrow, open, onToggle, lock, children }: { name: ComponentName; group: Group; title?: string; narrow: boolean; open: boolean; onToggle: () => void; lock?: { keys: LockKey[]; label: string }; children: React.ReactNode }) {
  const { system: doc } = useLiveTheme();
  const edits = groupEdits(doc, name, group);
  const id = React.useId();
  const heading = title ?? GROUP_LABELS[group];
  const reset = edits.length ? (
    <ResetLink label={`Reset ${COMPONENTS[name].label} ${GROUP_LABELS[group].toLowerCase()}`} onReset={() => resetGroup(name, group)}>
      {edits.length > 1 ? `${edits.length} edited · reset` : 'edited · reset'}
    </ResetLink>
  ) : null;
  return (
    <div role="group" aria-labelledby={`${id}-h`} className="border-border flex flex-col gap-3 border-t pt-3 first:border-t-0 first:pt-0">
      <div className="flex min-h-7 items-center gap-2">
        <h4 id={`${id}-h`} className="flex-1 text-xs font-semibold uppercase tracking-wide">
          {narrow ? (
            <button type="button" data-group={group} aria-expanded={open} aria-controls={`${id}-body`} onClick={onToggle} className="focus-visible:ring-ring -my-2 flex min-h-11 w-full items-center gap-2 rounded text-left uppercase focus-visible:outline-none focus-visible:ring-2">
              <span className="flex-1">{heading}</span>
              {edits.length ? <EditedDot /> : null}
              {open ? <ChevronUpIcon className="size-4" aria-hidden /> : <ChevronDownIcon className="size-4" aria-hidden />}
            </button>
          ) : (
            <span data-group={group}>{heading}</span>
          )}
        </h4>
        {!narrow ? reset : null}
        {lock && !narrow ? <KnobLock keys={lock.keys} label={lock.label} /> : null}
      </div>
      {!narrow || open ? (
        <div id={`${id}-body`} className="flex flex-col gap-3">
          {narrow && (reset || lock) ? (
            <div className="flex items-center gap-2">
              {reset}
              <span className="flex-1" />
              {lock ? <KnobLock keys={lock.keys} label={lock.label} /> : null}
            </div>
          ) : null}
          {children}
        </div>
      ) : null}
    </div>
  );
}

function StyleGroup({ name }: { name: ComponentName }) {
  const { theme } = useLiveTheme();
  const def = COMPONENTS[name];
  const style = theme.components[name].style ?? def.styles[0];
  return (
    <>
      <Choice label={`${def.label} style`} value={style} options={def.styles.map((s) => ({ value: s, label: STYLE_LABELS[s] ?? s }))} onChange={(s) => setStyle(name, s)} />
      <p className="text-muted-foreground text-xs">{name === 'button' || name === 'input' ? 'The theme’s own style (a theme code keeps it). ' : ''}Rewrites every colour you haven’t edited.</p>
    </>
  );
}

const CORNER_SHORT: Record<string, string> = { sm: 'S', md: 'M', lg: 'L', xl: 'XL', '2xl': '2XL', full: 'Full' };

function ShapeGroup({ name }: { name: ComponentName }) {
  const { system: doc, theme } = useLiveTheme();
  const def = COMPONENTS[name];
  const shape = theme.components[name];
  const e = editsOf(doc, name);
  const radii = systemRadii(doc, base, theme) as Record<string, number>;
  const px = typeof e.radius === 'number' ? e.radius : name === 'input' ? radii[shape.corner ?? 'md'] : shape.radius;
  const pill = name === 'button' || name === 'chip';
  const border = e.border ?? (name === 'button' ? (shape.variants.outline.borderWidth ?? theme.borderWidth) : name === 'input' ? shape.borderWidth || shape.edgeWidth || 0 : (shape.borderWidth ?? theme.borderWidth));
  return (
    <>
      <Row label="Corner">
        <Choice
          label={`${def.label} corner`}
          value={typeof e.radius === 'number' ? null : (shape.corner ?? null)}
          options={CORNERS.map((c) => ({ value: c, label: CORNER_SHORT[c], title: c === 'full' ? 'a pill' : `${CORNER_LABELS[c]}, ${radii[c]}px` }))}
          onChange={(c) => setCorner(name, c)}
        />
      </Row>
      <Slider
        label="Corner, this component only"
        value={Math.min(px >= 9999 ? 32 : px, 32)}
        shown={px >= 9999 ? 'Full' : undefined}
        min={0}
        max={32}
        note={typeof e.radius === 'number' ? 'In px: it no longer follows a Foundations corner.' : undefined}
        edited={typeof e.radius === 'number'}
        onChange={(v) => setCorner(name, v)}
        onReset={() => setCorner(name, null)}
      />
      {pill ? (
        <Row label="Buttons and chips by default">
          <Choice label="Default shape of buttons and chips" value={theme.recipe.controls} options={[{ value: 'pill', label: 'Pills' }, { value: 'match', label: 'Base radius' }]} onChange={(v) => setRecipe({ controls: v as 'pill' | 'match' })} />
        </Row>
      ) : null}
      <Slider
        label="Border width"
        value={border}
        min={0}
        max={8}
        step={0.5}
        note={e.border === undefined ? (name === 'input' ? 'As the field style draws it.' : name === 'button' ? 'Every border a variant draws (Outline, or one you set).' : 'The theme’s border.') : name === 'input' && !shape.borderWidth ? 'A filled or underline field: its bottom line.' : undefined}
        edited={e.border !== undefined}
        onChange={(v) => setProp(name, 'border', v)}
        onReset={() => setProp(name, 'border', null)}
      />
    </>
  );
}

function SizeGroup({ name, step, onStep }: { name: ComponentName; step: Step; onStep: (s: Step) => void }) {
  const { system: doc, theme } = useLiveTheme();
  const def = COMPONENTS[name];
  const shape = theme.components[name];
  const size = (editsOf(doc, name).size ?? {}) as Record<string, number | undefined>;
  const at = def.steps.includes(step) ? step : 'md';
  const height = shape.h[at] ?? 0;
  const note =
    name === 'badge'
      ? 'Exact, and never shorter than its text and border.'
      : height < TOUCH_TARGET
        ? name === 'input'
          ? `At least ${TOUCH_TARGET} tall on phones.`
          : `Phones raise the tap area to ${TOUCH_TARGET}; it keeps this height.`
        : undefined;
  return (
    <>
      <Choice label={`${def.label} size to tune`} value={at} options={def.steps.map((s) => ({ value: s, label: `${STEP_SHORT[s]} ${shape.h[s]}` }))} onChange={onStep} />
      <Slider
        label={`${STEP_LABEL[at]} height`}
        value={height}
        min={name === 'badge' ? Math.ceil(shape.text.leading + 2 * (shape.borderWidth ?? 0)) : 20}
        max={name === 'badge' ? 40 : 80}
        note={note}
        edited={size[at] !== undefined}
        onChange={(v) => setSize(name, at, v)}
        onReset={() => setSize(name, at, null)}
      />
      <Slider label="Padding" value={shape.x.md ?? 0} min={0} max={40} note={name === 'button' ? 'Small is 4 less, Large 4 more.' : 'Every size.'} edited={size.x !== undefined} onChange={(v) => setSize(name, 'x', v)} onReset={() => setSize(name, 'x', null)} />
      {shape.gap ? (
        <Slider
          label="Gap"
          value={shape.gap[at] ?? shape.gap.md ?? 0}
          min={0}
          max={24}
          note={name === 'button' && size.gap === undefined ? 'Between icon and label; Small is 6 until set.' : 'Between icon and label, every size.'}
          edited={size.gap !== undefined}
          onChange={(v) => setSize(name, 'gap', v)}
          onReset={() => setSize(name, 'gap', null)}
        />
      ) : null}
    </>
  );
}

function TypeGroup({ name }: { name: ComponentName }) {
  const { system: doc, theme } = useLiveTheme();
  const def = COMPONENTS[name];
  const shape = theme.components[name];
  const e = editsOf(doc, name);
  const selectId = React.useId();
  const style = e.text ?? def.text;
  return (
    <>
      <Row label="Text style" htmlFor={selectId}>
        <div className="flex items-center gap-2">
          <select id={selectId} value={style} onChange={(ev) => setText(name, ev.target.value)} className={`${inputClass} flex-1`}>
            {TEXT_STYLE_NAMES.map((s) => (
              <option key={s} value={s}>
                {TEXT_LABELS[s]}
              </option>
            ))}
          </select>
          {e.text ? <ResetLink label={`Reset ${def.label} text style`} onReset={() => setText(name, null)} /> : null}
        </div>
        <p className="text-muted-foreground text-xs">
          Its font, size and tracking: {shape.text.size} on a {shape.text.leading} line.
        </p>
      </Row>
      {def.props.includes('weight') ? (
        <Row label="Weight">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <Choice label={`${def.label} weight`} value={shape.text.weight} options={WEIGHTS.map((w) => ({ value: w, label: String(w), title: WEIGHT_LABELS[w] }))} onChange={(w) => setProp(name, 'weight', w === 500 ? null : w)} />
            </div>
            {e.weight !== undefined ? <ResetLink label={`Reset ${def.label} weight`} onReset={() => setProp(name, 'weight', null)} /> : null}
          </div>
        </Row>
      ) : null}
      {def.props.includes('case') ? (
        <Row label="Case">
          <Choice label={`${def.label} case`} value={shape.text.case} options={[{ value: 'none', label: 'Aa', title: 'as written' }, { value: 'uppercase', label: 'AA', title: 'uppercase' }]} onChange={(c) => setProp(name, 'case', c === 'none' ? null : c)} />
        </Row>
      ) : null}
      {def.props.includes('placeholder') ? (
        <Row label="Placeholder">
          <div className="flex items-center gap-2">
            <RolePicker label={`${def.label} placeholder`} color={shape.placeholder} onPick={(r) => setProp(name, 'placeholder', r === 'muted-foreground' ? null : r)} />
            {e.placeholder ? <ResetLink label={`Reset ${def.label} placeholder`} onReset={() => setProp(name, 'placeholder', null)} /> : null}
          </div>
        </Row>
      ) : null}
    </>
  );
}

function EffectsGroup({ name }: { name: ComponentName }) {
  const { system: doc, theme } = useLiveTheme();
  const def = COMPONENTS[name];
  const shape = theme.components[name];
  const e = editsOf(doc, name);
  return (
    <>
      {def.props.includes('icon') ? (
        <Slider
          label="Icon size"
          value={shape.icon ?? ICON_DEFAULT[name as 'button']}
          min={10}
          max={32}
          note={e.icon === undefined ? 'Both kits, where an icon sets no size of its own.' : undefined}
          edited={e.icon !== undefined}
          onChange={(v) => setProp(name, 'icon', v)}
          onReset={() => setProp(name, 'icon', null)}
        />
      ) : null}
      {def.props.includes('shadow') ? (
        <Row label="Shadow">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <Choice label={`${def.label} shadow`} value={shape.shadow ?? null} options={[{ value: 'none', label: 'None' }, { value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }]} onChange={(s) => setProp(name, 'shadow', s)} />
            </div>
            {e.shadow !== undefined ? <ResetLink label={`Reset ${def.label} shadow`} onReset={() => setProp(name, 'shadow', null)} /> : null}
          </div>
          {e.shadow === undefined ? <p className="text-muted-foreground text-xs">{name === 'button' ? 'Shadow 1 until set (Ghost has none). Both kits.' : 'None until set: fields are flat. Both kits.'}</p> : null}
        </Row>
      ) : null}
      {shape.ring ? (
        <>
          <Slider label="Focus ring width" value={shape.ring.width} min={0} max={8} edited={e.ring?.width !== undefined} onChange={(v) => setRing(name, 'width', v === RING_WIDTH ? null : v)} onReset={() => setRing(name, 'width', null)} />
          <Row label="Focus ring colour">
            <div className="flex items-center gap-2">
              <RolePicker
                label={`${def.label} focus ring`}
                color={name === 'button' ? shape.focusBorder : shape.variants.focus.ring}
                display={(v) => (e.ring?.role ? roleName(v) : name === 'button' ? 'Ring · Destructive its own' : 'Derived · the focus border')}
                onPick={(r) => setRing(name, 'role', r)}
              />
              {e.ring?.role ? <ResetLink label={`Reset ${def.label} focus ring colour`} onReset={() => setRing(name, 'role', null)} /> : null}
            </div>
            <p className="text-muted-foreground text-xs">At 50%{name === 'button' ? ', and the focused border' : ''}.</p>
          </Row>
        </>
      ) : null}
    </>
  );
}

function ColoursGroup({ name, variant, onVariant }: { name: ComponentName; variant: string; onVariant: (v: string) => void }) {
  const { system: doc, theme } = useLiveTheme();
  const mode = useMode();
  const def = COMPONENTS[name];
  const shape = theme.components[name];
  const v = shape.variants[variant];
  const edits = editedSlots(doc, name, variant);
  const slots = (def.variants[variant] as Slot[]).filter((s) => !(name === 'badge' && s === 'pressed'));
  const pairs = variantContrast(theme, name, variant);
  const title = `${def.label} ${VARIANT_LABELS[variant]}`;
  const slotLabel = (slot: Slot) => (name === 'input' && slot === 'label' ? 'Text' : slot === 'pressed' ? 'Hover · pressed' : SLOT_LABELS[slot]);
  return (
    <>
      <Choice label={`${def.label}: the ${name === 'input' ? 'state' : 'variant'} to colour`} value={variant} options={Object.keys(def.variants).map((k) => ({ value: k, label: VARIANT_LABELS[k] }))} onChange={onVariant} />
      {slots.map((slot) => {
        const color = v[slot] ?? (name === 'input' ? shape.variants.default[slot] : undefined);
        const edited = edits.includes(slot);
        const derived = slot === 'pressed' && !edited;
        const what = slotLabel(slot);
        return (
          <Row key={slot} label={what}>
            <div className="flex items-center gap-2">
              <RolePicker
                label={`${title} ${what.toLowerCase()}`}
                color={color}
                none={slot === 'fill' || slot === 'border'}
                display={(r) => (derived ? `Derived · ${colourName(color, mode).toLowerCase()}` : color && !color.role ? colourName(color, mode) : roleName(r))}
                onPick={(r) => setVariant(name, variant, slot, r)}
              />
              {edited ? <ResetLink label={`Reset ${title} ${what.toLowerCase()}`} onReset={() => setVariant(name, variant, slot, null)} /> : null}
            </div>
          </Row>
        );
      })}
      {name === 'input' && variant !== 'default' ? (
        <p className="text-muted-foreground text-xs">{variant === 'disabled' ? 'At 50% opacity; follows Default until set.' : `Follows Default until set; its ring is ${variant === 'focus' ? 'the focus ring' : 'the border at 20% (40% in dark)'}.`}</p>
      ) : null}
      <div className="flex flex-col gap-0.5 text-xs">
        {pairs.map((r) => (
          <Ratio key={r.mode} fg={r.fg} bg={r.bg} label={`Label on fill, ${r.mode} ·`} />
        ))}
        {name === 'button' || name === 'chip'
          ? pressedContrast(theme, name, variant).map((r) => <Ratio key={`h-${r.mode}`} fg={r.fg} bg={r.bg} label={`On hover · pressed, ${r.mode} ·`} />)
          : null}
        {name === 'input' && variant === 'default' ? variantContrast(theme, name, 'placeholder').map((r) => <Ratio key={`p-${r.mode}`} fg={r.fg} bg={r.bg} label={`Placeholder, ${r.mode} ·`} />) : null}
      </div>
      {usageOf([`component.${name}`]).length ? (
        <button type="button" onClick={() => showInComponents(`component.${name}`)} className="text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 self-start rounded text-xs font-medium underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2">
          <EyeIcon className="size-3.5" aria-hidden />
          Show usage
        </button>
      ) : null}
    </>
  );
}

// ---- the specimen ------------------------------------------------------------------------------------------------

const STATES: Record<ComponentName, SpecimenState[]> = {
  button: ['hover', 'pressed', 'focus', 'disabled', 'loading'],
  chip: ['hover', 'pressed', 'focus', 'disabled'],
  badge: [],
  input: [],
};
const STATE_LABEL: Record<SpecimenState, string> = { rest: 'Rest', hover: 'Hover', pressed: 'Pressed', focus: 'Focus', disabled: 'Disabled', loading: 'Loading' };
/** What each specimen says: a short action per Button variant (its column names the variant), a field's text. */
const LABEL: Record<string, string> = { primary: 'Save', secondary: 'Edit', outline: 'Share', ghost: 'Skip', destructive: 'Delete' };
const specimenLabel = (name: ComponentName, variant: string) =>
  name === 'input' ? (variant === 'default' ? 'Email' : variant === 'error' ? 'ada@' : variant === 'disabled' ? 'Read only' : 'Ada') : name === 'button' ? LABEL[variant] : VARIANT_LABELS[variant];
const valueOf = (name: ComponentName, variant: string) => (name === 'input' && (variant === 'focus' || variant === 'error') ? specimenLabel(name, variant) : undefined);

/** A variant column's header: picks what Colours edits, and carries the variant's item menu. */
function VariantHeader({ name, variant, selected, onSelect }: { name: ComponentName; variant: string; selected: boolean; onSelect: () => void }) {
  const { system: doc, theme } = useLiveTheme();
  const mode = useMode();
  const def = COMPONENTS[name];
  const v = theme.components[name].variants[variant];
  const edits = editedSlots(doc, name, variant);
  const p = prefixOf(name);
  const title = `${def.label} ${VARIANT_LABELS[variant]}`;
  const fill = v.fill ?? theme.components[name].variants.default?.fill;
  return (
    <ItemMenu
      id={`component.${name}.${variant}`}
      compact
      className="inline-flex"
      spec={{
        title: `${title} · ${name === 'input' ? 'state' : 'variant'}`,
        usage: { keys: [`component.${name}`], label: def.label },
        copy: { cls: `bg-${p}-${variant}-bg`, variable: `--${p}-${variant}-bg`, value: fill?.[mode].toUpperCase() },
        onReset: edits.length ? () => resetVariant(name, variant) : null,
        onDuplicate: fill
          ? () => {
              const token = freeName(doc, 'color', `${name}-${variant}`);
              addExtra('color', { name: token, value: { light: fill.light, dark: fill.dark } });
            }
          : undefined,
      }}>
      <button
        type="button"
        aria-pressed={selected}
        aria-label={`${title}${edits.length ? ', edited' : ''}: edit its colours`}
        onClick={onSelect}
        className={`focus-visible:ring-ring inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-md px-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 ${selected ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}>
        {VARIANT_LABELS[variant]}
        {edits.length ? <EditedDot className={selected ? 'bg-background' : ''} /> : null}
      </button>
    </ItemMenu>
  );
}

/** Variants by size (Large, Medium, Small, a Medium with an icon), then the states row and the in-context strip. */
function SpecimenGrid({ name, variant, onVariant, step, onStep, narrow }: { name: ComponentName; variant: string; onVariant: (v: string) => void; step: Step; onStep: (s: Step) => void; narrow: boolean }) {
  const { theme } = useLiveTheme();
  const mode = useMode();
  const def = COMPONENTS[name];
  const shape = theme.components[name];
  const variants = Object.keys(def.variants);
  const at = def.steps.includes(step) ? step : 'md';
  const steps = [...def.steps].reverse() as Step[];
  // Every size side by side while they fit; one at a time, a row per variant (as on a phone), when they'd scroll
  // sideways.
  const box = React.useRef<HTMLDivElement>(null);
  const grid = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);
  const [needs, setNeeds] = React.useState<number | null>(null);
  React.useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // A new look may fit again: measure the full grid afresh.
  React.useLayoutEffect(() => setNeeds(null), [shape]);
  const one = narrow || (needs !== null && width < needs);
  React.useLayoutEffect(() => {
    const g = grid.current;
    if (one || !g || !width) return;
    if (g.scrollWidth > width + 1) setNeeds(g.scrollWidth);
  }, [one, width, shape]);
  const icon = name !== 'input' ? [{ key: 'icon', title: 'Icon', step: 'md' as Step, icon: true }] : [];
  const rows: { key: string; title: string; step: Step; icon?: boolean }[] = [...steps.map((s) => ({ key: s, title: STEP_LABEL[s], step: s })), ...icon];
  const states = STATES[name];
  const fit = name === 'input' ? 'w-[7.5rem]' : '';
  return (
    <div className="flex min-w-0 flex-col gap-4">
      {one ? <Choice label={`${def.label} size shown`} value={at} options={def.steps.map((s) => ({ value: s, label: STEP_LABEL[s] }))} onChange={onStep} /> : null}
      <div ref={box} className="overflow-x-auto pb-1">
        {one ? (
          // One size at a time: a row per variant (its name, the size, the icon example), so nothing scrolls sideways.
          <div role="group" aria-label={`${def.label} by ${name === 'input' ? 'state' : 'variant'}, ${STEP_LABEL[at]}; a row’s name picks what Colours edits`} className="grid w-max items-center gap-x-2 gap-y-1.5" style={{ gridTemplateColumns: `max-content repeat(${icon.length + 1}, max-content)` }}>
            <span />
            <span className="text-muted-foreground text-xs">{STEP_LABEL[at]}</span>
            {icon.length ? <span className="text-muted-foreground text-xs">Icon</span> : null}
            {variants.map((v) => (
              <React.Fragment key={v}>
                <VariantHeader name={name} variant={v} selected={v === variant} onSelect={() => onVariant(v)} />
                {[false, ...(icon.length ? [true] : [])].map((withIcon) => (
                  <span key={String(withIcon)} className={`flex rounded-lg p-1 ${v === variant ? 'bg-accent' : ''}`}>
                    <Specimen name={name} shape={shape} variant={v} mode={mode} step={at} icon={withIcon} label={specimenLabel(name, v)} value={valueOf(name, v)} className={fit} />
                  </span>
                ))}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div ref={grid} role="group" aria-label={`${def.label} by ${name === 'input' ? 'state' : 'variant'} and size; a column’s name picks what Colours edits`} className="grid w-max items-center gap-x-1 gap-y-1.5" style={{ gridTemplateColumns: `3.25rem repeat(${variants.length}, max-content)` }}>
            <span />
            {variants.map((v) => (
              <VariantHeader key={v} name={name} variant={v} selected={v === variant} onSelect={() => onVariant(v)} />
            ))}
            {rows.map((r) => (
              <React.Fragment key={r.key}>
                <span className="text-muted-foreground text-xs">{r.title}</span>
                {variants.map((v) => (
                  <span key={v} className={`flex rounded-lg p-1 ${v === variant ? 'bg-accent' : ''}`}>
                    <Specimen name={name} shape={shape} variant={v} mode={mode} step={r.step} icon={r.icon} label={specimenLabel(name, v)} value={valueOf(name, v)} className={fit} />
                  </span>
                ))}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
      {states.length ? (
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-xs">
            States · <span className="text-foreground">{VARIANT_LABELS[variant]}</span>
          </p>
          <div className="flex flex-wrap items-end gap-3">
            {states.map((s) => (
              <span key={s} className="flex flex-col items-start gap-1">
                <Specimen name={name} shape={shape} variant={variant} mode={mode} step={one ? at : 'md'} state={s} label={s === 'loading' ? 'Saving' : specimenLabel(name, variant)} />
                <span className="text-muted-foreground text-[11px]">{STATE_LABEL[s]}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <div className="border-border flex flex-col gap-2 border-t pt-4">
        <p className="text-muted-foreground text-xs">In context, live on the system</p>
        <div className="flex flex-wrap gap-3">
          <InContext name={name} shape={shape} mode={mode} input={theme.components.input} />
        </div>
      </div>
    </div>
  );
}

// ---- the cards ---------------------------------------------------------------------------------------------------

const NOTE: Partial<Record<ComponentName, string>> = { badge: 'the “Tag”', input: 'also Textarea, Select' };

function CollapsedCard({ name, onOpen, buttonRef }: { name: ComponentName; onOpen: () => void; buttonRef: (el: HTMLButtonElement | null) => void }) {
  const { system: doc, theme } = useLiveTheme();
  const mode = useMode();
  const def = COMPONENTS[name];
  const edits = componentEdits(doc, name).length;
  const text = summary(theme, name);
  const first = Object.keys(def.variants)[name === 'chip' ? 1 : 0];
  return (
    <ItemMenu id={`component.${name}`} spec={cardMenu(name, doc)}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={false}
        aria-label={`Open ${def.label}: ${text}${edits ? `, ${edits} edited` : ''}`}
        data-component-card={name}
        onClick={onOpen}
        className="border-border hover:bg-accent focus-visible:ring-ring flex w-full min-w-0 items-center gap-3 rounded-xl border p-3 pr-9 text-left focus-visible:outline-none focus-visible:ring-2">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-x-1.5 text-sm font-semibold">
            {def.label}
            {NOTE[name] ? <span className="text-muted-foreground text-xs font-normal">{NOTE[name]}</span> : null}
            {edits ? (
              <span className="text-muted-foreground inline-flex items-center gap-1 text-xs font-normal">
                <EditedDot />
                {edits} edited
              </span>
            ) : null}
          </span>
          <span className="text-muted-foreground text-xs">{text}</span>
        </span>
        <span className="pointer-events-none flex shrink-0 max-sm:hidden" aria-hidden>
          <Specimen name={name} shape={theme.components[name]} variant={first} mode={mode} label={specimenLabel(name, first)} value={valueOf(name, first)} className={name === 'input' ? 'w-40' : ''} />
        </span>
        <ChevronDownIcon className="text-muted-foreground size-4 shrink-0" aria-hidden />
      </button>
    </ItemMenu>
  );
}

function OpenCard({ name, onClose }: { name: ComponentName; onClose: () => void }) {
  const { system: doc } = useLiveTheme();
  const narrow = useNarrow();
  const def = COMPONENTS[name];
  const edits = componentEdits(doc, name).length;
  const [variant, setVariant] = React.useState(Object.keys(def.variants)[0]);
  const [step, setStep] = React.useState<Step>('md');
  const [openGroup, setOpenGroup] = React.useState<Group | null>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const headingId = `component-${name}-title`;

  // Focus moves into the card; a phone's full-screen card holds the page still.
  React.useEffect(() => {
    closeRef.current?.focus({ preventScroll: !narrow });
  }, [narrow]);
  React.useEffect(() => {
    if (!narrow) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [narrow]);

  const groups: { group: Group; lock?: { keys: LockKey[]; label: string }; body: React.ReactNode }[] = [
    { group: 'style', lock: name === 'button' ? { keys: ['button'], label: 'button style' } : name === 'input' ? { keys: ['field'], label: 'field style' } : undefined, body: <StyleGroup name={name} /> },
    { group: 'shape', lock: name === 'button' || name === 'chip' ? { keys: ['controls'], label: 'control shape' } : undefined, body: <ShapeGroup name={name} /> },
    { group: 'size', lock: name === 'button' || name === 'input' ? { keys: ['density'], label: 'density' } : undefined, body: <SizeGroup name={name} step={step} onStep={setStep} /> },
    { group: 'type', body: <TypeGroup name={name} /> },
    ...(def.props.some((p) => p === 'icon' || p === 'shadow' || p === 'ring') ? [{ group: 'effects' as Group, body: <EffectsGroup name={name} /> }] : []),
    { group: 'colours', body: <ColoursGroup name={name} variant={variant} onVariant={setVariant} /> },
  ];

  return (
    <section
      aria-labelledby={headingId}
      role={narrow ? 'dialog' : undefined}
      aria-modal={narrow || undefined}
      data-component-card={name}
      data-open="true"
      onKeyDown={(e) => {
        // Escape closes the card, unless a picker inside is taking it.
        if (e.key === 'Escape' && (e.target as HTMLElement).getAttribute('role') !== 'combobox') {
          e.stopPropagation();
          onClose();
        }
      }}
      className="border-border bg-background flex min-w-0 flex-col rounded-xl border max-md:fixed max-md:inset-0 max-md:z-[60] max-md:overflow-y-auto max-md:rounded-none max-md:border-0">
      <ItemMenu id={`component.${name}`} spec={cardMenu(name, doc)} className="max-md:bg-background max-md:sticky max-md:top-0 max-md:z-10">
        <div className="border-border flex flex-wrap items-center gap-x-3 gap-y-1 border-b py-2 pl-4 pr-9">
          <h3 id={headingId} className="flex items-center gap-1.5 text-sm font-semibold">
            {def.label}
            {NOTE[name] ? <span className="text-muted-foreground text-xs font-normal">{NOTE[name]}</span> : null}
          </h3>
          <span className="flex-1" />
          {edits ? (
            <ResetLink label={`Reset every edit to ${def.label}`} onReset={() => resetComponent(name)}>
              {edits} edited · reset all
            </ResetLink>
          ) : null}
          <button
            ref={closeRef}
            type="button"
            aria-expanded
            aria-label={narrow ? `Close ${def.label}` : `Collapse ${def.label}`}
            onClick={onClose}
            className="hover:bg-accent focus-visible:ring-ring inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 max-md:size-11 max-md:justify-center max-md:px-0">
            {narrow ? (
              <XIcon className="size-5" aria-hidden />
            ) : (
              <>
                Collapse
                <ChevronUpIcon className="size-3.5" aria-hidden />
              </>
            )}
          </button>
        </div>
      </ItemMenu>
      <div className="grid min-w-0 gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        {/* The specimen stays in view while the panel scrolls beside it. */}
        <div className="min-w-0 lg:sticky lg:top-[calc(3rem+var(--studio-bar,3.5rem)+1rem)] lg:self-start">
          <SpecimenGrid name={name} variant={variant} onVariant={setVariant} step={step} onStep={setStep} narrow={narrow} />
        </div>
        <div className="lg:border-border flex min-w-0 flex-col gap-3 lg:border-l lg:pl-5">
          {groups.map((g) => (
            <PanelGroup
              key={g.group}
              name={name}
              group={g.group}
              title={g.group === 'colours' ? `Colours · ${VARIANT_LABELS[variant]}` : undefined}
              narrow={narrow}
              open={openGroup === g.group}
              onToggle={() => setOpenGroup(openGroup === g.group ? null : g.group)}
              lock={g.lock}>
              {g.body}
            </PanelGroup>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ComponentsSection() {
  const [open, setOpen] = React.useState<ComponentName | null>(null);
  const triggers = React.useRef(new Map<ComponentName, HTMLButtonElement>());
  const close = (name: ComponentName) => {
    setOpen(null);
    // Back to the card it came from.
    requestAnimationFrame(() => triggers.current.get(name)?.focus());
  };
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
      <p className="text-muted-foreground -mt-2 text-xs">One theme for both kits: every change here reaches the mobile and the web kit alike. Open a card to edit it.</p>
      <div className="flex flex-col gap-3">
        {COMPONENT_ORDER.map((name) =>
          open === name ? (
            <OpenCard key={name} name={name} onClose={() => close(name)} />
          ) : (
            <CollapsedCard
              key={name}
              name={name}
              onOpen={() => setOpen(name)}
              buttonRef={(el) => {
                if (el) triggers.current.set(name, el);
                else triggers.current.delete(name);
              }}
            />
          )
        )}
      </div>
    </FoundationSection>
  );
}
