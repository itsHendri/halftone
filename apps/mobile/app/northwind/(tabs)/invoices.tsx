import { EmptyState } from '@/components/kit/empty-state';
import { FilterChip, FilterChipRow } from '@/components/kit/filter-chip';
import { FloatingButton } from '@/components/kit/floating-button';
import { ListGroup } from '@/components/kit/list-group';
import { ListRow } from '@/components/kit/list-row';
import { SearchField } from '@/components/kit/search-field';
import { StatusBadge } from '@/components/northwind/status-badge';
import { money, shortDate, STATUSES, useInvoices } from '@/components/northwind/store';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import { PlusIcon, SearchXIcon } from 'lucide-react-native';
import * as React from 'react';
import { ScrollView, View } from 'react-native';

export default function Invoices() {
  const router = useRouter();
  const list = useInvoices();
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState<(typeof STATUSES)[number]>('All');
  const q = query.trim().toLowerCase();
  const rows = list.filter((i) => (status === 'All' || i.status === status) && (i.customer.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)));
  const count = (s: (typeof STATUSES)[number]) => (s === 'All' ? list.length : list.filter((i) => i.status === s).length);

  return (
    <View className="bg-background flex-1">
      <ScrollView contentContainerClassName="gap-4 pb-32 pt-3" keyboardShouldPersistTaps="handled">
        <View className="px-5">
          <SearchField value={query} onChangeText={setQuery} placeholder="Search clients or numbers" />
        </View>
        <FilterChipRow>
          {STATUSES.map((s) => (
            <FilterChip key={s} label={`${s} ${count(s)}`} selected={status === s} onPress={() => setStatus(s)} />
          ))}
        </FilterChipRow>
        {rows.length ? (
          <ListGroup className="px-5">
            {rows.map((i) => (
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
        ) : (
          <EmptyState icon={SearchXIcon} title="No invoices match" subtitle="Try another client, or clear the filter." action={{ label: 'Clear filters', onPress: () => { setQuery(''); setStatus('All'); } }} />
        )}
      </ScrollView>
      <FloatingButton icon={PlusIcon} accessibilityLabel="New invoice" position="bottom-right" onPress={() => router.push('/northwind/new')} />
    </View>
  );
}
