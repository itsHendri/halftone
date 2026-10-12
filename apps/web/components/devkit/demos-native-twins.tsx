'use client';
import { BellIcon, CreditCardIcon, LandmarkIcon, PackageIcon, RepeatIcon, TruckIcon, UserIcon, WalletIcon } from 'lucide-react';
import type { ComponentType } from 'react';
import * as React from 'react';
import { toast } from 'sonner';
import { AmountInput } from '@/components/kit/amount-input';
import { AvatarGroup } from '@/components/kit/avatar-group';
import { FilterChip, FilterChipRow } from '@/components/kit/filter-chip';
import { IconCircle } from '@/components/kit/icon-circle';
import { SummaryCard } from '@/components/kit/key-value-list';
import { ListGroup } from '@/components/kit/list-group';
import { ListRow } from '@/components/kit/list-row';
import { OtpInput } from '@/components/kit/otp-input';
import { PasswordInput } from '@/components/kit/password-input';
import { PercentChange } from '@/components/kit/percent-change';
import { ProgressRing } from '@/components/kit/progress-ring';
import { QuantityStepper } from '@/components/kit/quantity-stepper';
import { RangeSelector } from '@/components/kit/range-selector';
import { Rating } from '@/components/kit/rating';
import { SearchField } from '@/components/kit/search-field';
import { SegmentedControl } from '@/components/kit/segmented-control';
import { SelectableCard } from '@/components/kit/selectable-card';
import { StatusDot } from '@/components/kit/status-dot';
import { Timeline } from '@/components/kit/timeline';
import { ValueHeader } from '@/components/kit/value-header';
import { Label } from '@/components/ui/label';

/**
 * Demos for the web versions of components the native kit had first (apps/docs/design/components-wireframes.md ›
 * parity). Same ids as the native kit, so the docs catalogue shows both kits on one page.
 */

function FilterChipDemo() {
  const [on, setOn] = React.useState<string[]>(['Paid']);
  const toggle = (l: string) => setOn((xs) => (xs.includes(l) ? xs.filter((x) => x !== l) : [...xs, l]));
  return (
    <FilterChipRow className="max-w-full">
      {['Paid', 'Overdue', 'Draft', 'This month', 'Over £1,000'].map((l) => (
        <FilterChip key={l} label={l} selected={on.includes(l)} onClick={() => toggle(l)} />
      ))}
    </FilterChipRow>
  );
}

function SegmentedDemo() {
  const [v, setV] = React.useState<'list' | 'board' | 'calendar'>('list');
  return (
    <SegmentedControl
      aria-label="View"
      className="w-full max-w-sm"
      segments={[
        { value: 'list', label: 'List' },
        { value: 'board', label: 'Board' },
        { value: 'calendar', label: 'Calendar' },
      ]}
      value={v}
      onChange={setV}
    />
  );
}

function SearchDemo() {
  const [q, setQ] = React.useState('Lumen');
  return <SearchField aria-label="Search invoices" placeholder="Search invoices" value={q} onChangeText={setQ} containerClassName="w-full max-w-sm" />;
}

function StepperDemo() {
  const [n, setN] = React.useState(2);
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium">Guests</span>
      <QuantityStepper aria-label="Guests" value={n} onChange={setN} min={1} max={8} />
    </div>
  );
}

function RatingDemo() {
  const [r, setR] = React.useState(0);
  return (
    <div className="flex flex-col items-start gap-4">
      <Rating value={4.6} showValue count={128} />
      <Rating value={r} onChange={setR} aria-label="Rate your order" />
    </div>
  );
}

function AmountDemo() {
  const [v, setV] = React.useState('250');
  const over = Number(v.replace(',', '.')) > 1200;
  return (
    <AmountInput
      className="w-full max-w-sm"
      aria-label="Amount to send"
      symbol="£"
      value={v}
      onChangeText={setV}
      onMax={() => setV('1200')}
      helper="Balance £1,200.00"
      error={over ? 'That’s more than your balance.' : undefined}
    />
  );
}

function OtpDemo() {
  const [code, setCode] = React.useState('');
  const wrong = code.length === 6 && code !== '123456';
  return <OtpInput className="w-full max-w-sm" value={code} onChange={setCode} onComplete={(c) => (c === '123456' ? toast.success('Code accepted') : null)} error={wrong ? 'That code didn’t match. Try 123456.' : undefined} />;
}

function PasswordDemo() {
  const [v, setV] = React.useState('');
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Label htmlFor="demo-password">Password</Label>
      <PasswordInput id="demo-password" value={v} onChange={(e) => setV(e.target.value)} placeholder="At least 8 characters" />
    </div>
  );
}

function SelectableDemo() {
  const [plan, setPlan] = React.useState('team');
  return (
    <div role="radiogroup" aria-label="Plan" className="flex w-full max-w-md flex-col gap-3">
      <SelectableCard title="Starter" description="5 invoices a month" detail="£0" icon={WalletIcon} selected={plan === 'starter'} onClick={() => setPlan('starter')} />
      <SelectableCard title="Team" description="Unlimited invoices, reminders" detail="£24" icon={RepeatIcon} selected={plan === 'team'} onClick={() => setPlan('team')} />
    </div>
  );
}

function RangeDemo() {
  const [r, setR] = React.useState<'1W' | '1M' | '3M' | '1Y' | 'ALL'>('1M');
  return <RangeSelector aria-label="Chart range" className="w-full max-w-md" options={(['1W', '1M', '3M', '1Y', 'ALL'] as const).map((v) => ({ value: v, label: v }))} value={r} onChange={setR} />;
}

function ListGroupDemo({ plain }: { plain?: boolean }) {
  const [reminders, setReminders] = React.useState(true);
  return (
    <ListGroup className="w-full max-w-md" title={plain ? 'Notifications' : undefined} variant={plain ? 'plain' : 'card'} footnote={plain ? 'Reminders go to the client, copied to you.' : undefined}>
      <ListRow leading={<IconCircle as={LandmarkIcon} tone="primary" />} title="Business account" subtitle="•••• 4821" value="£12,480.00" sublabel="Available" />
      <ListRow leading={<IconCircle as={CreditCardIcon} />} title="Card" subtitle="Expires 08/28" chevron onClick={() => toast('Would open the card')} />
      <ListRow leading={<IconCircle as={BellIcon} />} title="Payment reminders" select={{ mode: 'checkbox', selected: reminders }} onClick={() => setReminders((r) => !r)} />
    </ListGroup>
  );
}

const TEAM = [
  { id: '1', initials: 'AM' },
  { id: '2', initials: 'JL' },
  { id: '3', initials: 'RK' },
  { id: '4', initials: 'SO' },
  { id: '5', initials: 'TB' },
  { id: '6', initials: 'NW' },
];

export const TWIN_DEMOS: Record<string, ComponentType> = {
  'filter-chip': FilterChipDemo,
  'segmented-control': SegmentedDemo,
  'search-field': SearchDemo,
  'quantity-stepper': StepperDemo,
  rating: RatingDemo,
  'amount-input': AmountDemo,
  'otp-input': OtpDemo,
  'password-input': PasswordDemo,
  'selectable-card': SelectableDemo,
  'range-selector': RangeDemo,
  'avatar-group': () => (
    <div className="flex items-center gap-3">
      <AvatarGroup items={TEAM} max={4} />
      <span className="text-muted-foreground text-sm">6 people on this project</span>
    </div>
  ),
  'list-row': () => (
    <div className="w-full max-w-md">
      <ListRow leading={<IconCircle as={PackageIcon} />} title="Order #4821" subtitle="2 items · Delivered" value="£64.00" />
      <ListRow leading={<IconCircle as={UserIcon} />} title="Ada Marsh" subtitle="Owner" chevron onClick={() => toast('Would open Ada')} last />
    </div>
  ),
  'list-group': () => (
    <div className="flex w-full flex-col gap-8">
      <ListGroupDemo />
      <ListGroupDemo plain />
    </div>
  ),
  'icon-circle': () => (
    <div className="flex items-center gap-3">
      <IconCircle as={WalletIcon} />
      <IconCircle as={TruckIcon} tone="primary" />
      <IconCircle as={RepeatIcon} tone="success" shape="square" size={44} />
      <IconCircle as={BellIcon} tone="warning" />
    </div>
  ),
  'summary-card': () => (
    <SummaryCard
      className="max-w-sm"
      title="Payment"
      rows={[
        { label: 'To', value: 'Lumen Labs' },
        { label: 'Amount', value: '£2,310.00' },
        { label: 'Fee', value: 'Free', valueClassName: 'text-success' },
        { label: 'Arrives', value: 'Today, by 6pm' },
      ]}
    />
  ),
  'percent-change': () => (
    <div className="flex items-center gap-4">
      <PercentChange value={8.24} />
      <PercentChange value={-2.1} />
      <PercentChange value={0} />
    </div>
  ),
  'progress-ring': () => (
    <div className="flex items-center gap-6">
      <ProgressRing value={60} aria-label="Seats used">
        <span className="text-sm font-semibold">60%</span>
      </ProgressRing>
      <ProgressRing value={100} tone="success" size={48} strokeWidth={5} aria-label="Onboarding" />
    </div>
  ),
  'status-dot': () => (
    <ul className="flex flex-col gap-2 text-sm">
      <li className="flex items-center gap-2">
        <StatusDot tone="success" /> Online
      </li>
      <li className="flex items-center gap-2">
        <StatusDot tone="warning" /> Pending review
      </li>
      <li className="flex items-center gap-2">
        <StatusDot tone="destructive" /> Payment failed
      </li>
    </ul>
  ),
  timeline: () => (
    <Timeline
      className="w-full max-w-sm"
      items={[
        { title: 'Invoice sent', time: '12 Jun, 10:02', state: 'done' },
        { title: 'Viewed by Lumen Labs', time: '12 Jun, 14:30', state: 'done' },
        { title: 'Awaiting payment', time: 'Due 26 Jun', description: 'A reminder goes out in 3 days.', state: 'current' },
        { title: 'Paid', state: 'upcoming' },
      ]}
    />
  ),
  'value-header': () => <ValueHeader label="Available balance" value="£12,480.00" caption="+£1,840 this week" captionTone="positive" maskable />,
};
