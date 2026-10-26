import { useFontStyle } from '@/components/ui/text';
import { fieldShadowClass, useFieldShadow } from '@/lib/component-classes';
import { useLiveComponent } from '@/lib/palette-context';
import { TOKENS } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { Platform, TextInput } from 'react-native';

const input = TOKENS.components.input;
const text = input.text;
/** The Input's text style beyond its size: tracking (none on native when 0, as Text) and the font role. */
const TEXT = cn(
  (Platform.OS === 'web' || text.tracking !== 0) && 'tracking-type-field',
  text.font === 'heading' && 'font-heading',
  text.font === 'mono' && 'font-mono'
);

function Input({ className, ...props }: React.ComponentProps<typeof TextInput> & React.RefAttributes<TextInput>) {
  // The theme's body font, like Text (a custom font is one family per weight on native).
  const font = useFontStyle(className ?? '');
  const live = useLiveComponent('input');
  // The field's shadow (its style's until the system sets one); native draws it as a boxShadow.
  const level = live?.shadow ?? input.shadow;
  const shadow = useFieldShadow(level);
  return (
    <TextInput
      className={cn(
        // The theme's Input (semantic.component.input, --field-*): the field style's fill, line, corners and inset,
        // its height and text, and each state's colours.
        'bg-field-default-bg border-field-default-border border-field-w border-b-field-edge-w rounded-t-field rounded-b-field-b px-field-x text-field-default-fg flex h-field-md w-full min-w-0 flex-row items-center py-1 text-type-field leading-5',
        TEXT,
        fieldShadowClass(level),
        props.editable === false &&
        cn(
          'bg-field-disabled-bg border-field-disabled-border text-field-disabled-fg opacity-50',
          Platform.select({ web: 'disabled:pointer-events-none disabled:cursor-not-allowed' })
        ),
        Platform.select({
          web: cn(
            // placeholder-shown: the CSS reset colours an empty input gray-400 (2.5:1), which is what
            // contrast checkers measure; match it to the placeholder's role (muted-foreground by default).
            'placeholder:text-field-placeholder placeholder-shown:text-field-placeholder selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow]',
            'focus-visible:border-field-focus-border focus-visible:bg-field-focus-bg focus-visible:text-field-focus-fg focus-visible:ring-field-focus-ring focus-visible:ring-[length:var(--field-ring-w)]',
            'aria-invalid:ring-field-error-ring aria-invalid:border-field-error-border aria-invalid:bg-field-error-bg aria-invalid:text-field-error-fg'
          ),
          // A text field has no hitSlop: phones draw it at least 44pt tall.
          native: 'placeholder:text-field-placeholder/50 min-h-11',
        }),
        className
      )}
      // A read-only field is drawn disabled, so say so (web renders readonly otherwise).
      aria-disabled={props.editable === false || undefined}
      {...props}
      style={[font, shadow, props.style]}
    />
  );
}

export { Input };
