import type { Section } from './types';
import { Text, TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { type LayoutChangeEvent, View } from 'react-native';

type Props = {
  section: Section;
  /** Tinted, for a deep link that points at this section (?section=<id>). */
  highlighted?: boolean;
  /** Just the demo, no title or divider: the docs embed shows its own title. */
  bare?: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
};

/**
 * One labelled preview: uppercase title, then the demo.
 * `api` and `caption` stay in the registry data for the docs and for agents reading the
 * registry — the preview shows the component, not prose about it.
 */
export function DevKitSection({ section, highlighted, bare, onLayout }: Props) {
  const { Demo } = section;
  return (
    <View
      onLayout={onLayout}
      className={cn('gap-3 px-5 py-5', !bare && 'border-border border-t', highlighted && 'bg-primary-subtle')}>
      {bare ? null : (
        <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">{section.title}</Text>
      )}
      <TextClassContext.Provider value={undefined}>
        <View className="items-stretch">
          <Demo />
        </View>
      </TextClassContext.Provider>
    </View>
  );
}
