'use client';
import { COLOR_ROLES, ROLE_NAMES, type ColorRole, type HalftoneSystem } from '@halftone-ds/tokens/system';
import { OPTIONS } from '@halftone-ds/tokens/theme';
import * as React from 'react';
import { HexField, Swatch, TokenPicker } from '@/components/theme/studio/fields';
import { ItemMenu } from '@/components/theme/studio/item-menu';
import { EditedDot, Field, inputClass, ItemPopover, openItem, smallButton } from '@/components/theme/studio/item-popover';
import { LABELS } from '@/components/theme/studio/parts';
import { FoundationSection, NewMenu, Segmented } from '@/components/theme/studio/section';
import {
  addExtra,
  checkExtraName,
  contrast,
  deleteExtra,
  extraLabel,
  extrasOf,
  freeName,
  renameExtra,
  updateExtra,
  grade,
  overridesOf,
  RAMP_LABELS,
  rampsOf,
  ratioText,
  resetRamp,
  roleHex,
  roleLabel,
  rolePair,
  ROLES,
  ROLES_SHOWN,
  rolesOn,
  roleTarget,
  setAnchor,
  setNeutralPreset,
  setRole,
  setSeed,
  setStep,
  STEPS,
  targetLabel,
  type Mode,
} from '@/lib/studio/foundations';
import { useMode } from '@/lib/theme/mode';
import { systemTheme } from '@/lib/studio/systems';
import { useLiveTheme } from '@/lib/theme/store';

/** The tag every extra carries (wireframe 1). */
export function ExtraTag() {
  return <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium">Not used by components</span>;
}

/**
 * Foundations › Colours (wireframes 1 and 2): the roles components use, then the six ramps on one 50–950 axis. The
 * ramps are shared by light and dark; each role points at one step in light and another in dark, and the section's
 * Light / dark switch shows (and the role popover edits) either mapping. Contrast warns on your own choices and
 * never changes them (the generator auto-fixes only what it generated).
 */

/** "6.1 AA", with a warning colour when it fails. */
export function Ratio({ fg, bg, threshold = 4.5, label }: { fg: string; bg: string; threshold?: number; label?: string }) {
  const r = contrast(fg, bg);
  const g = grade(r, threshold);
  return (
    <span className={`inline-flex items-center gap-1 tabular-nums ${g ? '' : 'text-destructive font-medium'}`}>
      {label ? <span className="text-muted-foreground font-normal">{label}</span> : null}
      {ratioText(r)}
      <span className={g ? 'text-foreground' : ''}>{g ?? (threshold < 4.5 ? 'below 3:1' : 'fails AA')}</span>
    </span>
  );
}

// ---- roles ----------------------------------------------------------------------------------------

const hasForeground = (name: string) => ROLE_NAMES.includes(`${name}-foreground`);

function ModeRow({ doc, name, mode }: { doc: HalftoneSystem; name: string; mode: Mode }) {
  const target = roleTarget(doc, name)[mode];
  const edited = overridesOf(doc).has(`roles.${name}.${mode}`);
  const label = `${roleLabel(name)}, ${mode}`;
  return (
    <Field label={mode === 'light' ? 'Light' : 'Dark'}>
      <TokenPicker doc={doc} value={target} hex={roleHex(doc, name, mode)} label={label} onPick={(v) => setRole(name, mode, v)} />
      {edited ? (
        <button
          type="button"
          onClick={() => setRole(name, mode, null)}
          className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1 text-xs underline underline-offset-2"
          aria-label={`Reset ${label} to generated`}>
          <EditedDot />
          reset
        </button>
      ) : null}
    </Field>
  );
}

function RolePopover({ name, mode }: { name: string; mode: Mode }) {
  const { system: doc, theme } = useLiveTheme();
  const target = roleTarget(doc, name)[mode];
  const hex = theme.resolved[mode][name];
  const fg = hasForeground(name) ? `${name}-foreground` : null;
  const overrides = overridesOf(doc);
  const editedPaths = [...overrides].filter((p) => p.startsWith(`roles.${name}.`) || (fg && p.startsWith(`roles.${fg}.`)));
  const pair = rolePair(name);
  const warned = theme.warnings.filter((w) => w.locked.some((l) => l === name || l === fg));
  const edited = editedPaths.length > 0;
  const resetAll = () => editedPaths.forEach((p) => setRole(p.split('.')[1], p.split('.')[2] as Mode, null));
  const others = target ? rolesOn(doc, target).map((r) => r.name).filter((n) => n !== name) : [];
  return (
    <ItemMenu
      id={`role.${name}`}
      spec={{
        title: `${roleLabel(name)} · role`,
        usage: { keys: [`color.${name}`], label: roleLabel(name), also: others },
        copy: { cls: `bg-${name}`, variable: `--${name}`, value: hex.toUpperCase() },
        onReset: edited ? resetAll : null,
        onDuplicate: () => {
          const token = freeName(doc, 'color', `${name}-copy`);
          addExtra('color', { name: token, value: { light: theme.resolved.light[name], dark: theme.resolved.dark[name] } });
          openItem(`extra.color.${token}`);
        },
      }}>
    <ItemPopover
      id={`role.${name}`}
      title={roleLabel(name)}
      slot={name}
      trigger={
        <button
          type="button"
          aria-label={`${roleLabel(name)}: ${targetLabel(target)}${edited ? ', edited' : ''}. Edit`}
          className="border-border hover:bg-accent focus-visible:ring-ring flex w-full min-w-0 items-center gap-2 rounded-lg border py-1.5 pl-1.5 pr-2.5 text-left focus-visible:outline-none focus-visible:ring-2">
          <Swatch hex={hex} className="size-7 rounded-md" />
          <span className="flex min-w-0 flex-col">
            <span className="flex items-center gap-1 text-xs font-medium">
              <span className="truncate">{roleLabel(name)}</span>
              {edited ? <EditedDot /> : null}
            </span>
            <span className="text-muted-foreground truncate text-[11px]">{targetLabel(target).toLowerCase()}</span>
          </span>
        </button>
      }
      preview={
        <div className="grid grid-cols-2 gap-2">
          {(['light', 'dark'] as const).map((m) => {
            const r = theme.resolved[m];
            const fill = pair?.on ? r[name] : r[pair?.other ?? 'background'];
            const ink = pair?.on ? r[pair.other] : r[name];
            return (
              <div key={m} className="ring-foreground/10 flex h-14 flex-col justify-between rounded-lg p-2 ring-1 ring-inset" style={{ background: fill, color: ink }}>
                <span className="text-sm font-semibold">Aa</span>
                <span className="font-mono text-[10px] uppercase">
                  {m} · {r[name]}
                </span>
              </div>
            );
          })}
        </div>
      }
      status={{
        edited: edited ? { label: editedPaths.length > 1 ? `${editedPaths.length} edited` : 'edited', action: editedPaths.length > 1 ? 'reset all' : 'reset', onReset: () => editedPaths.forEach((p) => setRole(p.split('.')[1], p.split('.')[2] as Mode, null)) } : null,
        contrast: pair ? (
          <div className="flex flex-col gap-0.5">
            {(['light', 'dark'] as const).map((m) => (
              <Ratio
                key={m}
                fg={pair.on ? theme.resolved[m][pair.other] : theme.resolved[m][name]}
                bg={pair.on ? theme.resolved[m][name] : theme.resolved[m][pair.other]}
                threshold={pair.threshold}
                label={`${pair.on ? `${roleLabel(pair.other)} on it` : `On ${pair.other}`}, ${m} ·`}
              />
            ))}
          </div>
        ) : null,
        note: warned.length ? (
          <div className="text-destructive flex flex-col gap-0.5">
            <span className="font-medium">Your choice fails contrast. It stays as you set it:</span>
            {warned.map((w) => (
              <span key={`${w.mode}-${w.label}`}>
                {w.label}, {w.mode} · {ratioText(w.ratio)} (needs {w.threshold})
              </span>
            ))}
          </div>
        ) : undefined,
      }}>
      <ModeRow doc={doc} name={name} mode="light" />
      <ModeRow doc={doc} name={name} mode="dark" />
      {fg ? (
        <>
          <p className="text-muted-foreground -mb-1 pt-1 text-xs font-medium">{roleLabel(fg)}</p>
          <ModeRow doc={doc} name={fg} mode="light" />
          <ModeRow doc={doc} name={fg} mode="dark" />
        </>
      ) : null}
      <p className="text-muted-foreground text-xs">
        Showing {hex.toUpperCase()} in {mode}.
      </p>
    </ItemPopover>
    </ItemMenu>
  );
}

function RolesRow({ mode }: { mode: Mode }) {
  const [more, setMore] = React.useState(false);
  const listId = React.useId();
  const shown = more ? ROLES : ROLES.slice(0, ROLES_SHOWN);
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-muted-foreground text-xs font-medium">Roles · what components use</h3>
      <ul id={listId} className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-1.5">
        {shown.map((name) => (
          <li key={name} className="flex min-w-0 flex-col">
            <RolePopover name={name} mode={mode} />
          </li>
        ))}
        <li className="flex">
          <button
            type="button"
            aria-expanded={more}
            aria-controls={listId}
            onClick={() => setMore((m) => !m)}
            className="border-border text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring flex min-h-11 w-full items-center justify-center rounded-lg border border-dashed px-2.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2">
            {more ? 'Fewer' : `+ ${ROLES.length - ROLES_SHOWN} more`}
          </button>
        </li>
      </ul>
    </div>
  );
}

// ---- ramps ----------------------------------------------------------------------------------------

function StepPopover({ role, step }: { role: ColorRole; step: string }) {
  const { system: doc } = useLiveTheme();
  const ramp = rampsOf(doc)[role];
  const values = ramp.values as Record<string, string>;
  const hex = values[step];
  const isInput = ramp.anchor === step;
  const edited = ramp.edited.includes(step);
  const target = `${role}.${step}`;
  const users = rolesOn(doc, target);
  const name = `${RAMP_LABELS[role]} ${step}`;
  const id = React.useId();
  return (
    <ItemMenu
      id={`step.${target}`}
      compact
      spec={{
        title: `${name} · step`,
        usage: users.length ? { keys: users.map((u) => `color.${u.name}`), label: name, also: users.map((u) => u.name) } : undefined,
        copy: { value: hex.toUpperCase() },
        onReset: edited ? () => setStep(role, step, null) : null,
        onDuplicate: () => {
          const token = freeName(doc, 'color', `${role}-${step}`);
          addExtra('color', { name: token, value: hex });
          openItem(`extra.color.${token}`);
        },
      }}>
    <ItemPopover
      id={`step.${target}`}
      title={name}
      slot={step}
      trigger={
        <button
          type="button"
          aria-label={`${name}, ${hex.toUpperCase()}${isInput ? ', input colour' : ''}${edited ? ', edited' : ''}. Edit`}
          className={`focus-visible:ring-ring relative h-9 w-full min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:h-10 ${
            isInput ? 'ring-foreground ring-2 ring-offset-1 ring-offset-[var(--color-card)]' : 'ring-foreground/10 ring-1 ring-inset'
          }`}
          style={{ background: hex }}>
          {edited ? <EditedDot className="ring-card absolute right-1 top-1 ring-2" /> : null}
        </button>
      }
      preview={
        <div className="ring-foreground/10 flex h-20 items-end justify-between rounded-lg p-2.5 ring-1 ring-inset" style={{ background: hex, color: contrast(hex, '#ffffff') >= contrast(hex, '#000000') ? '#ffffff' : '#000000' }}>
          <span className="font-mono text-xs uppercase">{hex}</span>
          {/* eslint-disable-next-line halftone/no-raw-colour -- a label drawn over a swatch of any colour */}
          {isInput ? <span className="rounded bg-black/20 px-1.5 py-0.5 text-[11px] font-medium text-white">input</span> : null}
        </div>
      }
      status={{
        edited: edited ? { onReset: () => setStep(role, step, null) } : null,
        contrast: (
          <span className="flex flex-wrap gap-x-3">
            <Ratio fg={hex} bg="#ffffff" label="on white" />
            <Ratio fg={hex} bg={values['950']} label="on 950" />
          </span>
        ),
        usedBy: users.length ? (
          <span>
            Used by{' '}
            <span className="text-foreground">
              {users.map((u) => `${roleLabel(u.name)}${u.modes.length === 2 ? '' : ` (${u.modes[0]})`}`).join(', ')}
            </span>
          </span>
        ) : (
          'No role points at this step.'
        ),
      }}>
      <Field label="Hex" htmlFor={id}>
        <HexField id={id} label={name} value={hex} onChange={(v) => setStep(role, step, v)} />
      </Field>
      {isInput ? <p className="text-muted-foreground text-xs">This is the ramp’s input step. To regenerate the ramp from a new colour, change the input on the ramp’s label.</p> : null}
    </ItemPopover>
    </ItemMenu>
  );
}

function RampPopover({ role }: { role: ColorRole }) {
  const { system: doc } = useLiveTheme();
  const ramp = rampsOf(doc)[role];
  const values = ramp.values as Record<string, string>;
  const overrides = overridesOf(doc);
  const own = [...overrides].filter((p) => p.startsWith(`colors.${role}.`));
  const presetNeutral = role === 'neutral' && !doc.colors.neutral?.seed;
  const label = RAMP_LABELS[role];
  const inputId = React.useId();
  const pinId = React.useId();
  const neutralId = React.useId();
  const natural = ramp.anchor && !doc.colors[role]?.anchor ? ramp.anchor : null;
  return (
    <ItemMenu
      id={`ramp.${role}`}
      className="max-sm:col-span-11"
      spec={{
        title: `${label} · ramp`,
        copy: { value: ramp.seed.startsWith('#') ? ramp.seed.toUpperCase() : ramp.seed },
        onReset: own.length ? () => resetRamp(role) : null,
        onDuplicate: () => {
          const token = freeName(doc, 'color', `${role}-ramp`);
          addExtra('color', { name: token, seed: values[ramp.anchor ?? '500'] });
          openItem(`extra.color.${token}`);
        },
        lock: role === 'brand' ? ['brand'] : role === 'neutral' ? ['neutral'] : undefined,
      }}>
    <ItemPopover
      id={`ramp.${role}`}
      title={label}
      slot={role}
      side="right"
      trigger={
        <button
          type="button"
          aria-label={`${label} ramp${own.length ? `, ${own.length} edited` : ''}. Edit input colour and pin`}
          className="hover:bg-accent focus-visible:ring-ring flex w-full min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2">
          <span className="truncate">{label}</span>
          {own.length ? <EditedDot /> : null}
        </button>
      }
      preview={
        <div className="grid grid-cols-11 gap-0.5">
          {STEPS.map((s) => (
            <span key={s} className={`h-6 rounded-sm ${ramp.anchor === s ? 'ring-foreground ring-2' : ''}`} style={{ background: values[s] }} aria-hidden />
          ))}
        </div>
      }
      status={{
        edited: own.length ? { label: own.length > 1 ? `${own.length} edited` : 'edited', action: own.length > 1 ? 'reset all' : 'reset', onReset: () => resetRamp(role) } : null,
        note:
          ramp.source === 'base'
            ? 'The kit’s own ramp. Set an input colour to generate one from it.'
            : role === 'brand'
              ? 'The input is the system’s brand colour: Shuffle and the theme bar change it too.'
              : undefined,
      }}>
      {role === 'neutral' ? (
        <Field label="Base" htmlFor={neutralId}>
          <select
            id={neutralId}
            value={presetNeutral ? doc.recipe.neutral : 'custom'}
            onChange={(e) => (e.target.value === 'custom' ? setSeed('neutral', values['500']) : setNeutralPreset(e.target.value as HalftoneSystem['recipe']['neutral']))}
            className={`${inputClass} w-full`}>
            {OPTIONS.neutral.map((n) => (
              <option key={n} value={n}>
                {LABELS[n] ?? n}
                {n === 'brand' ? ' (brand hue)' : ''}
              </option>
            ))}
            <option value="custom">Custom colour</option>
          </select>
        </Field>
      ) : null}
      {presetNeutral ? null : (
        <>
          <Field label="Input" htmlFor={inputId}>
            <HexField id={inputId} label={`${label} input colour`} value={ramp.seed} onChange={(hex) => setSeed(role, hex)} />
          </Field>
          <Field label="Pin" htmlFor={pinId} hint="The step the input sits on exactly. Auto picks the nearest by lightness.">
            <select
              id={pinId}
              value={doc.colors[role]?.anchor ?? 'auto'}
              onChange={(e) => setAnchor(role, e.target.value === 'auto' ? null : e.target.value)}
              className={`${inputClass} w-full`}>
              <option value="auto">Auto{natural ? ` · ${natural}` : ''}</option>
              {STEPS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}
    </ItemPopover>
    </ItemMenu>
  );
}

// ---- extras ----------------------------------------------------------------------------------------

type ExtraColor = { name: string; value?: string | { light: string; dark: string }; seed?: string; anchor?: string };

/** An extra colour's popover: a single colour (light, and maybe dark) or a ramp from one colour. */
function ExtraColourPopover({ item, trigger, className }: { item: ExtraColor; trigger: React.ReactElement; className?: string }) {
  const { system: doc, theme } = useLiveTheme();
  const name = item.name;
  const id = `extra.color.${name}`;
  const inputId = React.useId();
  const darkId = React.useId();
  const pinId = React.useId();
  const value = typeof item.value === 'object' ? item.value : item.value ? { light: item.value, dark: item.value } : null;
  const ramp = (systemTheme(doc) as { extra?: { color?: Record<string, Record<string, { $value: string }>> } }).extra?.color?.[name];
  return (
    <ItemMenu
      id={id}
      className={className}
      spec={{
        title: `${extraLabel(name)} · extra`,
        copy: { cls: item.seed ? `bg-${name}-500` : `bg-${name}`, variable: item.seed ? `--${name}-500` : `--${name}`, value: (value?.light ?? item.seed ?? '').toUpperCase() },
        onDuplicate: () => {
          const token = freeName(doc, 'color', `${name}-copy`);
          addExtra('color', { ...item, name: token });
          openItem(`extra.color.${token}`);
        },
        onDelete: () => deleteExtra('color', name),
      }}>
      <ItemPopover
        id={id}
        title={extraLabel(name)}
        extra={{ name: extraLabel(name), token: name, onRename: (typed) => renameExtra(doc, 'color', name, typed), check: (typed) => checkExtraName(doc, 'color', name, typed), onDelete: () => deleteExtra('color', name) }}
        trigger={trigger}
        preview={
          item.seed && ramp ? (
            <div className="grid grid-cols-11 gap-0.5">
              {STEPS.map((s) => (
                <span key={s} className="h-6 rounded-sm" style={{ background: ramp[s]?.$value }} aria-hidden />
              ))}
            </div>
          ) : value ? (
            <div className="grid grid-cols-2 gap-2">
              {(['light', 'dark'] as const).map((m) => (
                <div key={m} className="ring-foreground/10 flex h-12 items-end rounded-lg p-2 ring-1 ring-inset" style={{ background: theme.resolved[m].background }}>
                  <span className="h-6 flex-1 rounded" style={{ background: value[m] }} aria-hidden />
                  <span className="ml-2 font-mono text-[10px] uppercase" style={{ color: theme.resolved[m].foreground }}>
                    {m}
                  </span>
                </div>
              ))}
            </div>
          ) : null
        }
        status={{ note: <span>Exported to tokens.json, CSS and Tailwind as <code className="font-mono">{item.seed ? `bg-${name}-50…950` : `bg-${name}`}</code>. No kit component reads it.</span> }}>
        {item.seed ? (
          <>
            <Field label="Input" htmlFor={inputId}>
              <HexField id={inputId} label={`${extraLabel(name)} input colour`} value={item.seed} onChange={(hex) => updateExtra('color', name, (e) => ({ ...e, seed: hex }), `extra.${name}`)} />
            </Field>
            <Field label="Pin" htmlFor={pinId}>
              <select
                id={pinId}
                value={(item.anchor as string) ?? 'auto'}
                onChange={(e) =>
                  updateExtra('color', name, (x) => {
                    const { anchor: _a, ...rest } = x;
                    return e.target.value === 'auto' ? rest : { ...rest, anchor: e.target.value };
                  })
                }
                className={`${inputClass} w-full`}>
                <option value="auto">Auto</option>
                {STEPS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </>
        ) : value ? (
          <>
            <Field label={typeof item.value === 'object' ? 'Light' : 'Colour'} htmlFor={inputId}>
              <HexField
                id={inputId}
                label={`${extraLabel(name)}, light`}
                value={value.light}
                onChange={(hex) => updateExtra('color', name, (e) => ({ ...e, value: typeof e.value === 'object' ? { ...(e.value as object), light: hex } : hex }), `extra.${name}.light`)}
              />
            </Field>
            {typeof item.value === 'object' ? (
              <Field label="Dark" htmlFor={darkId}>
                <HexField id={darkId} label={`${extraLabel(name)}, dark`} value={value.dark} onChange={(hex) => updateExtra('color', name, (e) => ({ ...e, value: { ...(e.value as object), dark: hex } }), `extra.${name}.dark`)} />
              </Field>
            ) : null}
            <button
              type="button"
              className={`${smallButton} self-start`}
              onClick={() => updateExtra('color', name, (e) => ({ ...e, value: typeof e.value === 'object' ? (e.value as { light: string }).light : { light: e.value as string, dark: e.value as string } }))}>
              {typeof item.value === 'object' ? 'Use one colour for both' : 'Add a dark value'}
            </button>
          </>
        ) : null}
      </ItemPopover>
    </ItemMenu>
  );
}

/** Extra single colours, inline at the end of Colours with their tag. */
function ExtraColours() {
  const { system: doc, theme } = useLiveTheme();
  const mode = useMode();
  const singles = (extrasOf(doc, 'color') as ExtraColor[]).filter((e) => !e.seed);
  if (!singles.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-muted-foreground text-xs font-medium">Extras · your own colours</h3>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-1.5">
        {singles.map((item, i) => {
          const v = typeof item.value === 'object' ? item.value[mode] : (item.value ?? theme.resolved.light.primary);
          return (
            <li key={i} className="flex min-w-0 flex-col">
              <ExtraColourPopover
                item={item}
                trigger={
                  <button
                    type="button"
                    aria-label={`${extraLabel(item.name)}, extra colour, ${v.toUpperCase()}. Edit`}
                    className="border-border hover:bg-accent focus-visible:ring-ring flex w-full min-w-0 items-center gap-2 rounded-lg border py-1.5 pl-1.5 pr-2.5 text-left focus-visible:outline-none focus-visible:ring-2">
                    <Swatch hex={v} className="size-7 rounded-md" />
                    <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                      <span className="max-w-full truncate text-xs font-medium">
                        {extraLabel(item.name)} <span className="text-muted-foreground font-mono text-[11px] font-normal">{v.toUpperCase()}</span>
                      </span>
                      <ExtraTag />
                    </span>
                  </button>
                }
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** "+ New colour": a single colour (one hex, light and dark) or a ramp (50–950 from one colour). */
function NewColour() {
  const { system: doc, theme } = useLiveTheme();
  return (
    <NewMenu
      section="colours"
      label="New colour"
      heading="New colour"
      options={[
        { id: 'single', label: 'Single colour', hint: 'One hex, light and dark' },
        { id: 'ramp', label: 'Ramp', hint: '50–950 from one colour' },
      ]}
      onPick={(kind) => {
        const token = freeName(doc, 'color', kind === 'ramp' ? 'new-ramp' : 'new-colour');
        addExtra('color', kind === 'ramp' ? { name: token, seed: theme.primitives.brand['500'] } : { name: token, value: theme.resolved.light.primary });
        // The new extra mounts on the next render; then its popover opens with the name selected.
        requestAnimationFrame(() => openItem(`extra.color.${token}`));
      }}
    />
  );
}

/** Extra ramps: a seventh row and on, each a ramp from one colour, with the same popover as a role ramp. */
function ExtraRamps() {
  const { system: doc } = useLiveTheme();
  const ramps = (extrasOf(doc, 'color') as ExtraColor[]).filter((e) => e.seed);
  const group = (systemTheme(doc) as { extra?: { color?: Record<string, Record<string, { $value: string }>> } }).extra?.color ?? {};
  return ramps.map((item, i) => (
    <React.Fragment key={i}>
      <ExtraColourPopover
        item={item}
        className="max-sm:col-span-11"
        trigger={
          <button
            type="button"
            aria-label={`${extraLabel(item.name)}, extra ramp. Edit`}
            className="hover:bg-accent focus-visible:ring-ring flex w-full min-w-0 flex-col items-start rounded-md px-1.5 py-1 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 max-sm:flex-row max-sm:items-center max-sm:gap-2">
            <span className="truncate">{extraLabel(item.name)}</span>
            <span className="text-muted-foreground text-[10px] font-normal">Not used by components</span>
          </button>
        }
      />
      {STEPS.map((step) => (
        <span key={step} className="ring-foreground/10 h-9 rounded-md ring-1 ring-inset sm:h-10" style={{ background: group[item.name]?.[step]?.$value }} aria-hidden />
      ))}
    </React.Fragment>
  ));
}

function Ramps() {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-muted-foreground text-xs font-medium">Ramps · one 50–950 axis; the outlined step is the input</h3>
      <div className="grid grid-cols-[repeat(11,minmax(0,1fr))] items-center gap-x-1 gap-y-1.5 sm:grid-cols-[6rem_repeat(11,minmax(0,1fr))]">
        <span className="max-sm:hidden" aria-hidden />
        {STEPS.map((s) => (
          <span key={s} className="text-muted-foreground text-center font-mono text-[10px] tabular-nums" aria-hidden>
            {s}
          </span>
        ))}
        {COLOR_ROLES.map((role) => (
          <React.Fragment key={role}>
            <RampPopover role={role} />
            {STEPS.map((step) => (
              <StepPopover key={step} role={role} step={step} />
            ))}
          </React.Fragment>
        ))}
        <ExtraRamps />
      </div>
    </div>
  );
}

export function ColoursSection() {
  const { system } = useLiveTheme();
  const extrasCount = extrasOf(system, 'color').length;
  const site = useMode();
  const [picked, setPicked] = React.useState<Mode | null>(null);
  const mode = picked ?? site;
  return (
    <FoundationSection
      id="colours"
      title="Colours"
      count={COLOR_ROLES.length * STEPS.length + extrasCount}
      knob={
        <Segmented
          label="Role mapping"
          value={mode}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          onChange={setPicked}
        />
      }
      add={<NewColour />}>
      <RolesRow mode={mode} />
      <Ramps />
      <ExtraColours />
    </FoundationSection>
  );
}
