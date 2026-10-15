/**
 * The registry's data types. Pure TypeScript with no runtime imports, so the app, the build scripts
 * (Node) and the docs site can all read registry/*.ts.
 */

/** Browse buckets for the Components page. */
export type CategoryId =
  | 'actions'
  | 'inputs'
  | 'navigation'
  | 'data'
  | 'feedback'
  | 'layout'
  | 'overlays'
  | 'media'
  | 'marketing'
  | 'ai';

export type CategoryMeta = {
  id: CategoryId;
  label: string;
  blurb: string;
};

/**
 * One component (or hook) the kit ships: the source for the Components page, the registry tables in
 * DESIGN_SYSTEM.md, llms.txt, the shadcn registry and the docs site.
 */
export type ComponentMeta = {
  /** Stable slug: Components page anchor, shadcn registry item name, docs URL. */
  id: string;
  /** Display title and primary search key. */
  title: string;
  /** Public names, the component first. Hooks start with `use`. */
  exports: string[];
  category: CategoryId;
  /** Source files, relative to the app root; the first one is the component's home. */
  files: string[];
  /** One line for the DESIGN_SYSTEM.md table and llms.txt. Markdown allowed. */
  notes: string;
  /** One-line API hint (docs, llms.txt). */
  api?: string;
  /** When to use it, and the one rule people get wrong. */
  caption?: string;
  /** Extra search terms. */
  aliases?: string[];
  /** false = no demo on the Components page. */
  preview?: false;
  /** false = never published to the shadcn registry. */
  publish?: false;
};
