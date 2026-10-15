import { RangeSelector } from '@/components/kit/range-selector';
import { AmountInput } from '@/components/kit/amount-input';
import { Calendar } from '@/components/kit/calendar';
import { DatePicker } from '@/components/kit/date-picker';
import { FilterChip, FilterChipRow } from '@/components/kit/filter-chip';
import { NumericKeypad } from '@/components/kit/numeric-keypad';
import { OtpInput } from '@/components/kit/otp-input';
import { PasswordInput } from '@/components/kit/password-input';
import { QuantityStepper } from '@/components/kit/quantity-stepper';
import { Rating } from '@/components/kit/rating';
import { SearchField } from '@/components/kit/search-field';
import { SegmentedControl } from '@/components/kit/segmented-control';
import { SelectableCard } from '@/components/kit/selectable-card';
import { Slider } from '@/components/kit/slider';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import type { ComponentType } from 'react';
import { StarIcon, TruckIcon, ZapIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

function FilterChipDemo() {
  const [sel, setSel] = React.useState<string[]>(['all']);
  const toggle = (v: string) => setSel((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
  return (
    <View className="-mx-5 self-stretch">
      <FilterChipRow>
        {['all', 'favourites', 'recent', 'archived', 'shared'].map((v) => (
          <FilterChip key={v} label={v[0].toUpperCase() + v.slice(1)} selected={sel.includes(v)} onPress={() => toggle(v)} icon={v === 'favourites' ? StarIcon : undefined} />
        ))}
        <FilterChip label="Disabled" disabled />
      </FilterChipRow>
    </View>
  );
}

const SEGMENTS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
] as const;

function SegmentedControlDemo() {
  const [v, setV] = React.useState<'day' | 'week' | 'month'>('week');
  return <SegmentedControl segments={SEGMENTS} value={v} onChange={setV} className="w-full" />;
}

function SearchFieldDemo() {
  const [q, setQ] = React.useState('');
  return <SearchField value={q} onChangeText={setQ} placeholder="Search" containerClassName="w-full" />;
}

function QuantityStepperDemo() {
  const [n, setN] = React.useState(1);
  return (
    <QuantityStepper value={n} onChange={setN} min={0} max={10} />
  );
}

const CURRENCIES = ['$', '£', '€'] as const;

function AmountInputDemo() {
  const [v, setV] = React.useState('');
  const [cur, setCur] = React.useState(0);
  const symbol = CURRENCIES[cur];
  return (
    <AmountInput
      value={v}
      onChangeText={setV}
      symbol={symbol}
      helper={`Up to ${symbol}500.00 available`}
      onMax={() => setV('500')}
      onToggleCurrency={() => setCur((c) => (c + 1) % CURRENCIES.length)}
      className="w-full"
    />
  );
}

function NumericKeypadDemo() {
  const [v, setV] = React.useState('');
  return (
    <View className="w-full gap-4">
      <AmountInput value={v} onChangeText={setV} symbol="min" symbolPosition="trailing" editable={false} placeholder="0" helper="How long did it take?" className="w-full" />
      <NumericKeypad value={v} onChange={setV} />
    </View>
  );
}

function OtpInputDemo() {
  const [code, setCode] = React.useState('');
  return <OtpInput value={code} onChange={setCode} autoFocus={false} error={code.length === 6 && code !== '123456' ? 'That code is not right' : undefined} />;
}

function SliderDemo() {
  const [a, setA] = React.useState(0.4);
  const [b, setB] = React.useState(3);
  return (
    <View className="w-full gap-2">
      <Slider value={a} onChange={setA} accessibilityLabel="Continuous slider" />
      <Text className="text-muted-foreground text-sm">Continuous · {Math.round(a * 100)}%</Text>
      <Slider value={b} onChange={setB} min={0} max={10} step={1} accessibilityLabel="Stepped slider" />
      <Text className="text-muted-foreground text-sm">Stepped 0–10 · {b}</Text>
    </View>
  );
}

function PasswordInputDemo() {
  const [v, setV] = React.useState("hunter22");
  return (
    <View className="w-full gap-2">
      <Label htmlFor="ks-password">Password</Label>
      <PasswordInput id="ks-password" value={v} onChangeText={setV} />
    </View>
  );
}

function SelectableCardDemo() {
  const [plan, setPlan] = React.useState("standard");
  const [extras, setExtras] = React.useState<string[]>(["insurance"]);
  const toggle = (v: string) => setExtras((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
  return (
    <View className="w-full gap-5">
      <View className="gap-2">
        <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Single select</Text>
        <SelectableCard icon={TruckIcon} title="Standard delivery" description="3–5 business days" detail="Free" selected={plan === "standard"} onPress={() => setPlan("standard")} />
        <SelectableCard icon={ZapIcon} title="Express delivery" description="Tomorrow before noon" detail="$9.90" selected={plan === "express"} onPress={() => setPlan("express")} />
      </View>
      {/* Never mix the two in one group. */}
      <View className="gap-2">
        <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Multi select</Text>
        <SelectableCard mode="checkbox" title="Add insurance" description="Covers loss and damage" detail="$2.00" selected={extras.includes("insurance")} onPress={() => toggle("insurance")} />
        <SelectableCard mode="checkbox" title="Signature on delivery" description="Someone must sign for it" detail="$1.50" selected={extras.includes("signature")} onPress={() => toggle("signature")} />
      </View>
    </View>
  );
}

function DatePickerDemo() {
  const [d, setD] = React.useState<Date | undefined>();
  return <DatePicker value={d} onChange={setD} className="w-full" />;
}

function CalendarDemo() {
  const [d, setD] = React.useState<Date | undefined>(new Date());
  return <Calendar value={d} onChange={setD} className="w-full" />;
}


const RANGES = [
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
  { value: '1m', label: '1M' },
  { value: '1y', label: '1Y' },
  { value: 'all', label: 'ALL' },
] as const;

function RangeSelectorDemo() {
  const [range, setRange] = React.useState<(typeof RANGES)[number]['value']>('1m');
  return (
    <View className="w-full gap-3">
      <RangeSelector options={RANGES} value={range} onChange={setRange} />
      <Text className="text-muted-foreground text-sm">Showing: {range.toUpperCase()}</Text>
    </View>
  );
}

/** Components page demos, keyed by the component id in registry/components.ts. */
function RatingDemo() {
  const [stars, setStars] = React.useState(0);
  return (
    <View className="gap-4">
      <Rating value={4.5} showValue count={120} size="md" />
      <View className="gap-1">
        <Text className="font-medium">How was your order?</Text>
        <Rating value={stars} onChange={setStars} accessibilityLabel="Rate your order" />
        <Text className="text-muted-foreground text-sm">{stars ? `${stars} of 5` : 'Tap a star'}</Text>
      </View>
    </View>
  );
}

export const KIT_INPUTS_DEMOS: Record<string, ComponentType> = {
  'filter-chip': FilterChipDemo,
  'segmented-control': SegmentedControlDemo,
  'search-field': SearchFieldDemo,
  'quantity-stepper': QuantityStepperDemo,
  rating: RatingDemo,
  'amount-input': AmountInputDemo,
  'numeric-keypad': NumericKeypadDemo,
  'otp-input': OtpInputDemo,
  'password-input': PasswordInputDemo,
  'selectable-card': SelectableCardDemo,
  'slider': SliderDemo,
  'date-picker': DatePickerDemo,
  'calendar': CalendarDemo,
  'range-selector': RangeSelectorDemo,
};
