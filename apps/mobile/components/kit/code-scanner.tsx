import { Placeholder } from '@/components/kit/placeholder';
import { PermissionPrimer } from '@/components/kit/permission-primer';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { haptic } from '@/lib/haptics';
import { useCapability } from '@/lib/native-context';
import { cn } from '@/lib/utils';
import { CameraView, type BarcodeType } from 'expo-camera';
import { XIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

export type CodeType = 'qr' | 'ean13' | 'code128' | 'pdf417' | 'upc_a';

type Props = {
  onScan: (value: string, type?: string) => void;
  /** Symbologies to look for. Default `['qr']`. */
  types?: CodeType[];
  /** Copy under the viewfinder frame. */
  hint?: string;
  /** Viewfinder aspect ratio. Default 1. */
  ratio?: number;
  /** Keep scanning after the first hit. Default false. */
  continuous?: boolean;
  /** What the simulated scanner emits, in order. */
  simulatedValues?: string[];
  /** Adds a close button over the viewfinder. Without it there is no way to stop the camera. */
  onClose?: () => void;
  simulate?: boolean;
  className?: string;
};

/** Four corner brackets — reads as a viewfinder without hiding what is behind it. */
function Reticle() {
  const corner = 'border-primary absolute size-10';
  return (
    <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
      <View className="h-2/3 w-2/3">
        <View className={cn(corner, 'left-0 top-0 rounded-tl-2xl border-l-4 border-t-4')} />
        <View className={cn(corner, 'right-0 top-0 rounded-tr-2xl border-r-4 border-t-4')} />
        <View className={cn(corner, 'bottom-0 left-0 rounded-bl-2xl border-b-4 border-l-4')} />
        <View className={cn(corner, 'bottom-0 right-0 rounded-br-2xl border-b-4 border-r-4')} />
      </View>
    </View>
  );
}

/**
 * QR / barcode viewfinder with a framing overlay.
 *
 * Simulated wherever there is no camera — the web preview, the simulator — where it
 * shows the same overlay and a button that emits a sample payload.
 */
export function CodeScanner({
  onScan,
  types = ['qr'],
  hint = 'Point the camera at a code',
  ratio = 1,
  continuous = false,
  simulatedValues = ['https://example.com/kit-demo'],
  onClose,
  simulate,
  className,
}: Props) {
  const { cap, request } = useCapability('camera', simulate);
  const [done, setDone] = React.useState(false);
  const [simIndex, setSimIndex] = React.useState(0);

  const emit = (value: string, type?: string) => {
    if (done && !continuous) return;
    if (!continuous) setDone(true);
    haptic('success');
    onScan(value, type);
  };

  const frame = (children: React.ReactNode) => (
    <View className={cn('gap-3', className)}>
      <View className="bg-muted w-full overflow-hidden rounded-2xl" style={{ aspectRatio: ratio }}>
        {children}
        <Reticle />
        {onClose ? (
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close the scanner"
            // eslint-disable-next-line halftone/no-alpha-colour -- an overlay on the camera image, which no surface colour can match
            className="bg-foreground/60 absolute right-3 top-3 size-11 items-center justify-center rounded-full active:opacity-80">
            <Icon as={XIcon} size={20} className="text-background" />
          </Pressable>
        ) : null}
      </View>
      <Text className="text-muted-foreground text-center text-sm">{hint}</Text>
    </View>
  );

  if (cap.simulated) {
    return (
      <View className={cn('gap-3', className)}>
        {frame(<Placeholder seed="scanner" ratio={ratio} palette="mono" className="h-full rounded-2xl" />)}
        <Button
          variant="secondary"
          onPress={() => {
            emit(simulatedValues[simIndex % simulatedValues.length]);
            setSimIndex((i) => i + 1);
          }}>
          <Text>Simulate a scan</Text>
        </Button>
      </View>
    );
  }

  if (cap.state !== 'ready') {
    return (
      <PermissionPrimer
        capability="camera"
        className={className}
        onAllow={() => void request()}
        onSkip={() => emit(simulatedValues[0])}
        skipLabel="Enter the code manually"
      />
    );
  }

  return frame(
    <CameraView
      style={{ flex: 1 }}
      facing="back"
      barcodeScannerSettings={{ barcodeTypes: types as BarcodeType[] }}
      onBarcodeScanned={done && !continuous ? undefined : ({ data, type }) => emit(data, type)}
    />
  );
}
