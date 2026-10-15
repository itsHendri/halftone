import { BiometricGate } from '@/components/kit/biometric-gate';
import { CodeScanner } from '@/components/kit/code-scanner';
import { useNotify } from '@/components/kit/notify';
import { PermissionPrimer } from '@/components/kit/permission-primer';
import { PhotoCapture } from '@/components/kit/photo-capture';
import { useShare } from '@/components/kit/share';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useNativeMode } from '@/lib/native-context';
import { Spot } from '@/components/kit/spot';
import { BellOffIcon, CheckIcon } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import * as React from 'react';
import { View } from 'react-native';
import type { ComponentType } from 'react';

function ModeNote() {
  const { mode } = useNativeMode();
  if (mode !== 'simulate') return null;
  return (
    <Text className="text-muted-foreground text-sm">
      &ldquo;Simulate device features&rdquo; is on in Settings — everything here is showing its fallback.
    </Text>
  );
}

function PhotoCaptureDemo() {
  const [uri, setUri] = React.useState<string | null>(null);
  return (
    <View className="w-full gap-3">
      <View className="flex-row gap-3">
        <View className="flex-1">
          <PhotoCapture value={uri} onChange={setUri} label="Add a photo" seed="demo-photo" />
        </View>
        <View className="w-28">
          <PhotoCapture shape="avatar" label="Avatar" seed="demo-avatar" />
        </View>
      </View>
      <ModeNote />
    </View>
  );
}

function CodeScannerDemo() {
  const [open, setOpen] = React.useState(false);
  const [last, setLast] = React.useState<string | null>(null);
  return (
    <View className="w-full gap-3">
      {open ? (
        <CodeScanner
          ratio={4 / 3}
          onScan={(value) => {
            setLast(value);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      ) : (
        <Button variant="secondary" onPress={() => setOpen(true)}>
          <Text>Open the scanner</Text>
        </Button>
      )}
      <Text className="text-muted-foreground text-sm">
        {last ? `Scanned: ${last}` : 'Nothing scanned yet.'}
      </Text>
    </View>
  );
}

function BiometricGateDemo() {
  const [round, setRound] = React.useState(0);
  return (
    <View className="w-full gap-3">
      <Card className="w-full px-4 py-4">
        <BiometricGate
          key={round}
          title="Account details"
          subtitle="Unlock to see the balance and card number."
          className="py-6">
          <View className="items-center gap-2 py-6">
            <Text variant="h4">$4,182.00</Text>
            <Text className="text-muted-foreground text-sm">•••• •••• •••• 4429</Text>
          </View>
        </BiometricGate>
      </Card>
      <Button size="sm" variant="outline" onPress={() => setRound((r) => r + 1)}>
        <Text>Lock again</Text>
      </Button>
    </View>
  );
}

function PermissionPrimerDemo() {
  const [done, setDone] = React.useState<'allowed' | 'skipped' | null>(null);
  return (
    <View className="w-full gap-3">
      <Card className="w-full px-2 py-2">
        {done ? (
          <View className="items-center gap-2 px-6 py-8">
            <Spot
              icon={done === 'allowed' ? CheckIcon : BellOffIcon}
              size="lg"
              tone={done === 'allowed' ? 'success' : 'muted'}
              className="mb-4"
            />
            <Text variant="h4" className="text-center">
              {done === 'allowed' ? 'Alerts are on' : 'No alerts, then'}
            </Text>
            <Text className="text-muted-foreground max-w-xs text-center">
              {done === 'allowed'
                ? 'This prototype can tell you when something changes.'
                : 'Everything still works — updates appear inside the app instead.'}
            </Text>
          </View>
        ) : (
          <PermissionPrimer
            capability="notify"
            onAllow={() => setDone('allowed')}
            onSkip={() => setDone('skipped')}
          />
        )}
      </Card>
      {done ? (
        <Button variant="outline" onPress={() => setDone(null)}>
          <Text>Show the primer again</Text>
        </Button>
      ) : null}
    </View>
  );
}

function ShareDemo() {
  const { share } = useShare();
  // The link that actually opens this prototype, wherever it is running.
  const url = Linking.createURL('/');
  return (
    <View className="w-full gap-3">
      <Button
        onPress={() => void share({ title: 'Halftone', message: 'Take a look at this prototype', url })}>
        <Text>Share this prototype</Text>
      </Button>
      <Text className="text-muted-foreground text-sm" numberOfLines={2}>
        {url}
      </Text>
    </View>
  );
}

function NotifyDemo() {
  const { notify, simulated } = useNotify();
  return (
    <View className="w-full gap-3">
      <Button
        onPress={() =>
          void notify({ title: 'Title', body: 'Description goes here, over two lines when it needs them.' })
        }>
        <Text>Show a banner now</Text>
      </Button>
      <Button
        variant="outline"
        onPress={() =>
          void notify({ title: 'Title', body: 'Description goes here, over two lines when it needs them.', delay: 5 })
        }>
        <Text>Schedule one in 5s</Text>
      </Button>
      <Text className="text-muted-foreground text-sm">
        {simulated
          ? 'Scheduled alerts need a device — it falls back to the banner after the same delay.'
          : 'Background the app to see the scheduled one arrive. If alerts are off it falls back to the banner.'}
      </Text>
    </View>
  );
}

/** Components page demos, keyed by the component id in registry/components.ts. */
export const KIT_NATIVE_DEMOS: Record<string, ComponentType> = {
  'photo-capture': PhotoCaptureDemo,
  'code-scanner': CodeScannerDemo,
  'biometric-gate': BiometricGateDemo,
  'permission-primer': PermissionPrimerDemo,
  'share': ShareDemo,
  'notify': NotifyDemo,
};
