import { Text } from '@/components/ui/text';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { Pressable, View } from 'react-native';

type Props = {
  /** Two to four next questions, phrased the way the person would ask them. */
  suggestions: string[];
  onSelect: (text: string) => void;
  className?: string;
};

/** Next questions under the latest answer. Tapping one sends it. Hide them while the assistant answers. */
export function FollowUpSuggestions({ suggestions, onSelect, className }: Props) {
  if (!suggestions.length) return null;
  return (
    <View role="group" aria-label="Suggested follow-ups" className={cn('flex-row flex-wrap gap-2', className)}>
      {suggestions.map((s) => (
        <Pressable
          key={s}
          accessibilityRole="button"
          onPress={() => {
            haptic('selection');
            onSelect(s);
          }}
          className="border-border bg-background active:bg-accent min-h-11 justify-center rounded-control border px-4 py-2">
          <Text className="text-sm font-medium">{s}</Text>
        </Pressable>
      ))}
    </View>
  );
}
