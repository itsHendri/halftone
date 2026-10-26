import { TextClassContext } from '@/components/ui/text';
import { useIconStroke } from '@/lib/palette-context';
import { cn } from '@/lib/utils';
import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import * as React from 'react';

type IconProps = LucideProps & {
  as: LucideIcon;
} & React.RefAttributes<LucideIcon>;

function IconImpl({ as: IconComponent, ...props }: IconProps) {
  return <IconComponent {...props} />;
}

/** The size an icon takes when it sets none: a Button or Badge passes the theme's icon size (null: Icon's 14). */
const IconSizeContext = React.createContext<number | null>(null);

cssInterop(IconImpl, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      height: 'size',
      width: 'size',
    },
  },
});

/**
 * A wrapper component for Lucide icons with Nativewind `className` support via `cssInterop`.
 *
 * This component allows you to render any Lucide icon while applying utility classes
 * using `nativewind`. It avoids the need to wrap or configure each icon individually.
 *
 * @component
 * @example
 * ```tsx
 * import { ArrowRight } from 'lucide-react-native';
 * import { Icon } from '@/registry/components/ui/icon';
 *
 * <Icon as={ArrowRight} className="text-red-500" size={16} />
 * ```
 *
 * @param {LucideIcon} as - The Lucide icon component to render.
 * @param {string} className - Utility classes to style the icon using Nativewind.
 * @param {number} size - Icon size (defaults to the enclosing Button's or Badge's icon size, or 14).
 * @param {number} strokeWidth - Relative to Lucide's 2: the theme's icon stroke scales it (thin 1.5, bold 2.5).
 * @param {...LucideProps} ...props - Additional Lucide icon props passed to the "as" icon.
 */
function Icon({ as: IconComponent, className, size, strokeWidth = 2, ...props }: IconProps) {
  const textClass = React.useContext(TextClassContext);
  const themed = React.useContext(IconSizeContext);
  const stroke = useIconStroke();
  return (
    <IconImpl
      as={IconComponent}
      className={cn('text-foreground', textClass, className)}
      size={size ?? themed ?? 14}
      strokeWidth={(Number(strokeWidth) * stroke) / 2}
      {...props}
    />
  );
}

export { Icon, IconSizeContext };
