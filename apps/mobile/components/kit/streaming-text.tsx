import { Text } from '@/components/ui/text';
import { useReducedMotion } from '@/lib/reduced-motion';
import * as React from 'react';

/**
 * Reveals `text` a few characters at a time, the way a model's answer arrives. Shows it all at once when
 * reduced motion is on. `onDone` fires when the whole text is visible.
 */
export function useStreamingText(text: string, { charsPerTick = 3, tickMs = 24, onDone }: { charsPerTick?: number; tickMs?: number; onDone?: () => void } = {}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = React.useState(0);
  const done = reduced || shown >= text.length;

  React.useEffect(() => {
    if (done) return;
    const t = setTimeout(() => setShown((n) => Math.min(text.length, n + charsPerTick)), tickMs);
    return () => clearTimeout(t);
  }, [shown, done, text.length, charsPerTick, tickMs]);

  React.useEffect(() => {
    if (done) onDone?.();
  }, [done, onDone]);

  return { visible: done ? text : text.slice(0, shown), done };
}

type Props = { text: string; onDone?: () => void; className?: string };

/** A model answer arriving. Screen readers get the full text once, not every character. */
export function StreamingText({ text, onDone, className }: Props) {
  const { visible, done } = useStreamingText(text, { onDone });
  return (
    <Text className={className ?? 'leading-6'} accessibilityLabel={text} aria-busy={!done}>
      {visible}
      {!done ? <Text className="text-foreground/70"> ▍</Text> : null}
    </Text>
  );
}
