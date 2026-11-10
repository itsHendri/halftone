'use client';
import { cn } from 'cn';
import { ClipboardPasteIcon, CopyIcon, RotateCcwIcon } from 'lucide-react';
import * as React from 'react';
import { ControlRow } from '@/components/controls/control-row';
import { CurveEditor } from '@/components/controls/curve-editor';
import { NumberField } from '@/components/controls/number-field';
import { Presets, type Preset } from '@/components/controls/presets';
import { ControlSection } from '@/components/controls/section';
import { ControlSegmented } from '@/components/controls/segmented';
import { ControlSelect } from '@/components/controls/select';
import { SpringEditor } from '@/components/controls/spring-editor';
import { HexField } from '@/components/controls/swatch';
import { ControlSwitch } from '@/components/controls/switch';
import { Vec2Pad } from '@/components/controls/vec2-pad';
import type { Bezier } from '@/lib/controls/bezier';
import { defaultValues, getAt, isDefault, leaves, parseControls, setAt, type ControlConfig, type ControlNode, type LeafControl, type Values } from '@/lib/controls/schema';
import type { Spring } from '@/lib/controls/spring';
import { copyText, describePaste, parseSettings, readText, serializeSettings } from '@/lib/controls/transfer';

/**
 * A panel's state from a config: the parsed controls, their values, and setters. Parsed once; pass a config that
 * doesn't change between renders (a module constant).
 */
export function useControls(config: ControlConfig, initial?: Values) {
  const [nodes] = React.useState(() => parseControls(config));
  const defaults = React.useMemo(() => defaultValues(nodes), [nodes]);
  const [values, setValues] = React.useState<Values>(() => initial ?? defaults);
  const set = React.useCallback((path: string, value: unknown) => setValues((v) => setAt(v, path, value)), []);
  const reset = React.useCallback(() => setValues(defaults), [defaults]);
  return { nodes, values, defaults, setValues, set, reset };
}

const iconButton =
  'text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/50 inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs font-medium outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50';

const editedIn = (nodes: ControlNode[], values: Values) => leaves(nodes).filter((n) => !isDefault(n, getAt(values, n.path))).length;

/**
 * A control panel drawn from a config (`lib/controls/schema.ts`): every value gets the control its type says, nested
 * objects become sections, and each control marks itself and offers Reset while it's off its default. The header copies
 * the values as JSON and pastes them back, checked against the config; Reset all goes back to the defaults.
 *
 * Controlled: pass `values` and `onChange` (from `useControls`, or your own state).
 */
export function ControlPanel({
  title,
  nodes,
  values,
  onChange,
  presets,
  transfer = true,
  className,
}: {
  title: string;
  nodes: ControlNode[];
  values: Values;
  onChange: (values: Values) => void;
  presets?: readonly Preset[];
  /** Copy and Paste in the header. */
  transfer?: boolean;
  className?: string;
}) {
  const [status, setStatus] = React.useState('');
  const [pasteBox, setPasteBox] = React.useState(false);
  const pasteId = React.useId();
  const defaults = React.useMemo(() => defaultValues(nodes), [nodes]);
  const edited = editedIn(nodes, values);

  const paste = (text: string) => {
    const result = parseSettings(text, nodes, values);
    if (result.ok) onChange(result.values);
    setStatus(describePaste(result));
    return result.ok;
  };

  const onCopy = async () => {
    const ok = await copyText(serializeSettings(values, title));
    setStatus(ok ? 'Copied the settings as JSON.' : 'The browser didn’t allow copying. Select the values from the JSON yourself.');
  };

  const onPaste = async () => {
    const text = await readText();
    if (text === null) {
      setPasteBox(true);
      setStatus('Paste the settings into the box.');
    } else paste(text);
  };

  const leaf = (n: LeafControl) => {
    const value = getAt(values, n.path);
    const set = (v: unknown) => onChange(setAt(values, n.path, v));
    const off = !isDefault(n, value);
    const reset = () => set(n.default);
    const id = `ctl-${n.path}`;
    const row = { label: n.label, edited: off, onReset: reset, hint: n.hint };
    switch (n.kind) {
      case 'number':
        return (
          <NumberField
            key={n.path}
            label={n.label}
            value={value as number}
            onChange={set}
            min={n.min}
            max={n.max}
            step={n.step}
            unit={n.unit}
            defaultValue={n.default}
            hint={n.hint}
          />
        );
      case 'colour':
        return (
          <ControlRow key={n.path} {...row} htmlFor={id}>
            <HexField id={id} label={n.label} value={value as string} onChange={set} />
          </ControlRow>
        );
      case 'switch':
        return <ControlRow key={n.path} {...row} htmlFor={id} trailing={<ControlSwitch id={id} label={n.label} checked={value as boolean} onChange={set} />} />;
      case 'select':
        return (
          <ControlRow key={n.path} {...row} htmlFor={n.display === 'menu' ? id : undefined}>
            {n.display === 'segmented' ? (
              <ControlSegmented label={n.label} value={value as string} options={n.options} onChange={set} />
            ) : (
              <ControlSelect id={id} label={n.label} value={value as string} options={n.options} onChange={set} />
            )}
          </ControlRow>
        );
      case 'easing':
        return (
          <ControlRow key={n.path} {...row}>
            <CurveEditor label={n.label} value={value as Bezier} onChange={set} />
          </ControlRow>
        );
      case 'spring':
        return (
          <ControlRow key={n.path} {...row}>
            <SpringEditor label={n.label} value={value as Spring} onChange={set} />
          </ControlRow>
        );
      case 'vec2':
        return (
          <ControlRow key={n.path} {...row}>
            <Vec2Pad label={n.label} value={value as [number, number]} onChange={set} min={n.min} max={n.max} step={n.step} />
          </ControlRow>
        );
    }
  };

  const render = (list: ControlNode[]): React.ReactNode =>
    list.map((n) =>
      n.kind === 'section' ? (
        <ControlSection key={n.path} title={n.label} defaultOpen={!n.collapsed} edited={editedIn(n.children, values)} className="border-border border-t pt-2">
          {render(n.children)}
        </ControlSection>
      ) : (
        leaf(n)
      )
    );

  return (
    <div role="region" aria-label={title} className={cn('bg-card text-card-foreground border-border flex min-w-0 flex-col gap-3 rounded-xl border p-4 shadow-sm', className)}>
      <div className="flex min-h-7 items-center gap-1">
        <h2 className="text-foreground min-w-0 flex-1 truncate text-sm font-semibold">{title}</h2>
        {transfer ? (
          <>
            <button type="button" onClick={onCopy} className={iconButton} title="Copy the settings as JSON">
              <CopyIcon className="size-3.5" aria-hidden />
              Copy
            </button>
            <button type="button" onClick={onPaste} className={iconButton} title="Paste settings copied from a panel">
              <ClipboardPasteIcon className="size-3.5" aria-hidden />
              Paste
            </button>
          </>
        ) : null}
        <button type="button" disabled={!edited} onClick={() => onChange(defaults)} className={iconButton} aria-label={edited ? `Reset all ${edited} changed settings` : 'Reset all: nothing changed'}>
          <RotateCcwIcon className="size-3.5" aria-hidden />
          Reset
        </button>
      </div>
      {presets?.length ? <Presets presets={presets} values={values} onApply={(p) => onChange(mergeValues(values, p.values))} /> : null}
      {pasteBox ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={pasteId} className="text-muted-foreground text-xs font-medium">
            Settings JSON
          </label>
          <textarea
            id={pasteId}
            rows={4}
            autoFocus
            onPaste={(e) => {
              if (paste(e.clipboardData.getData('text'))) setPasteBox(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setPasteBox(false);
            }}
            className="border-border bg-background focus-visible:ring-ring/50 min-w-0 rounded-md border p-2 font-mono text-xs outline-none focus-visible:ring-[3px]"
          />
        </div>
      ) : null}
      <p role="status" aria-live="polite" className={cn('text-muted-foreground text-xs', !status && 'sr-only')}>
        {status}
      </p>
      <div className="flex min-w-0 flex-col gap-3">{render(nodes)}</div>
    </div>
  );
}

/** A preset's values over the current ones: what it doesn't set stays. */
function mergeValues(current: Values, patch: Values): Values {
  let out = current;
  for (const [k, v] of Object.entries(patch)) {
    const have = out[k];
    out =
      v && typeof v === 'object' && !Array.isArray(v) && have && typeof have === 'object' && !Array.isArray(have) && !('mode' in v)
        ? { ...out, [k]: mergeValues(have as Values, v as Values) }
        : { ...out, [k]: v };
  }
  return out;
}

export { defaultValues, parseControls, type ControlConfig, type Values };
