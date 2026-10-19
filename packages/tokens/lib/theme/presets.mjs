/**
 * Starting points by personality. Each is a full recipe, typeset included; the picker starts from one and tweaks.
 * Drafts — review them in the docs studio (/themes) and adjust here. Order is the gallery order.
 */
export const PRESETS = [
  {
    id: 'default',
    name: 'Default',
    description: 'The kit as it ships: system type, blue, soft cards.',
    recipe: { brand: '#2563eb', neutral: 'zinc', radius: 'lg', controls: 'pill', font: { heading: 'system', body: 'system', mono: 'system-mono' }, stroke: 'regular', depth: 'soft', density: 'comfortable', border: 'regular', size: '16', leading: 'normal', flow: 'normal', measure: '70' },
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Serif headlines, rust ink, hairlines, underlined fields and almost no rounding.',
    recipe: { brand: '#9a3412', neutral: 'stone', radius: 'sm', controls: 'match', font: { heading: 'fraunces', body: 'inter', mono: 'ibm-plex-mono' }, stroke: 'thin', depth: 'flat', density: 'comfortable', border: 'hairline', size: '18', leading: 'relaxed', flow: 'normal', measure: '70', button: 'solid', field: 'underline' },
  },
  {
    id: 'soft',
    name: 'Soft',
    description: 'Lavender, generous radius, tinted buttons, filled fields and room to breathe.',
    recipe: { brand: '#8b5cf6', neutral: 'brand', radius: '2xl', controls: 'pill', font: { heading: 'plus-jakarta-sans', body: 'plus-jakarta-sans', mono: 'geist-mono' }, stroke: 'regular', depth: 'soft', density: 'spacious', border: 'hairline', size: '16', leading: 'relaxed', flow: 'loose', measure: '60', button: 'soft', field: 'filled' },
  },
  {
    id: 'playful',
    name: 'Playful',
    description: 'Pink, chunky icons, round display type, lifted cards and raised buttons.',
    recipe: { brand: '#db2777', neutral: 'neutral', radius: 'xl', controls: 'pill', font: { heading: 'bricolage-grotesque', body: 'nunito', mono: 'fira-code' }, stroke: 'bold', depth: 'raised', density: 'comfortable', border: 'regular', size: '16', leading: 'relaxed', flow: 'normal', measure: '60', button: 'raised', field: 'outline' },
  },
  {
    id: 'brutalist',
    name: 'Brutalist',
    description: 'Square corners, heavy borders, hard offset shadows, grotesk type.',
    recipe: { brand: '#e11d48', neutral: 'neutral', radius: 'none', controls: 'match', font: { heading: 'space-grotesk', body: 'space-grotesk', mono: 'jetbrains-mono' }, stroke: 'bold', depth: 'hard', density: 'comfortable', border: 'heavy', size: '15', leading: 'tight', flow: 'tight', measure: '80' },
  },
  {
    id: 'mono',
    name: 'Mono',
    description: 'Black and white, Geist, flat and compact: a tool, not a toy.',
    recipe: { brand: '#18181b', neutral: 'zinc', radius: 'md', controls: 'match', font: { heading: 'geist', body: 'geist', mono: 'geist-mono' }, stroke: 'regular', depth: 'flat', density: 'compact', border: 'regular', size: '14', leading: 'tight', flow: 'tight', measure: '80' },
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Electric violet, heavy icons, big controls and raised surfaces.',
    recipe: { brand: '#7c3aed', neutral: 'slate', radius: 'xl', controls: 'pill', font: { heading: 'outfit', body: 'inter', mono: 'jetbrains-mono' }, stroke: 'bold', depth: 'raised', density: 'spacious', border: 'regular', size: '18', leading: 'normal', flow: 'normal', measure: '60' },
  },
  {
    id: 'calm',
    name: 'Calm',
    description: 'Teal on warm greys, a book serif for headings, thin lines, no shadows.',
    recipe: { brand: '#0d9488', neutral: 'stone', radius: 'xl', controls: 'match', font: { heading: 'lora', body: 'manrope', mono: 'source-code-pro' }, stroke: 'thin', depth: 'flat', density: 'spacious', border: 'hairline', size: '16', leading: 'relaxed', flow: 'loose', measure: '70' },
  },
  {
    id: 'tactile',
    name: 'Tactile',
    description: 'Warm orange, raised buttons you want to press, filled fields, rounded and friendly.',
    recipe: { brand: '#ea580c', neutral: 'stone', radius: 'xl', controls: 'match', font: { heading: 'nunito', body: 'nunito', mono: 'fira-code' }, stroke: 'bold', depth: 'raised', density: 'comfortable', border: 'regular', size: '16', leading: 'normal', flow: 'normal', measure: '70', button: 'raised', field: 'filled' },
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'Indigo on slate, tinted buttons, underlined fields, hairlines: quiet and precise.',
    recipe: { brand: '#4f46e5', neutral: 'slate', radius: 'md', controls: 'match', font: { heading: 'geist', body: 'geist', mono: 'geist-mono' }, stroke: 'regular', depth: 'flat', density: 'comfortable', border: 'hairline', size: '15', leading: 'normal', flow: 'normal', measure: '70', button: 'soft', field: 'underline' },
  },
];

export const presetById = (id) => PRESETS.find((p) => p.id === id);
