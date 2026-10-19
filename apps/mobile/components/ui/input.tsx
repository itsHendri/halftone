import { useFontStyle } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Platform, TextInput } from 'react-native';

function Input({ className, ...props }: React.ComponentProps<typeof TextInput> & React.RefAttributes<TextInput>) {
  // The theme's body font, like Text (a custom font is one family per weight on native).
  const font = useFontStyle(className ?? '');
  return (
    <TextInput
      className={cn(
        // The theme's field style (outline, filled, underline): fill, line, corners and inset.
        'bg-field border-field-edge border-field-w border-b-field-edge-w rounded-t-field rounded-b-field-b px-field-x text-foreground flex h-control w-full min-w-0 flex-row items-center py-1 text-base leading-5 sm:h-9',
        props.editable === false &&
        cn(
          'opacity-50',
          Platform.select({ web: 'disabled:pointer-events-none disabled:cursor-not-allowed' })
        ),
        Platform.select({
          web: cn(
            // placeholder-shown: the CSS reset colours an empty input gray-400 (2.5:1), which is what
            // contrast checkers measure; match it to the placeholder, which is muted-foreground.
            'placeholder:text-muted-foreground placeholder-shown:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow] md:text-sm',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
          ),
          native: 'placeholder:text-muted-foreground/50',
        }),
        className
      )}
      // A read-only field is drawn disabled, so say so (web renders readonly otherwise).
      aria-disabled={props.editable === false || undefined}
      {...props}
      style={font ? [font, props.style] : props.style}
    />
  );
}

export { Input };
