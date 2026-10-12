import { SummaryCard } from '@/components/kit/key-value-list';
import { ActionSheet } from '@/components/kit/sheet';
import { StickyBottomBar } from '@/components/kit/sticky-bottom-bar';
import { Timeline, type TimelineItem } from '@/components/kit/timeline';
import { useToast } from '@/components/kit/toast';
import { ValueHeader } from '@/components/kit/value-header';
import { StatusBadge } from '@/components/northwind/status-badge';
import { invoices, money, shortDate, useInvoices } from '@/components/northwind/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { BellRingIcon, CheckIcon, DownloadIcon, Trash2Icon } from 'lucide-react-native';
import * as React from 'react';
import { ScrollView, View } from 'react-native';

export default function InvoiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const list = useInvoices();
  const inv = list.find((i) => i.id === id) ?? list[0];
  const [menu, setMenu] = React.useState(false);
  if (!inv) return null;

  const sent = inv.status !== 'Draft';
  const paid = inv.status === 'Paid';
  const steps: TimelineItem[] = [
    { title: 'Created', time: shortDate(inv.issued), state: 'done' },
    { title: 'Sent to client', time: sent ? shortDate(inv.issued) : undefined, state: sent ? 'done' : 'current' },
    { title: inv.status === 'Overdue' ? `Overdue since ${shortDate(inv.due)}` : `Due ${shortDate(inv.due)}`, state: paid ? 'done' : sent ? 'current' : 'upcoming' },
    { title: 'Paid', state: paid ? 'done' : 'upcoming' },
  ];

  return (
    <View className="bg-background flex-1">
      <Stack.Screen options={{ title: inv.id }} />
      <ScrollView contentContainerClassName="gap-5 p-5 pb-32">
        <View className="gap-3">
          <StatusBadge status={inv.status} />
          <ValueHeader label={inv.customer} value={money(inv.amount)} caption={paid ? 'Paid in full' : `Due ${shortDate(inv.due)}`} captionTone={inv.status === 'Overdue' ? 'negative' : paid ? 'positive' : 'default'} />
        </View>
        <SummaryCard
          title="Details"
          rows={[
            { label: 'Invoice', value: inv.id },
            { label: 'Client', value: inv.customer },
            { label: 'Issued', value: shortDate(inv.issued) },
            { label: 'Due', value: shortDate(inv.due) },
            { label: 'Amount', value: money(inv.amount) },
          ]}
        />
        <Card className="w-full gap-4 px-4 py-4">
          <Text className="font-semibold">Activity</Text>
          <Timeline items={steps} />
        </Card>
      </ScrollView>
      <StickyBottomBar>
        <Button variant="outline" onPress={() => setMenu(true)}>
          <Text>More</Text>
        </Button>
        {paid ? null : inv.status === 'Draft' ? (
          <Button
            onPress={() => {
              invoices.setStatus(inv.id, 'Due');
              toast.success(`Sent to ${inv.customer}`);
            }}>
            <Text>Send invoice</Text>
          </Button>
        ) : (
          <Button
            onPress={() => {
              invoices.setStatus(inv.id, 'Paid');
              toast.success('Marked as paid');
            }}>
            <Text>Mark as paid</Text>
          </Button>
        )}
      </StickyBottomBar>
      <ActionSheet
        open={menu}
        onClose={() => setMenu(false)}
        title={`${inv.id} · ${inv.customer}`}
        items={[
          { label: 'Send a reminder', icon: BellRingIcon, disabled: !sent || paid, onPress: () => toast.success(`Reminder sent to ${inv.customer}`) },
          { label: 'Download PDF', icon: DownloadIcon, onPress: () => toast.info('PDFs are not part of the sample') },
          ...(paid ? [] : [{ label: 'Mark as paid', icon: CheckIcon, onPress: () => invoices.setStatus(inv.id, 'Paid') }]),
          {
            label: 'Delete invoice',
            icon: Trash2Icon,
            destructive: true,
            onPress: () => {
              invoices.remove(inv.id);
              toast.info(`${inv.id} deleted`);
              router.back();
            },
          },
        ]}
      />
    </View>
  );
}
