import { llms, loader } from 'fumadocs-core/source';
import { icons } from 'lucide-react';
import { createElement } from 'react';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { applyMdxPreset } from 'fumadocs-mdx/config';
import { defineDocs } from 'fumadocs-mdx/macro';
import { codeThemes, docsRoute } from './shared';

const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
    mdxOptions: applyMdxPreset({ rehypeCodeOptions: { themes: codeThemes } }),
    postprocess: { includeProcessedMarkdown: true },
  },
  meta: { schema: metaSchema },
});

export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  // `---[Rocket]Get started---` in meta.json: a lucide icon by name, beside the group title.
  icon(name) {
    if (name && name in icons) return createElement(icons[name as keyof typeof icons]);
  },
});

export const docsLlms = llms(source, {
  renderPage: async (page) => `# ${page.data.title} (${page.url})\n\n${await page.data.getText('processed')}`,
});
