/** The site's sections, in top-bar order (apps/docs/design/navigation-wireframes.md). A plain module: the server layouts read it too. */
export const SECTIONS = [
  { text: 'Docs', url: '/docs' },
  { text: 'Components', url: '/components' },
  { text: 'Screens', url: '/screens' },
  { text: 'Themes', url: '/themes' },
  { text: 'Brief', url: '/brief' },
] as const;
