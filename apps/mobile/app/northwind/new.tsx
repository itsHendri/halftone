import { AmountInput } from '@/components/kit/amount-input';
import { ListGroup } from '@/components/kit/list-group';
import { ListRow } from '@/components/kit/list-row';
import { SegmentedControl } from '@/components/kit/segmented-control';
import { OptionSheet } from '@/components/kit/sheet';
import { StickyBottomBar } from '@/components/kit/sticky-bottom-bar';
import { useToast } from '@/components/kit/toast';
import { CUSTOMERS, invoices } from '@/components/northwind/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ScrollView, View } from 'react-native';

const TERMS = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
] as const;

/** ISO date `days` after 24 June 2026, the sample's "today". */
const dueIn = (days: number) => new Date(Date.UTC(2026, 5, 24 + days)).toISOString().slice(0, 10);

export default function NewInvoice() {
  const router = useRouter();
  const toast = useToast();
  const [customer, setCustomer] = React.useState<string>();
  const [picking, setPicking] = React.useState(false);
  const [amount, setAmount] = React.useState('');
  const [terms, setTerms] = React.useState<'7' | '14' | '30'>('14');
  const [note, setNote] = React.useState('');
  const value = Number(amount.replace(/,/g, ''));
  const valid = !!customer && value > 0;

  const create = (status: 'Draft' | 'Due') => {
    if (!customer) return;
    const inv = invoices.add({ customer, amount: value, issued: '2026-06-24', due: dueIn(Number(terms)), status });
    toast.success(status === 'Draft' ? `${inv.id} saved as a draft` : `${inv.id} sent to ${customer}`);
    router.back();
    router.push({ pathname: '/northwind/invoice/[id]', params: { id: inv.id } });
  };

  return (
    <View className="bg-background flex-1">
      <ScrollView contentContainerClassName="gap-6 p-5 pb-32" keyboardShouldPersistTaps="handled">
        <ListGroup>
          <ListRow title="Client" value={customer ?? 'Choose'} valueClassName={customer ? undefined : 'text-muted-foreground font-normal'} chevron onPress={() => setPicking(true)} />
        </ListGroup>
        <View className="gap-2">
          <Label nativeID="ni-amount">Amount</Label>
          <AmountInput symbol="£" value={amount} onChangeText={setAmount} placeholder="0" />
        </View>
        <View className="gap-2">
          <Label>Payment terms</Label>
          <SegmentedControl segments={TERMS} value={terms} onChange={setTerms} />
        </View>
        <View className="gap-2">
          <Label htmlFor="ni-note">What it’s for</Label>
          <Input id="ni-note" value={note} onChangeText={setNote} placeholder="Brand refresh, phase 2" />
        </View>
      </ScrollView>
      <StickyBottomBar>
        <Button variant="outline" disabled={!valid} onPress={() => create('Draft')}>
          <Text>Save draft</Text>
        </Button>
        <Button disabled={!valid} onPress={() => create('Due')}>
          <Text>Send</Text>
        </Button>
      </StickyBottomBar>
      <OptionSheet open={picking} onClose={() => setPicking(false)} title="Client" options={CUSTOMERS.map((c) => ({ value: c, label: c }))} value={customer} onChange={setCustomer} />
    </View>
  );
}
