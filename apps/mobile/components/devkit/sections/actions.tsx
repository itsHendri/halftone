import { Spinner } from '@/components/kit/spinner';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Toggle, ToggleIcon } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupIcon, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { ComponentType } from 'react';
import * as Haptics from 'expo-haptics';
import { BoldIcon, ChevronRightIcon, ItalicIcon, MailIcon, UnderlineIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

function ButtonDemo() {
  return (
    <View className="w-full gap-3">
      <Button>
        <Text>Primary</Text>
      </Button>
      <Button variant="secondary">
        <Text>Secondary</Text>
      </Button>
      <Button variant="outline">
        <Text>Outline</Text>
      </Button>
      <Button variant="ghost">
        <Text>Ghost</Text>
      </Button>
      <Button variant="destructive">
        <Text>Destructive</Text>
      </Button>
      <Button>
        <Icon as={MailIcon} />
        <Text>With icon</Text>
      </Button>
      {/* Busy, not disabled: full colour, and the Spinner matches the label. */}
      <Button>
        <Spinner tone="button-foreground" />
        <Text>Loading</Text>
      </Button>
      <View className="flex-row items-center gap-2">
        <Button size="sm">
          <Text>Small</Text>
        </Button>
        <Button size="lg">
          <Text>Large</Text>
        </Button>
        <Button variant="link">
          <Text>Link</Text>
        </Button>
        <Button variant="outline" size="icon" accessibilityLabel="Next">
          <Icon as={ChevronRightIcon} />
        </Button>
      </View>
    </View>
  );
}

function ToggleDemo() {
  const [pressed, setPressed] = React.useState(false);
  return (
    <Toggle
      variant="outline"
      className="self-start"
      aria-label="Toggle bold"
      pressed={pressed}
      onPressedChange={(next) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPressed(next);
      }}>
      <ToggleIcon as={BoldIcon} />
    </Toggle>
  );
}

function ToggleGroupDemo() {
  const [value, setValue] = React.useState<string[]>(['bold']);
  return (
    <ToggleGroup
      value={value}
      onValueChange={(next) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setValue(next);
      }}
      variant="outline"
      type="multiple">
      <ToggleGroupItem isFirst value="bold" aria-label="Toggle bold">
        <ToggleGroupIcon as={BoldIcon} />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        <ToggleGroupIcon as={ItalicIcon} />
      </ToggleGroupItem>
      <ToggleGroupItem isLast value="underline" aria-label="Toggle underline">
        <ToggleGroupIcon as={UnderlineIcon} />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

/** Components page demos, keyed by the component id in registry/components.ts. */
export const ACTIONS_DEMOS: Record<string, ComponentType> = {
  'button': ButtonDemo,
  'toggle': ToggleDemo,
  'toggle-group': ToggleGroupDemo,
};
