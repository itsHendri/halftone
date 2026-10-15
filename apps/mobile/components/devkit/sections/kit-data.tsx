import { ListGroup } from '@/components/kit/list-group';
import { ValueHeader } from '@/components/kit/value-header';
import { AvatarGroup } from '@/components/kit/avatar-group';
import { BarChart } from '@/components/kit/bar-chart';
import { ChartLegend, DonutChart } from '@/components/kit/donut-chart';
import { IconCircle } from '@/components/kit/icon-circle';
import { KeyValueList, SummaryCard } from '@/components/kit/key-value-list';
import { LineChart } from '@/components/kit/line-chart';
import { ListRow } from '@/components/kit/list-row';
import { PercentChange } from '@/components/kit/percent-change';
import { ProgressRing } from '@/components/kit/progress-ring';
import { StatTile } from '@/components/kit/stat-tile';
import { StatusDot } from '@/components/kit/status-dot';
import { Timeline } from '@/components/kit/timeline';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { ComponentType } from 'react';
import { BellIcon, CreditCardIcon, FolderIcon, LockIcon, ScanFaceIcon, ShoppingCartIcon, UsersIcon, WalletIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

const PRICES = [42, 44, 43, 47, 49, 46, 51, 55, 53, 58, 57, 61, 60, 64, 63, 68, 66, 70, 72, 71, 69, 74, 73, 77, 75, 80, 78, 83, 82, 86];

function ListRowDemo() {
  return (
    <Card className="w-full gap-0 px-4 py-0">
      <ListRow leading={<IconCircle as={BellIcon} />} title="Notifications" subtitle="Push and email" value="On" />
      <ListRow leading={<IconCircle as={UsersIcon} />} title="Members" subtitle="3 pending invites" value="12" sublabel="+2 this week" sublabelClassName="text-success" />
      <ListRow leading={<IconCircle as={CreditCardIcon} />} title="Plan" subtitle="Renews on 1 October" chevron onPress={() => {}} />
      <ListRow leading={<IconCircle as={FolderIcon} />} title="Shared folder" trailing={<Badge variant="secondary"><Text>New</Text></Badge>} last onPress={() => {}} />
    </Card>
  );
}

function IconCircleDemo() {
  return (
    <View className="gap-4">
      <View className="flex-row items-end gap-4">
        {[32, 40, 48, 56, 64].map((s) => (
          <View key={s} className="items-center gap-1">
            <IconCircle as={WalletIcon} size={s} />
            <Text className="text-muted-foreground text-xs">{s}</Text>
          </View>
        ))}
      </View>
      <View className="flex-row items-center gap-4">
        <IconCircle as={WalletIcon} size={48} />
        <IconCircle as={WalletIcon} size={48} tone="primary" />
        <IconCircle as={ShoppingCartIcon} size={48} tone="success" />
        <IconCircle as={ShoppingCartIcon} size={48} tone="warning" />
        <IconCircle as={ShoppingCartIcon} size={48} tone="destructive" />
      </View>
      <View className="flex-row items-center gap-4">
        <IconCircle as={LockIcon} size={48} shape="square" />
        <IconCircle as={ScanFaceIcon} size={48} shape="square" tone="primary" />
        <IconCircle as={WalletIcon} size={48} shape="square" tone="info" />
      </View>
    </View>
  );
}

function SummaryDemo() {
  const rows = [
    { label: 'Date', value: 'Fri 3 Oct' },
    { label: 'Time', value: '10:30 – 11:15' },
    { label: 'Guests', value: '2' },
    { label: 'Status', value: 'Confirmed', valueClassName: 'text-success' },
  ];
  return (
    <View className="w-full gap-4">
      <SummaryCard title="Booking summary" rows={rows} />
      <KeyValueList rows={rows.slice(0, 2)} />
    </View>
  );
}

function StatTileDemo() {
  return (
    <View className="w-full flex-row gap-3">
      <StatTile label="Active users" value="1,284" delta={4.2} icon={UsersIcon} />
      <StatTile label="Sessions" value="318" delta={-1.8} icon={ShoppingCartIcon} />
    </View>
  );
}

function PercentChangeDemo() {
  return (
    <View className="flex-row gap-6">
      <PercentChange value={2.35} />
      <PercentChange value={-0.8} />
      <PercentChange value={0} />
      <PercentChange value={12} decimals={0} showIcon={false} />
    </View>
  );
}

function AvatarGroupDemo() {
  const people = [
    { id: "1", initials: "AR" },
    { id: "2", initials: "SO", uri: "https://github.com/expo.png" },
    { id: "3", initials: "JL" },
    { id: "4", initials: "MT" },
    { id: "5", initials: "KP" },
    { id: "6", initials: "DN" },
  ];
  return (
    <View className="gap-4">
      <AvatarGroup items={people} />
      <AvatarGroup items={people.slice(0, 3)} size={40} />
    </View>
  );
}

function ProgressRingDemo() {
  return (
    <View className="flex-row items-center gap-6">
      <ProgressRing value={72}>
        <Text className="text-sm font-semibold">72%</Text>
      </ProgressRing>
      <ProgressRing value={35} tone="warning" size={48} strokeWidth={5} />
      <ProgressRing value={100} tone="success" size={40} strokeWidth={4} />
    </View>
  );
}

function StatusDotDemo() {
  return (
    <View className="flex-row items-center gap-4">
      {(['success', 'warning', 'destructive', 'info', 'primary', 'muted'] as const).map((t) => (
        <View key={t} className="items-center gap-1">
          <StatusDot tone={t} />
          <Text className="text-muted-foreground text-xs">{t}</Text>
        </View>
      ))}
    </View>
  );
}

function LineChartDemo() {
  const [pt, setPt] = React.useState<{ x: number; y: number } | null>(null);
  return (
    <View className="w-full gap-3">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-2xl font-semibold">{pt ? pt.y : PRICES[PRICES.length - 1]}</Text>
        <Text className="text-muted-foreground text-sm">{pt ? `Day ${pt.x + 1}` : 'Active users · drag to scrub'}</Text>
      </View>
      <LineChart data={PRICES} height={140} area onPointerChange={setPt} />
      <View className="flex-row gap-4">
        <LineChart variant="sparkline" data={PRICES} height={36} width={100} tone="success" area />
        <LineChart variant="sparkline" data={[...PRICES].reverse()} height={36} width={100} tone="destructive" />
      </View>
    </View>
  );
}

function BarChartDemo() {
  return (
    <BarChart
      className="w-full"
      showValues
      data={[
        { label: 'Mon', value: 12 },
        { label: 'Tue', value: 18 },
        { label: 'Wed', value: 9 },
        { label: 'Thu', value: 22, className: 'bg-success' },
        { label: 'Fri', value: 15 },
        { label: 'Sat', value: 6, className: 'bg-muted-foreground' },
        { label: 'Sun', value: 4, className: 'bg-muted-foreground' },
      ]}
    />
  );
}

function DonutChartDemo() {
  const data = [
    { label: 'Design', value: 40 },
    { label: 'Research', value: 25 },
    { label: 'Build', value: 20 },
    { label: 'Review', value: 15 },
  ];
  return (
    <View className="w-full flex-row items-center gap-6">
      <DonutChart data={data} size={140}>
        <Text className="text-xl font-semibold">42h</Text>
        <Text className="text-muted-foreground text-xs">this week</Text>
      </DonutChart>
      <ChartLegend data={data} className="flex-1" />
    </View>
  );
}


function ListGroupDemo() {
  const [quick, setQuick] = React.useState('face');
  return (
    <View className="w-full gap-6">
      <ListGroup title="Settings" variant="plain" footnote="Plain groups run straight on the background — the settings look.">
        <ListRow title="Accounts" chevron onPress={() => {}} />
        <ListRow title="Login and security" subtitle="Face ID · Two-step on" chevron onPress={() => {}} />
        <ListRow title="Notifications" chevron onPress={() => {}} />
      </ListGroup>
      <ListGroup title="Quick access">
        <ListRow
          leading={<IconCircle as={ScanFaceIcon} shape="square" />}
          title="Face ID"
          subtitle="Open the app with Face ID"
          select={{ mode: 'radio', selected: quick === 'face' }}
          onPress={() => setQuick('face')}
        />
        <ListRow
          leading={<IconCircle as={LockIcon} shape="square" />}
          title="Passcode"
          subtitle="Open the app with a 4-digit passcode"
          select={{ mode: 'radio', selected: quick === 'code' }}
          onPress={() => setQuick('code')}
        />
      </ListGroup>
    </View>
  );
}

function ValueHeaderDemo() {
  return (
    <View className="w-full gap-6">
      <ValueHeader value="$4,182.00" caption="+$60.00 all time" captionTone="positive" maskable />
      <ValueHeader label="Available to trade" value="$60.00" caption="$20.00 not available" />
    </View>
  );
}

/** Components page demos, keyed by the component id in registry/components.ts. */
function TimelineDemo() {
  return (
    <Card className="w-full px-4 py-4">
      <Timeline
        items={[
          { title: 'Order confirmed', time: '12 Jun, 10:02', state: 'done' },
          { title: 'Packed', time: '12 Jun, 16:40', state: 'done' },
          { title: 'On its way', time: '13 Jun, 08:15', description: 'With the courier, arriving tomorrow', state: 'current' },
          { title: 'Delivered', time: 'Expected 14 Jun', state: 'upcoming' },
        ]}
      />
    </Card>
  );
}

export const KIT_DATA_DEMOS: Record<string, ComponentType> = {
  'list-row': ListRowDemo,
  'icon-circle': IconCircleDemo,
  'summary-card': SummaryDemo,
  'stat-tile': StatTileDemo,
  'percent-change': PercentChangeDemo,
  'avatar-group': AvatarGroupDemo,
  'progress-ring': ProgressRingDemo,
  'status-dot': StatusDotDemo,
  timeline: TimelineDemo,
  'line-chart': LineChartDemo,
  'bar-chart': BarChartDemo,
  'donut-chart': DonutChartDemo,
  'list-group': ListGroupDemo,
  'value-header': ValueHeaderDemo,
};
