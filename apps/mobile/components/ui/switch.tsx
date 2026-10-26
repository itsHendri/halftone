import { labelIdFor } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import * as SwitchPrimitives from '@rn-primitives/switch';
import { Platform } from 'react-native';

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitives.Root>) {
  return (
    <SwitchPrimitives.Root
      className={cn(
        'flex h-8 w-16 shrink-0 flex-row items-center rounded-full border border-transparent p-px shadow-sm',
        Platform.select({
          web: 'focus-visible:border-ring focus-visible:ring-ring/50 peer inline-flex outline-none transition-all focus-visible:ring-[3px] disabled:cursor-not-allowed',
        }),
        props.checked ? 'bg-primary' : 'bg-input',
        props.disabled && 'opacity-50',
        className
      )}
      // On web the switch is a div, which `<Label htmlFor>` cannot label; point at the Label's id instead.
      aria-labelledby={props.id ? labelIdFor(props.id) : undefined}
      {...props}>
      <SwitchPrimitives.Thumb
        className={cn(
          'bg-card size-7 rounded-full shadow-sm shadow-black/20 transition-transform',
          Platform.select({
            web: 'pointer-events-none block ring-0',
          }),
          props.checked
            ? 'dark:bg-foreground translate-x-[32px]'
            : 'dark:bg-foreground translate-x-0'
        )}
      />
    </SwitchPrimitives.Root>
  );
}

export { Switch };
