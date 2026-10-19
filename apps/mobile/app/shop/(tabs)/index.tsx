import { EmptyState } from '@/components/kit/empty-state';
import { FilterChip, FilterChipRow } from '@/components/kit/filter-chip';
import { ImageTile } from '@/components/kit/image-tile';
import { SearchField } from '@/components/kit/search-field';
import { CATEGORIES, iconFor, money, PRODUCTS } from '@/components/shop/store';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import { SearchXIcon, StarIcon } from 'lucide-react-native';
import * as React from 'react';
// eslint-disable-next-line halftone/no-raw-primitives -- the whole product card (image, name, price) is one tap target
import { Pressable, ScrollView, View } from 'react-native';

export default function ShopHome() {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [cat, setCat] = React.useState<(typeof CATEGORIES)[number]['value']>('all');
  const items = PRODUCTS.filter((p) => (cat === 'all' || p.category === cat) && p.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="gap-4 pb-32 pt-3" keyboardShouldPersistTaps="handled">
      <View className="px-5">
        <SearchField value={query} onChangeText={setQuery} placeholder="Search products" />
      </View>
      <FilterChipRow>
        {CATEGORIES.map((c) => (
          <FilterChip key={c.value} label={c.label} selected={cat === c.value} onPress={() => setCat(c.value)} />
        ))}
      </FilterChipRow>
      {items.length ? (
        <View className="flex-row flex-wrap gap-3 px-5">
          {items.map((p) => (
            <Pressable key={p.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/shop/product/[id]', params: { id: p.id } })} className="w-[47.5%] gap-1 active:opacity-80">
              <ImageTile seed={p.seed} fallbackIcon={iconFor(p)} ratio={1} />
              <Text className="font-medium" numberOfLines={1}>
                {p.name}
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold">{money(p.price)}</Text>
                <View className="flex-row items-center gap-1">
                  <Icon as={StarIcon} size={12} className="text-warning" />
                  <Text className="text-muted-foreground text-xs">{p.rating}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <EmptyState icon={SearchXIcon} title="Nothing matches" subtitle="Try another word or clear the filter." action={{ label: 'Clear search', onPress: () => { setQuery(''); setCat('all'); } }} />
      )}
    </ScrollView>
  );
}
