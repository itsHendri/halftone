/**
 * The registry's data types. Pure TypeScript with no runtime imports, so the app (Metro), the build
 * scripts (Node) and the docs site (Next) can all read registry/*.ts.
 */

/** Functional browse buckets for the Kitchen Sink (the industry taxonomy designers expect). */
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
  | 'ai'
  | 'native';

export type CategoryMeta = {
  id: CategoryId;
  label: string;
  blurb: string;
};

/**
 * One component (or hook) the kit ships. This is the source for the Kitchen Sink metadata, the
 * registry tables in DESIGN_SYSTEM.md, llms.txt, the shadcn registry and the docs site.
 */
export type ComponentMeta = {
  /** Stable slug: Kitchen Sink deep-link anchor, shadcn registry item name, docs URL. */
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
  /** Usage guidance shown under the Kitchen Sink demo. */
  caption?: string;
  /** Extra search terms ("toggle" → Switch). */
  aliases?: string[];
  /** false = no Kitchen Sink section (previewed elsewhere, or scaffolding). */
  preview?: false;
  /** false = never published to the shadcn registry. */
  publish?: false;
};
