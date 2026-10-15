import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import type { ComponentType } from 'react';
import * as Haptics from 'expo-haptics';
import * as React from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function InputDemo() {
  return (
    <View className="w-full gap-3">
      <View className="gap-2">
        <Label htmlFor="ks-email">Email</Label>
        <Input
          id="ks-email"
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          placeholder="you@example.com"
        />
      </View>
      <Input placeholder="Disabled" editable={false} />
    </View>
  );
}

function TextareaDemo() {
  return <Textarea placeholder="Type your message here." className="w-full" />;
}

function CheckboxDemo() {
  const [terms, setTerms] = React.useState(true);
  const [updates, setUpdates] = React.useState(false);
  const tap = (set: (v: boolean) => void, v: boolean) => () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    set(v);
  };
  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-3">
        <Checkbox id="ks-terms" checked={terms} onCheckedChange={setTerms} />
        <Label htmlFor="ks-terms" onPress={Platform.select({ native: tap(setTerms, !terms) })}>
          Accept terms and conditions
        </Label>
      </View>
      <View className="flex-row items-start gap-3">
        <Checkbox id="ks-updates" checked={updates} onCheckedChange={setUpdates} />
        <View className="flex-1 gap-1">
          <Label htmlFor="ks-updates" onPress={Platform.select({ native: tap(setUpdates, !updates) })}>
            Product updates
          </Label>
          <Text className="text-muted-foreground text-sm">Occasional email about new features.</Text>
        </View>
      </View>
      <View className="flex-row items-center gap-3">
        <Checkbox id="ks-disabled" checked={false} disabled onCheckedChange={() => {}} />
        <Label htmlFor="ks-disabled" disabled>
          Disabled
        </Label>
      </View>
    </View>
  );
}

function RadioGroupDemo() {
  const [value, setValue] = React.useState('comfortable');
  const pick = (v: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setValue(v);
  };
  return (
    <RadioGroup value={value} onValueChange={pick}>
      {[
        ['default', 'Default'],
        ['comfortable', 'Comfortable'],
        ['compact', 'Compact'],
      ].map(([v, label]) => (
        <View key={v} className="flex-row items-center gap-3">
          <RadioGroupItem value={v} id={`ks-radio-${v}`} />
          <Label htmlFor={`ks-radio-${v}`} onPress={() => pick(v)}>
            {label}
          </Label>
        </View>
      ))}
    </RadioGroup>
  );
}

function SwitchDemo() {
  const [checked, setChecked] = React.useState(true);
  const flip = (v: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChecked(v);
  };
  return (
    <View className="flex-row items-center gap-3">
      <Switch checked={checked} onCheckedChange={flip} id="ks-switch" />
      <Label htmlFor="ks-switch" onPress={() => flip(!checked)}>
        Notifications
      </Label>
    </View>
  );
}

const FRUITS = ['Apple', 'Banana', 'Blueberry', 'Grapes', 'Pineapple'];

function SelectDemo() {
  const [triggerWidth, setTriggerWidth] = React.useState(0);
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: Platform.select({ ios: insets.bottom, android: insets.bottom + 24 }),
    left: 12,
    right: 12,
  };
  return (
    <Select>
      <SelectTrigger className="w-full" onLayout={(e) => setTriggerWidth(e.nativeEvent.layout.width)}>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      {/* Match the trigger so the open list lines up with the field it belongs to. */}
      <SelectContent insets={contentInsets} style={triggerWidth ? { width: triggerWidth } : undefined}>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          {FRUITS.map((f) => (
            <SelectItem key={f} label={f} value={f.toLowerCase()}>
              {f}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/** Components page demos, keyed by the component id in registry/components.ts. */
export const INPUTS_DEMOS: Record<string, ComponentType> = {
  'input': InputDemo,
  'textarea': TextareaDemo,
  'checkbox': CheckboxDemo,
  'radio-group': RadioGroupDemo,
  'switch': SwitchDemo,
  'select': SelectDemo,
};
