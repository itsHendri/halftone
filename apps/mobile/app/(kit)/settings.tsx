import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { useNativeMode } from '@/lib/native-context';
import { useKitTheme, type ThemeMode } from '@/lib/theme-context';
import Constants from 'expo-constants';
import { ScrollView, View } from 'react-native';

const MODES: { value: ThemeMode; label: string; hint: string }[] = [
  { value: 'system', label: 'System', hint: 'Follow the device appearance' },
  { value: 'light', label: 'Light', hint: 'Always light' },
  { value: 'dark', label: 'Dark', hint: 'Always dark' },
];

export default function Settings() {
  const { mode, setMode } = useKitTheme();
  const { mode: nativeMode, setMode: setNativeMode } = useNativeMode();
  const version = Constants.expoConfig?.version ?? '0.0.0';
  const sdk = Constants.expoConfig?.sdkVersion ?? '';

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="gap-6 p-5 pb-16">
      <View className="gap-3">
        <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
          Appearance
        </Text>
        <RadioGroup value={mode} onValueChange={(v) => setMode(v as ThemeMode)} className="gap-4">
          {MODES.map((m) => (
            <View key={m.value} className="flex-row items-center gap-3">
              <RadioGroupItem value={m.value} id={`mode-${m.value}`} />
              <View className="flex-1">
                <Label htmlFor={`mode-${m.value}`} onPress={() => setMode(m.value)}>
                  {m.label}
                </Label>
                <Text className="text-muted-foreground text-sm">{m.hint}</Text>
              </View>
            </View>
          ))}
        </RadioGroup>
      </View>

      <Separator />

      <View className="gap-3">
        <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
          Prototype behaviour
        </Text>
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Label
              htmlFor="simulate-native"
              onPress={() => setNativeMode(nativeMode === 'simulate' ? 'auto' : 'simulate')}>
              Simulate device features
            </Label>
            <Text className="text-muted-foreground text-sm">
              Force the fallback paths for the camera, photos, Face ID and alerts — useful for demos,
              screenshots and the web preview.
            </Text>
          </View>
          <Switch
            id="simulate-native"
            checked={nativeMode === 'simulate'}
            onCheckedChange={(next) => setNativeMode(next ? 'simulate' : 'auto')}
          />
        </View>
      </View>

      <Separator />

      <View className="gap-1">
        <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
          About
        </Text>
        <Text className="text-sm">Halftone {version}</Text>
        {sdk ? <Text className="text-muted-foreground text-sm">Expo SDK {sdk}</Text> : null}
        <Text className="text-muted-foreground text-sm">
          Tokens: tokens/tokens.json · Components: components/ui + components/kit
        </Text>
      </View>
    </ScrollView>
  );
}
