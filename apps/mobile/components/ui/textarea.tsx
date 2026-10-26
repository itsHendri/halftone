import { useFontStyle } from '@/components/ui/text';
import { shadowClass } from '@/lib/component-classes';
import { TOKENS } from '@/lib/theme';
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
        // The theme's Input (semantic.component.input, --field-*), as Input draws it.
        'text-field-default-fg bg-field-default-bg border-field-default-border border-field-w border-b-field-edge-w rounded-t-field rounded-b-field-b px-field-x flex min-h-24 w-full flex-row py-2 text-type-field leading-type-field',
        (Platform.OS === 'web' || TOKENS.components.input.text.tracking !== 0) && 'tracking-type-field',
        shadowClass(TOKENS.components.input.shadow, ''),
        Platform.select({
          web: 'placeholder:text-field-placeholder placeholder-shown:text-field-placeholder focus-visible:border-field-focus-border focus-visible:bg-field-focus-bg focus-visible:text-field-focus-fg focus-visible:ring-field-focus-ring aria-invalid:ring-field-error-ring aria-invalid:border-field-error-border aria-invalid:bg-field-error-bg aria-invalid:text-field-error-fg field-sizing-content resize-y outline-none transition-[color,box-shadow] focus-visible:ring-[length:var(--field-ring-w)] disabled:cursor-not-allowed',
        }),
        props.editable === false && 'bg-field-disabled-bg border-field-disabled-border text-field-disabled-fg opacity-50',
        className
      )}
      placeholderClassName={cn('text-field-placeholder', placeholderClassName)}
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
