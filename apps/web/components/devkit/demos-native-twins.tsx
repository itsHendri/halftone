'use client';
import {
  BellIcon,
  CheckIcon,
  CreditCardIcon,
  GiftIcon,
  ImageIcon,
  InboxIcon,
  LandmarkIcon,
  LockIcon,
  MoreHorizontalIcon,
  PackageIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  ReceiptIcon,
  RepeatIcon,
  SendIcon,
  ShieldIcon,
  ShoppingBagIcon,
  TruckIcon,
  UserIcon,
  WalletIcon,
} from 'lucide-react';
import type { ComponentType } from 'react';
import * as React from 'react';
import { toast } from 'sonner';
import { ActionGrid } from '@/components/kit/action-grid';
import { FloatingButton } from '@/components/kit/floating-button';
import { Footnote } from '@/components/kit/footnote';
import { HorizontalPager } from '@/components/kit/horizontal-pager';
import { IconBadge } from '@/components/kit/icon-badge';
import { ImageTile } from '@/components/kit/image-tile';
import { PagerDots } from '@/components/kit/pager-dots';
import { Placeholder } from '@/components/kit/placeholder';
import { PromoCard } from '@/components/kit/promo-card';
import { SectionHeader } from '@/components/kit/section-header';
import { Spinner } from '@/components/kit/spinner';
import { Spot } from '@/components/kit/spot';
import { Stepper } from '@/components/kit/stepper';
import { StickyBottomBar } from '@/components/kit/sticky-bottom-bar';
import { SuccessScreen } from '@/components/kit/success-screen';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuTrigger } from '@/components/ui/context-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from '@/components/ui/menubar';
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

function StepperFlowDemo() {
  const [step, setStep] = React.useState(3);
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <Stepper current={step} total={4} labels={['Cart', 'Delivery', 'Payment', 'Review']} />
      <Stepper current={step} total={4} variant="compact" />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        <Button size="sm" disabled={step === 4} onClick={() => setStep((s) => s + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

const SLIDES = [
  { seed: 'Get paid faster', title: 'Get paid faster', body: 'Reminders chase late invoices for you.' },
  { seed: 'Cards for the team', title: 'Cards for the team', body: 'Spending limits per person.' },
  { seed: 'Export to accounting', title: 'Export to accounting', body: 'Xero and QuickBooks, every night.' },
];

function SuccessDemo() {
  const [loading, setLoading] = React.useState(false);
  const replay = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1200);
  };
  return (
    <SuccessScreen className="w-full" title="Payment sent" amount="£2,310.00" amountSubtitle="to Lumen Labs" body="It arrives today, by 6pm." loading={loading}>
      <Button variant="outline" className="w-full" onClick={replay}>
        Send another
      </Button>
    </SuccessScreen>
  );
}

function PromoDemo() {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="flex w-80 max-w-full flex-col gap-3">
      {open ? (
        <PromoCard title="Invite your accountant" body="They get read-only access to invoices and exports." action={{ label: 'Invite your accountant', onClick: () => toast('Would open the invite') }} onDismiss={() => setOpen(false)} />
      ) : (
        <Button variant="outline" size="sm" className="self-start" onClick={() => setOpen(true)}>
          Show the card again
        </Button>
      )}
      <PromoCard tone="success" icon={GiftIcon} title="Refer a friend, get £50" action={{ onClick: () => toast('Would open referrals') }} />
    </div>
  );
}

const Row = ({ children }: { children: React.ReactNode }) => <div className="flex flex-wrap items-center gap-3">{children}</div>;

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
  'floating-button': () => (
    <div className="flex w-full flex-col gap-6">
      <Row>
        <FloatingButton icon={PlusIcon} aria-label="New invoice" onClick={() => toast('Would start an invoice')} />
        <FloatingButton icon={PencilIcon} label="Compose" onClick={() => toast('Would compose')} />
        <FloatingButton icon={PlusIcon} variant="secondary" aria-label="Add" />
      </Row>
      <div className="bg-muted/40 relative h-48 w-72 max-w-full overflow-hidden rounded-xl border">
        <div className="flex flex-col gap-2 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card h-10 rounded-md border" />
          ))}
        </div>
        <FloatingButton icon={PlusIcon} position="bottom-right" aria-label="New invoice" className="right-4 bottom-4" />
      </div>
    </div>
  ),
  'icon-badge': () => (
    <Row>
      <IconBadge icon={BellIcon} count={3} aria-label="Notifications" />
      <IconBadge icon={ShoppingBagIcon} count={120} aria-label="Basket" />
      <IconBadge icon={InboxIcon} dot aria-label="Inbox" />
      <IconBadge icon={BellIcon} aria-label="Notifications" />
    </Row>
  ),
  'action-grid': () => (
    <ActionGrid
      className="w-full max-w-sm"
      items={[
        { icon: PlusIcon, label: 'Add funds', onClick: () => toast('Add funds') },
        { icon: SendIcon, label: 'Send', onClick: () => toast('Send') },
        { icon: ReceiptIcon, label: 'Invoices', badge: 2, onClick: () => toast('Invoices') },
        { icon: MoreHorizontalIcon, label: 'More', onClick: () => toast('More') },
      ]}
    />
  ),
  menubar: () => (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            New invoice <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>Duplicate</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Export PDF <MenubarShortcut>⌘E</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Undo <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem checked>Show totals</MenubarCheckboxItem>
          <MenubarCheckboxItem>Show tax lines</MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  ),
  stepper: StepperFlowDemo,
  'section-header': () => (
    <div className="flex w-full max-w-md flex-col gap-3">
      <SectionHeader title="Recent invoices" action="See all" onAction={() => toast('Would open invoices')} />
      <ListGroup>
        <ListRow title="Lumen Labs" subtitle="INV-1044 · Overdue" value="£2,310.00" />
        <ListRow title="Northwind" subtitle="INV-1042 · Paid" value="£1,240.00" />
      </ListGroup>
    </div>
  ),
  'pager-dots': () => (
    <div className="flex flex-col items-center gap-4">
      <PagerDots count={4} activeIndex={0} />
      <PagerDots count={4} activeIndex={2} />
    </div>
  ),
  'horizontal-pager': () => (
    <HorizontalPager className="w-80 max-w-full" aria-label="What’s new">
      {SLIDES.map((s) => (
        <div key={s.seed} className="bg-card flex flex-col gap-3 rounded-xl border p-3">
          <Placeholder seed={s.seed} ratio={2} />
          <div className="px-1 pb-1">
            <p className="font-semibold">{s.title}</p>
            <p className="text-muted-foreground text-sm">{s.body}</p>
          </div>
        </div>
      ))}
    </HorizontalPager>
  ),
  spinner: () => (
    <Row>
      <Spinner />
      <Spinner size="large" aria-label="Loading invoices" />
      <Spinner tone="muted" />
      <Button disabled>
        <Spinner tone="button-foreground" aria-label="Saving" />
        Saving…
      </Button>
    </Row>
  ),
  'success-screen': SuccessDemo,
  'sticky-bottom-bar': () => (
    <div className="bg-background relative h-64 w-80 max-w-full overflow-y-auto rounded-xl border">
      <div className="flex flex-col gap-3 p-5">
        <p className="font-semibold">Review payment</p>
        {['To', 'Amount', 'Fee', 'Reference', 'Arrives', 'From'].map((l) => (
          <div key={l} className="flex justify-between border-b py-2 text-sm">
            <span className="text-muted-foreground">{l}</span>
            <span>—</span>
          </div>
        ))}
      </div>
      <StickyBottomBar>
        <Button variant="outline">Cancel</Button>
        <Button onClick={() => toast.success('Payment sent')}>Send £2,310</Button>
      </StickyBottomBar>
    </div>
  ),
  'promo-card': PromoDemo,
  footnote: () => (
    <Footnote className="max-w-md" action={{ label: 'Read the fee schedule', onClick: () => toast('Would open the fees') }}>
      Transfers to UK accounts are free. International transfers cost 0.4% plus a fixed fee shown before you confirm. Exchange rates update every minute.
    </Footnote>
  ),
  'context-menu': () => (
    <ContextMenu>
      <ContextMenuTrigger className="text-muted-foreground flex h-32 w-full max-w-sm items-center justify-center rounded-lg border border-dashed text-sm">Right-click invoice INV-1044</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem>
          Open <ContextMenuShortcut>↵</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>Download PDF</ContextMenuItem>
        <ContextMenuItem>Send reminder</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">Void invoice</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
  'hover-card': () => (
    <p className="text-sm">
      Billed to{' '}
      <HoverCard>
        <HoverCardTrigger asChild>
          <a href="#lumen" className="font-medium underline underline-offset-4">
            Lumen Labs
          </a>
        </HoverCardTrigger>
        <HoverCardContent className="w-72">
          <div className="flex gap-3">
            <IconCircle as={LandmarkIcon} tone="primary" size={40} />
            <div className="flex flex-col gap-1">
              <p className="font-semibold">Lumen Labs Ltd</p>
              <p className="text-muted-foreground text-sm">12 invoices · £18,420 paid · always on time</p>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </p>
  ),
  'image-tile': () => (
    <div className="grid w-80 max-w-full grid-cols-2 gap-4">
      <ImageTile seed="Linen overshirt" caption="Linen overshirt" />
      <ImageTile caption="No image yet" />
    </div>
  ),
  'aspect-ratio': () => (
    <div className="w-80 max-w-full">
      <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg">
        <Placeholder seed="Product walkthrough" ratio={16 / 9} icon={PlayIcon} className="h-full" />
      </AspectRatio>
    </div>
  ),
  placeholder: () => (
    <div className="grid w-72 max-w-full grid-cols-3 gap-3">
      <Placeholder seed="Ada" />
      <Placeholder seed="Ada" palette="mono" />
      <Placeholder seed="Ada" palette="primary" />
      <Placeholder seed="Northwind" />
      <Placeholder seed="Lumen Labs" />
      <Placeholder seed="Acme Studio" icon={ImageIcon} />
    </div>
  ),
  spot: () => (
    <Row>
      <Spot icon={BellIcon} size="md" />
      <Spot icon={LockIcon} tone="primary" />
      <Spot icon={CheckIcon} tone="success" size="xl" ring />
      <Spot icon={ShieldIcon} tone="info" shape="square" />
    </Row>
  ),
};
