import { cn } from 'cn';
import { LoaderCircleIcon } from 'lucide-react';

type Props = {
  /** `small` 20px (inside buttons and rows) · `large` 36px (loading a page or card). */
  size?: 'small' | 'large';
  /** `button-foreground` is the one to use inside the primary Button (it follows the theme's button style). */
  tone?: 'primary' | 'primary-foreground' | 'button-foreground' | 'foreground' | 'muted';
  /** What is loading. Default "Loading". */
  'aria-label'?: string;
  className?: string;
};

const TONE = {
  primary: 'text-primary',
  'primary-foreground': 'text-primary-foreground',
  'button-foreground': 'text-button-foreground',
  foreground: 'text-foreground',
  muted: 'text-muted-foreground',
} as const;

/** Themed loading indicator for buttons, cards and loading pages. Announced as "Loading"; say what is loading with `aria-label`. */
export function Spinner({ size = 'small', tone = 'primary', className, ...props }: Props) {
  return (
    <span role="status" aria-label={props['aria-label'] ?? 'Loading'} className={cn('inline-flex', TONE[tone], className)}>
      <LoaderCircleIcon className={cn('animate-spin motion-reduce:[animation-duration:1.5s]', size === 'large' ? 'size-9' : 'size-5')} aria-hidden />
    </span>
  );
}
