import { useFontStyle } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Platform, TextInput } from 'react-native';

function Textarea({
  className,
  multiline = true,
  numberOfLines = Platform.select({ web: 2, native: 8 }), // On web, numberOfLines also determines initial height. On native, it determines the maximum height.
  placeholderClassName,
  ...props
}: React.ComponentProps<typeof TextInput> & React.RefAttributes<TextInput>) {
  // The theme's body font, like Text (a custom font is one family per weight on native).
  const font = useFontStyle(className ?? '');
  return (
    <TextInput
      className={cn(
        'text-foreground bg-field border-field-edge border-field-w border-b-field-edge-w rounded-t-field rounded-b-field-b px-field-x flex min-h-24 w-full flex-row py-2 text-base md:text-sm',
        Platform.select({
          web: 'placeholder:text-muted-foreground placeholder-shown:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive field-sizing-content resize-y outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed',
        }),
        props.editable === false && 'opacity-50',
        className
      )}
      placeholderClassName={cn('text-muted-foreground', placeholderClassName)}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical="top"
      aria-disabled={props.editable === false || undefined}
      {...props}
      style={font ? [font, props.style] : props.style}
    />
  );
}

export { Textarea };
