import { ActionGrid } from '@/components/kit/action-grid';
import { BarChart } from '@/components/kit/bar-chart';
import { ListGroup } from '@/components/kit/list-group';
import { ListRow } from '@/components/kit/list-row';
import { SectionHeader } from '@/components/kit/section-header';
import { StatTile } from '@/components/kit/stat-tile';
import { useToast } from '@/components/kit/toast';
import { ValueHeader } from '@/components/kit/value-header';
import { StatusBadge } from '@/components/northwind/status-badge';
import { MONTHLY, money, shortDate, sum, useInvoices } from '@/components/northwind/store';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import { BellRingIcon, DownloadIcon, FileTextIcon, PlusIcon } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

export default function Overview() {
  const router = useRouter();
  const toast = useToast();
  const list = useInvoices();
  const open = list.filter((i) => i.status === 'Due' || i.status === 'Overdue');
  const overdue = list.filter((i) => i.status === 'Overdue');

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="gap-6 p-5 pb-32">
      <ValueHeader label="Outstanding" value={money(sum(open))} caption={`${open.length} invoices · ${money(sum(overdue))} overdue`} captionTone="negative" />
      <ActionGrid
        items={[
          { icon: PlusIcon, label: 'New invoice', onPress: () => router.push('/northwind/new') },
          { icon: BellRingIcon, label: 'Remind all', badge: overdue.length, onPress: () => toast.success(`Reminders sent to ${overdue.length} clients`) },
          { icon: DownloadIcon, label: 'Export', onPress: () => toast.info('Export is not part of the sample') },
          { icon: FileTextIcon, label: 'Invoices', onPress: () => router.navigate('/northwind/invoices') },
        ]}
      />
      <View className="flex-row gap-3">
        <StatTile label="Paid this month" value={money(9800)} delta={-17.6} />
        <StatTile label="Avg. days to pay" value="19" />
      </View>
      <Card className="w-full gap-3 px-4 py-4">
        <View>
          <Text className="font-semibold">Paid by month</Text>
          <Text className="text-muted-foreground text-sm">January to June</Text>
        </View>
        <BarChart data={MONTHLY.map((m, i) => ({ ...m, className: i === MONTHLY.length - 1 ? 'bg-primary' : 'bg-muted-foreground' }))} height={140} />
      </Card>
      <View className="gap-3">
        <SectionHeader title="Recent invoices" action="See all" onAction={() => router.navigate('/northwind/invoices')} />
        <ListGroup>
          {list.slice(0, 4).map((i) => (
            <ListRow
              key={i.id}
              title={i.customer}
              subtitle={`${i.id} · due ${shortDate(i.due)}`}
              trailing={
                <View className="items-end gap-1">
                  <Text className="font-semibold tabular-nums">{money(i.amount)}</Text>
                  <StatusBadge status={i.status} />
                </View>
              }
              onPress={() => router.push({ pathname: '/northwind/invoice/[id]', params: { id: i.id } })}
            />
          ))}
        </ListGroup>
      </View>
    </ScrollView>
  );
}
