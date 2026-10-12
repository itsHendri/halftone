import { createSearchAPI } from 'fumadocs-core/search/server';
import { CATALOGUE, entryUrl, groupOf, SIDE_LABEL } from '@/lib/catalogue';
import { source } from '@/lib/source';

export const revalidate = false;

/** One static index: the MDX docs plus every component in the catalogue (title, exports, notes, caption, aliases). */
export const { staticGET: GET } = createSearchAPI('advanced', {
  language: 'english',
  indexes: async () => [
    ...source.getPages().map((page) => ({
      id: page.url,
      title: page.data.title,
      description: page.data.description,
      url: page.url,
      breadcrumbs: ['Docs'],
      structuredData: page.data.structuredData,
    })),
    // One result per component, whichever kits have it; the breadcrumb says which.
    ...CATALOGUE.map((e) => {
      const versions = [e.native, e.web].filter((c) => c !== undefined);
      return {
        id: entryUrl(e.id),
        title: e.title,
        description: versions[0].notes.replace(/`/g, ''),
        url: entryUrl(e.id),
        breadcrumbs: ['Components', groupOf(e.group).label, e.sides.map((s) => SIDE_LABEL[s]).join(' · ')],
        structuredData: {
          headings: [],
          contents: versions
            .flatMap((c) => [c.exports.join(' '), c.notes, c.caption ?? '', (c.aliases ?? []).join(' ')])
            .filter(Boolean)
            .map((content) => ({ heading: undefined, content: content.replace(/`/g, '') })),
        },
      };
    }),
  ],
});
