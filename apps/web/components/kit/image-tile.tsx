'use client';
import { cn } from 'cn';
import { ImageIcon, type LucideIcon } from 'lucide-react';
import * as React from 'react';
import { Placeholder } from '@/components/kit/placeholder';

type Props = {
  src?: string;
  /** Describes the image. Empty ("") when it is decoration. */
  alt?: string;
  /** Width / height. Default 4/3. */
  ratio?: number;
  /** Shown while loading or when there is no source. */
  fallbackIcon?: LucideIcon;
  /** With no `src` (or a broken one), draw generated art from this seed instead of a grey box. */
  seed?: string;
  caption?: string;
  className?: string;
};

/** Rounded image with a muted placeholder: product shots, covers, attachments. */
export function ImageTile({ src, alt = '', ratio = 4 / 3, fallbackIcon: Fallback = ImageIcon, seed, caption, className }: Props) {
  const [failed, setFailed] = React.useState(false);
  const showImage = !!src && !failed;
  const Wrapper = caption ? 'figure' : 'div';
  return (
    <Wrapper className={cn('flex flex-col gap-2', className)}>
      {!showImage && seed ? (
        <Placeholder seed={seed} ratio={ratio} icon={Fallback} />
      ) : (
        <div className="bg-muted flex w-full items-center justify-center overflow-hidden rounded-lg" style={{ aspectRatio: ratio }}>
          {showImage ? (
            // A prototype's images come from anywhere; next/image would need every host configured.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt} onError={() => setFailed(true)} className="size-full object-cover" />
          ) : (
            <Fallback className="text-muted-foreground size-7" aria-hidden />
          )}
        </div>
      )}
      {caption ? <figcaption className="text-muted-foreground text-sm">{caption}</figcaption> : null}
    </Wrapper>
  );
}
