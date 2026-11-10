/**
 * The Foundations page's sections, in order: the page's cards and the Studio sidebar's Foundations rows
 * (design/navigation-wireframes.md › Round two). A plain module, so the server-built sidebar tree can read it.
 * Controls is the component styles (Button, Chip, Badge, Input): not "Components", which is its own Studio page.
 */
export const FOUNDATION_SECTIONS = [
  { id: 'brand', label: 'Brand' },
  { id: 'colours', label: 'Colours' },
  { id: 'typography', label: 'Typography' },
  { id: 'corners', label: 'Corners' },
  { id: 'shadows', label: 'Shadows' },
  { id: 'borders', label: 'Borders' },
  { id: 'motion', label: 'Motion' },
  { id: 'controls', label: 'Controls' },
] as const;
export type SectionId = (typeof FOUNDATION_SECTIONS)[number]['id'];

/** A section card's element id, and its anchor on /studio. */
export const sectionAnchor = (id: string) => `foundations-${id}`;
