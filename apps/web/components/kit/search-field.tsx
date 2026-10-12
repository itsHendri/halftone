'use client';
import { cn } from 'cn';
import { SearchIcon, XIcon } from 'lucide-react';
import type * as React from 'react';
import { Input } from '@/components/ui/input';

type Props = Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> & {
  value: string;
  onChangeText: (text: string) => void;
  containerClassName?: string;
};

/** Input with a leading search icon and a clear button. */
export function SearchField({ value, onChangeText, className, containerClassName, ...props }: Props) {
  return (
    <div className={cn('relative', containerClassName)}>
      <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
      <Input type="search" value={value} onChange={(e) => onChangeText(e.target.value)} className={cn('pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden', className)} {...props} />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChangeText('')}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm outline-none focus-visible:ring-[3px]">
          <XIcon className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
