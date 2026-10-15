import { ActionSheet, OptionSheet, Sheet } from '@/components/kit/sheet';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import type { ComponentType } from 'react';
import { PencilIcon, ShareIcon, Trash2Icon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

function SheetDemo() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="outline" className="w-full" onPress={() => setOpen(true)}>
        <Text>Open sheet</Text>
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Custom content" description="Anything goes in here.">
        <View className="gap-3 px-5 pb-2">
          <Text>Sheets scroll and cap at 85% of the screen.</Text>
          <Button onPress={() => setOpen(false)}>
            <Text>Done</Text>
          </Button>
        </View>
      </Sheet>
    </>
  );
}

const OPTIONS = [
  { value: 'one', label: 'Option one', description: 'A short description' },
  { value: 'two', label: 'Option two', description: 'Another description' },
  { value: 'three', label: 'Option three' },
] as const;

function OptionSheetDemo() {
  const [open, setOpen] = React.useState(false);
  const [v, setV] = React.useState<'one' | 'two' | 'three'>('one');
  return (
    <>
      <Button variant="outline" className="w-full" onPress={() => setOpen(true)}>
        <Text>Selected: {OPTIONS.find((o) => o.value === v)?.label}</Text>
      </Button>
      <OptionSheet open={open} onClose={() => setOpen(false)} title="Choose an option" options={OPTIONS} value={v} onChange={setV} />
    </>
  );
}

function ActionSheetDemo() {
  const [open, setOpen] = React.useState(false);
  const [last, setLast] = React.useState('');
  return (
    <View className="w-full gap-2">
      <Button variant="outline" className="w-full" onPress={() => setOpen(true)}>
        <Text>Manage item</Text>
      </Button>
      {last ? <Text className="text-muted-foreground text-sm">Last action: {last}</Text> : null}
      <ActionSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Manage item"
        items={[
          { label: 'Share', icon: ShareIcon, onPress: () => setLast('share') },
          { label: 'Edit', icon: PencilIcon, onPress: () => setLast('edit') },
          { label: 'Delete', icon: Trash2Icon, destructive: true, onPress: () => setLast('delete') },
        ]}
      />
    </View>
  );
}

/** Components page demos, keyed by the component id in registry/components.ts. */
export const KIT_OVERLAYS_DEMOS: Record<string, ComponentType> = {
  'sheet': SheetDemo,
  'option-sheet': OptionSheetDemo,
  'action-sheet': ActionSheetDemo,
};
