'use client';
/**
 * Components page demos for the Controls family (registry category `controls`), keyed by registry id. Each owns its
 * state and shows the states that matter: at the default, moved off it, and reset.
 */
import type { ComponentType } from 'react';
import * as React from 'react';
import { ControlPanel, useControls } from '@/components/controls/control-panel';
import { ControlRow } from '@/components/controls/control-row';
import { CurveEditor } from '@/components/controls/curve-editor';
import { NumberField } from '@/components/controls/number-field';
import { Presets } from '@/components/controls/presets';
import { ControlSection } from '@/components/controls/section';
import { ControlSegmented } from '@/components/controls/segmented';
import { ControlSelect } from '@/components/controls/select';
import { SpringEditor } from '@/components/controls/spring-editor';
import { HexField, Swatch } from '@/components/controls/swatch';
import { ControlSwitch } from '@/components/controls/switch';
import { Vec2Pad } from '@/components/controls/vec2-pad';
import type { Bezier } from '@/lib/controls/bezier';
import type { ControlConfig, Values } from '@/lib/controls/schema';
import type { Spring } from '@/lib/controls/spring';

/** A card designer's inspector: the card's look and its entrance. */
const CARD_CONFIG: ControlConfig = {
  radius: { type: 'number', default: 12, min: 0, max: 32, step: 1, unit: 'px' },
  padding: { type: 'number', default: 20, min: 8, max: 48, step: 2, unit: 'px' },
  accent: '#2563eb',
  bordered: true,
  align: { type: 'select', options: ['start', 'center', 'end'] },
  shadow: {
    blur: [16, 0, 48, 1],
    offset: { type: 'vec2', default: [0, -0.25], min: -1, max: 1 },
  },
  entrance: {
    type: 'section',
    collapsed: true,
    controls: {
      easing: { type: 'easing', default: [0.2, 0, 0, 1] },
      spring: { type: 'spring', default: { visualDuration: 0.35, bounce: 0.2 } },
    },
  },
};

const CARD_PRESETS = [
  { name: 'Quiet', values: { radius: 8, padding: 16, bordered: true, shadow: { blur: 4 } } },
  { name: 'Soft', values: { radius: 20, padding: 24, bordered: false, shadow: { blur: 32 } } },
];

const narrow = 'w-full max-w-xs';

function ControlPanelDemo() {
  const c = useControls(CARD_CONFIG);
  return <ControlPanel className={narrow} title="Card" nodes={c.nodes} values={c.values} onChange={c.setValues} presets={CARD_PRESETS} />;
}

function NumberFieldDemo() {
  const [radius, setRadius] = React.useState(16);
  const [opacity, setOpacity] = React.useState(0.8);
  const [corner, setCorner] = React.useState(9999);
  return (
    <div className={`flex flex-col gap-4 ${narrow}`}>
      <NumberField label="Corner radius" unit="px" min={0} max={32} defaultValue={12} value={radius} onChange={setRadius} hint="Drag the label, or Shift-drag for tenths." />
      <NumberField label="Opacity" min={0} max={1} step={0.01} defaultValue={0.8} value={opacity} onChange={setOpacity} />
      <NumberField label="Pill corner" min={0} max={9999} track={false} defaultValue={9999} format={(v) => (v >= 9999 ? 'Full' : `${v}px`)} value={corner} onChange={setCorner} />
    </div>
  );
}

function ControlRowDemo() {
  const [on, setOn] = React.useState(false);
  return (
    <div className={`flex flex-col gap-4 ${narrow}`}>
      <ControlRow label="At its default" trailing={<ControlSwitch label="At its default" checked={on} onChange={setOn} />} />
      <ControlRow label="Changed" edited onReset={() => undefined} trailing={<span className="text-xs tabular-nums">24px</span>} hint="The mark, the label’s strength and Reset all say it moved." />
    </div>
  );
}

function SwatchDemo() {
  const [hex, setHex] = React.useState('#2563eb');
  return (
    <div className={`flex flex-col gap-3 ${narrow}`}>
      <HexField label="Accent" value={hex} onChange={setHex} />
      <div className="flex items-center gap-2">
        {['#ffffff', '#111827', hex].map((h) => (
          <Swatch key={h} hex={h} className="size-6" />
        ))}
      </div>
    </div>
  );
}

function ControlSegmentedDemo() {
  const [align, setAlign] = React.useState('center');
  return <ControlSegmented className={narrow} label="Align" value={align} onChange={setAlign} options={[{ value: 'start', label: 'Start' }, { value: 'center', label: 'Center' }, { value: 'end', label: 'End' }]} />;
}

function ControlSwitchDemo() {
  const [on, setOn] = React.useState(true);
  return <ControlRow className={narrow} label="Bordered" htmlFor="demo-bordered" trailing={<ControlSwitch id="demo-bordered" label="Bordered" checked={on} onChange={setOn} />} />;
}

function ControlSelectDemo() {
  const [blend, setBlend] = React.useState('multiply');
  return (
    <ControlRow className={narrow} label="Blend mode" htmlFor="demo-blend">
      <ControlSelect id="demo-blend" label="Blend mode" value={blend} onChange={setBlend} options={['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))} />
    </ControlRow>
  );
}

function ControlSectionDemo() {
  const [blur, setBlur] = React.useState(24);
  return (
    <ControlSection className={narrow} title="Shadow" edited={blur === 16 ? 0 : 1}>
      <NumberField label="Blur" unit="px" min={0} max={48} defaultValue={16} value={blur} onChange={setBlur} />
    </ControlSection>
  );
}

function PresetsDemo() {
  const [values, setValues] = React.useState<Values>({ radius: 8, padding: 16 });
  return (
    <div className={`flex flex-col gap-3 ${narrow}`}>
      <Presets presets={[{ name: 'Compact', values: { radius: 8, padding: 16 } }, { name: 'Roomy', values: { radius: 16, padding: 32 } }]} values={values} onApply={(p) => setValues({ ...values, ...p.values })} />
      <p className="text-muted-foreground text-xs tabular-nums">
        Radius {String(values.radius)} · padding {String(values.padding)}
      </p>
    </div>
  );
}

function CurveEditorDemo() {
  const [curve, setCurve] = React.useState<Bezier>([0.2, 0, 0, 1]);
  return <CurveEditor className={narrow} label="Entrance easing" value={curve} onChange={setCurve} />;
}

function SpringEditorDemo() {
  const [spring, setSpring] = React.useState<Spring>({ mode: 'time', visualDuration: 0.35, bounce: 0.2 });
  return <SpringEditor className={narrow} label="Sheet spring" value={spring} onChange={setSpring} />;
}

function Vec2PadDemo() {
  const [offset, setOffset] = React.useState<[number, number]>([0.25, -0.5]);
  return <Vec2Pad className={narrow} label="Light direction" value={offset} onChange={setOffset} />;
}

export const CONTROL_DEMOS: Record<string, ComponentType> = {
  'control-panel': ControlPanelDemo,
  'number-field': NumberFieldDemo,
  'control-row': ControlRowDemo,
  swatch: SwatchDemo,
  'control-segmented': ControlSegmentedDemo,
  'control-switch': ControlSwitchDemo,
  'control-select': ControlSelectDemo,
  'control-section': ControlSectionDemo,
  presets: PresetsDemo,
  'curve-editor': CurveEditorDemo,
  'spring-editor': SpringEditorDemo,
  'vec2-pad': Vec2PadDemo,
};
