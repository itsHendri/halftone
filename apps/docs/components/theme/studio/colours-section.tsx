'use client';
import { COLOR_ROLES, ROLE_NAMES, type ColorRole, type HalftoneSystem } from '@halftone-ds/tokens/system';
import { OPTIONS } from '@halftone-ds/tokens/theme';
import * as React from 'react';
import { HexField, Swatch, TokenPicker } from '@/components/theme/studio/fields';
import { EditedDot, Field, inputClass, ItemPopover } from '@/components/theme/studio/item-popover';
import { LABELS } from '@/components/theme/studio/parts';
import { FoundationSection, Segmented } from '@/components/theme/studio/section';
import {
  contrast,
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
import { useLiveTheme } from '@/lib/theme/store';

/**
 * Foundations › Colours (wireframes 1 and 2): the roles components use, then the six ramps on one 50–950 axis. The
 * ramps are shared by light and dark; each role points at one step in light and another in dark, and the section's
 * Light / dark switch shows (and the role popover edits) either mapping. Contrast warns on your own choices and
 * never changes them (the generator auto-fixes only what it generated).
 */

/** "6.1 AA", with a warning colour when it fails. */
function Ratio({ fg, bg, threshold = 4.5, label }: { fg: string; bg: string; threshold?: number; label?: string }) {
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
  return (
    <ItemPopover
      id={`role.${name}`}
      title={roleLabel(name)}
      slot={name}
      trigger={
        <button
          type="button"
          aria-label={`${roleLabel(name)}: ${targetLabel(target)}${edited ? ', edited' : ''}. Edit`}
          className="border-border hover:bg-accent focus-visible:ring-ring flex min-w-0 items-center gap-2 rounded-lg border py-1.5 pl-1.5 pr-2.5 text-left focus-visible:outline-none focus-visible:ring-2">
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
    <ItemPopover
      id={`step.${target}`}
      title={name}
      slot={step}
      trigger={
        <button
          type="button"
          aria-label={`${name}, ${hex.toUpperCase()}${isInput ? ', input colour' : ''}${edited ? ', edited' : ''}. Edit`}
          className={`focus-visible:ring-ring relative h-9 min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:h-10 ${
            isInput ? 'ring-foreground ring-2 ring-offset-1 ring-offset-[var(--color-card)]' : 'ring-foreground/10 ring-1 ring-inset'
          }`}
          style={{ background: hex }}>
          {edited ? <EditedDot className="ring-card absolute right-1 top-1 ring-2" /> : null}
        </button>
      }
      preview={
        <div className="ring-foreground/10 flex h-20 items-end justify-between rounded-lg p-2.5 ring-1 ring-inset" style={{ background: hex, color: contrast(hex, '#ffffff') >= contrast(hex, '#000000') ? '#ffffff' : '#000000' }}>
          <span className="font-mono text-xs uppercase">{hex}</span>
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
    <ItemPopover
      id={`ramp.${role}`}
      title={label}
      slot={role}
      side="right"
      trigger={
        <button
          type="button"
          aria-label={`${label} ramp${own.length ? `, ${own.length} edited` : ''}. Edit input colour and pin`}
          className="hover:bg-accent focus-visible:ring-ring flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 max-sm:col-span-11">
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
  );
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
      </div>
    </div>
  );
}

export function ColoursSection() {
  const site = useMode();
  const [picked, setPicked] = React.useState<Mode | null>(null);
  const mode = picked ?? site;
  return (
    <FoundationSection
      id="colours"
      title="Colours"
      count={COLOR_ROLES.length * STEPS.length}
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
      }>
      <RolesRow mode={mode} />
      <Ramps />
    </FoundationSection>
  );
}
