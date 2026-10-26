import { CATEGORIES } from '@/components/devkit/categories';
import { SECTIONS } from '@/components/devkit/registry';
import { Footnote } from '@/components/kit/footnote';
import { ListGroup } from '@/components/kit/list-group';
import { ListRow } from '@/components/kit/list-row';
import { Logo } from '@/components/kit/logo';
import { ScreenHeader } from '@/components/kit/screen-header';
import { SectionHeader } from '@/components/kit/section-header';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useBrand } from '@/lib/brand-context';
import { Link } from 'expo-router';
import { BlocksIcon, ReceiptTextIcon, ShoppingBagIcon, SwatchBookIcon, TargetIcon } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

export default function KitHome() {
  // Once a brand is applied (lib/brand.ts), its logo leads the kit home.
  const brand = useBrand();
  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="gap-6 p-5 pb-16" contentInsetAdjustmentBehavior="automatic">
      {brand.logo ? <Logo size={32} /> : null}
      <ScreenHeader
        title="Halftone"
        size="large"
        subtitle="A themeable Expo starter for mobile prototypes. Everything a screen needs is already here and previewed live."
      />


      <ListGroup title="Browse">
        <Link href="/(kit)/foundations" asChild>
          <ListRow leading={<Icon as={SwatchBookIcon} size={22} className="text-primary" />} title="Foundations" subtitle="Colour, spacing, radius, type, motion" chevron onPress={() => {}} />
        </Link>
        <Link href="/(kit)/components" asChild>
          <ListRow leading={<Icon as={BlocksIcon} size={22} className="text-primary" />} title="Components" subtitle={`${SECTIONS.length} previews in ${CATEGORIES.length} categories`} chevron onPress={() => {}} />
        </Link>
      </ListGroup>

      <ListGroup title="Sample apps" footnote="Built only from the kit, and the web kit has each of them too. Use the floating Kit chip to come back.">
        <Link href="/shop/(tabs)" asChild>
          <ListRow leading={<Icon as={ShoppingBagIcon} size={22} className="text-primary" />} title="Shop and orders" subtitle="Browse, cart, checkout, track an order" chevron onPress={() => {}} />
        </Link>
        <Link href="/habits/(tabs)" asChild>
          <ListRow leading={<Icon as={TargetIcon} size={22} className="text-primary" />} title="Habit tracker" subtitle="Daily goals, streaks and insights" chevron onPress={() => {}} />
        </Link>
        <Link href="/northwind/(tabs)" asChild>
          <ListRow leading={<Icon as={ReceiptTextIcon} size={22} className="text-primary" />} title="Northwind invoicing" subtitle="Outstanding, invoices, send and get paid" chevron onPress={() => {}} />
        </Link>
      </ListGroup>

      <View className="gap-3">
        <SectionHeader title="How it works" />
        <Card className="w-full gap-4 px-4 py-4">
          <Step n={1} title="Pick from what exists" body="Screens are composed only from registry components. Search Components, tap a title to copy its API." />
          <Step n={2} title="Copy token names, not values" body="Foundations tiles copy the Tailwind class (bg-primary, p-4, rounded-lg). Colours follow light and dark automatically." />
          <Step n={3} title="Hand it a brief" body="The transcript-to-prototype skill turns a conversation into screens, using the same rules." />
        </Card>
      </View>

      <Footnote>DESIGN_SYSTEM.md and AGENTS.md hold the full rules.</Footnote>
    </ScrollView>
  );
}


function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <View className="flex-row gap-3">
      <View className="bg-primary-subtle size-6 items-center justify-center rounded-full">
        <Text className="text-foreground text-xs font-semibold">{n}</Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-medium">{title}</Text>
        <Text className="text-muted-foreground text-sm">{body}</Text>
      </View>
    </View>
  );
}
