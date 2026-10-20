import { cn } from 'cn';
import type * as React from 'react';

/**
 * Long-form text at the theme's typeset: running text is the paragraph text style (type-p: --type-p-size,
 * -leading, -weight, -tracking, -font), the measure (longest line) and flow (space between blocks) come from
 * --typeset-measure and --typeset-flow. Headings, quotes and code keep Prose's own long-form scale (smaller than
 * the h1–h4 text styles), with the heading and mono fonts. Style the HTML you put in it (an article, rendered
 * markdown, a chat answer), not the layout around it: no cards, buttons or grids inside.
 */
const PROSE = cn(
  'text-foreground type-p max-w-(--typeset-measure)',
  // Flow: the same space between every pair of blocks; a heading gets more above it than below.
  '[&>*+*]:mt-(--typeset-flow) [&>:is(h2,h3,h4):not(:first-child)]:mt-[calc(var(--typeset-flow)*1.6)] [&>:is(h2,h3,h4)+*]:mt-[calc(var(--typeset-flow)*0.5)]',
  '[&_:is(h1,h2,h3,h4)]:font-heading [&_:is(h1,h2,h3,h4)]:text-balance [&_:is(h1,h2,h3,h4)]:font-semibold [&_:is(h1,h2,h3,h4)]:tracking-tight',
  '[&_h1]:text-3xl [&_h1]:leading-tight [&_h2]:text-2xl [&_h2]:leading-snug [&_h3]:text-xl [&_h3]:leading-snug [&_h4]:text-base',
  '[&_a]:text-foreground [&_a]:decoration-primary [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4',
  '[&_strong]:font-semibold [&_:is(ul,ol)]:pl-6 [&_ul]:list-disc [&_ol]:list-decimal [&_li+li]:mt-2 [&_li]:pl-1 [&_li::marker]:text-muted-foreground',
  '[&_blockquote]:border-border [&_blockquote]:text-muted-foreground [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:italic',
  '[&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:rounded-sm [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:text-[0.875em]',
  '[&_:is(code,pre,kbd)]:font-mono [&_pre]:bg-muted [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:text-sm [&_pre]:leading-relaxed',
  '[&_hr]:border-border [&_table]:w-full [&_table]:text-sm [&_th]:border-b [&_th]:py-2 [&_th]:pr-4 [&_th]:text-left [&_th]:font-medium [&_td]:border-b [&_td]:py-2 [&_td]:pr-4',
  '[&_figcaption]:text-muted-foreground [&_figcaption]:mt-2 [&_figcaption]:text-sm [&_img]:rounded-lg'
);

type Props = React.ComponentProps<'div'> & {
  /** The element to render: `article` for a page's own text, `div` (default) inside something else. */
  as?: 'div' | 'article' | 'section';
};

export function Prose({ as: Tag = 'div', className, ...props }: Props) {
  return <Tag data-slot="prose" className={cn(PROSE, className)} {...props} />;
}
