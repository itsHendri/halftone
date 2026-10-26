import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { EMBED } from '@/lib/embed';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useRouter } from 'expo-router';
import { ArrowLeftIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = { label?: string; className?: string };

const TAB_BAR_HEIGHT = 56;

/**
 * Floating "Back to kit" pill, bottom centre just above the tab bar, on every screen of a
 * hosted prototype whatever chrome it owns. Render it once in the prototype root layout, after the Stack.
 * Delete it (or the whole kit shell) when the prototype becomes the product.
 * Hidden when the kit is embedded in the docs (?embed=1).
 */
export function KitChip({ label = 'Back to kit', className }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  if (EMBED.embedded) return null;
  return (
    <View pointerEvents="box-none" className="absolute left-0 right-0 items-center" style={{ bottom: Math.max(insets.bottom, 8) + TAB_BAR_HEIGHT + 24 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to the kit"
        onPress={() => {
          haptic('selection');
          router.replace('/(kit)');
        }}
        className={cn('bg-foreground h-10 flex-row items-center gap-2 rounded-full pl-3 pr-4 shadow-md shadow-black/20 active:opacity-80', className)}>
        <Icon as={ArrowLeftIcon} size={16} className="text-background" />
        <Text className="text-background text-sm font-semibold">{label}</Text>
      </Pressable>
    </View>
  );
}
