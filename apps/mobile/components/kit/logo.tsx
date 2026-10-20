import { Text } from '@/components/ui/text';
import type { BrandImage } from '@/lib/brand';
import { useBrand } from '@/lib/brand-context';
import { usePalette } from '@/lib/palette-context';
import type { ThemeColorName } from '@/lib/theme';
import { useKitTheme } from '@/lib/theme-context';
import { cn } from '@/lib/utils';
import { Image, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

type Props = {
  /** `full` the logo (default), `mark` the square mark (falls back to the logo). */
  variant?: 'full' | 'mark';
  /** Height in points. Width follows the logo's shape. Default 24. */
  size?: number;
  /** The name to show (and read out) when there's no logo: a sample's product name. Default the brand's name. */
  name?: string;
  /** The theme colour a one-colour logo takes. Default `foreground`; `primaryForeground` on a primary fill. */
  tone?: ThemeColorName;
  className?: string;
};

/**
 * The brand's logo from lib/brand.ts (Studio's brand download), in the scheme on screen. A one-colour
 * logo takes the theme's text colour, so it works in light and dark; a coloured one can have a dark version.
 * Without a logo: a placeholder square and the name, so screens look the same before a brand is applied.
 */
export function Logo({ variant = 'full', size = 24, name, tone = 'foreground', className }: Props) {
  const brand = useBrand();
  const { scheme } = useKitTheme();
  const palette = usePalette();
  const label = name ?? brand.name;
  const light = variant === 'mark' ? (brand.mark ?? brand.logo) : brand.logo;
  const dark = variant === 'mark' ? (brand.mark ? brand.markDark : brand.logoDark) : brand.logoDark;
  const image: BrandImage | undefined = scheme === 'dark' && dark ? dark : light;

  if (!image) {
    return (
      <View className={cn('flex-row items-center gap-2', className)} accessible accessibilityRole="image" accessibilityLabel={label}>
        {/* On a fill (tone other than foreground) the square and the name take that tone, so they stay visible. */}
        <View
          className={cn('rounded-md', tone === 'foreground' && 'bg-primary')}
          style={{ width: Math.round(size * 0.8), height: Math.round(size * 0.8), backgroundColor: tone === 'foreground' ? undefined : palette[tone] }}
        />
        {variant === 'full' ? (
          <Text className="font-semibold" style={tone === 'foreground' ? undefined : { color: palette[tone] }}>
            {label}
          </Text>
        ) : null}
      </View>
    );
  }
  const width = Math.round(size * image.aspect);
  return (
    <View className={className} accessible accessibilityRole="image" accessibilityLabel={label}>
      {image.svg ? (
        <SvgXml xml={image.svg} width={width} height={size} color={image.mono ? palette[tone] : undefined} />
      ) : (
        <Image source={{ uri: image.png }} style={{ width, height: size }} resizeMode="contain" />
      )}
    </View>
  );
}
