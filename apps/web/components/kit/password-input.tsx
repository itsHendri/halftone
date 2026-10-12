'use client';
import { cn } from 'cn';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import * as React from 'react';
import { Input } from '@/components/ui/input';

type Props = Omit<React.ComponentProps<typeof Input>, 'type'> & { containerClassName?: string };

/** Input with a show/hide toggle. Pair with a Label like any Input. */
export function PasswordInput({ className, containerClassName, ...props }: Props) {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className={cn('relative', containerClassName)}>
      <Input type={visible ? 'text' : 'password'} autoComplete="current-password" className={cn('pr-10', className)} {...props} />
      <button
        type="button"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md outline-none focus-visible:ring-[3px]">
        {visible ? <EyeOffIcon className="size-4" aria-hidden /> : <EyeIcon className="size-4" aria-hidden />}
      </button>
    </div>
  );
}
