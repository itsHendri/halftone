#!/usr/bin/env node
/**
 * The whole site, ready for Cloudflare: `npm run build` (in apps/docs) → out/.
 *
 *   1. tokens.css from the kit's tokens.json (halftone-tokens) and the generated MDX pages
 *   2. the mobile kit's web export, under the sub-path /m (embed mode for the phone frames)
 *   3. the web kit's static export, under /w (the browser frames)
 *   4. the shadcn registries: Expo apps at /r/native/*.json, Next.js apps at /r/web/*.json, and Halftone themes
 *      for any shadcn project: the presets at /r/theme/<preset>.json, the fonts they use at /r/font/*.json
 *   5. _redirects (SPA fallback for the mobile kit's routes only) and _headers (content types, CORS)
 *   6. next build (static export) and a check that everything above landed in out/
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const docs = join(dirname(fileURLToPath(import.meta.url)), '..');
const mobile = join(docs, '../mobile');
const web = join(docs, '../web');
const pub = join(docs, 'public');
const kit = JSON.parse(readFileSync(join(docs, '../../kit.json'), 'utf8'));
const KIT_PATH = '/m';
const WEB_PATH = '/w';

const run = (cmd, args, cwd, env = {}) =>
  execFileSync(cmd, args, { cwd, stdio: 'inherit', env: { ...process.env, ...env } });
const step = (label) => console.log(`\n▸ ${label}`);

step('tokens and generated content');
run('npx', ['halftone-tokens', 'build', '--strict'], docs);
run('node', ['scripts/prepare-content.mjs'], docs);

step(`mobile kit web export → public${KIT_PATH}`);
rmSync(join(pub, KIT_PATH.slice(1)), { recursive: true, force: true });
run('npx', ['expo', 'export', '--platform', 'web', '--output-dir', join(pub, KIT_PATH.slice(1))], mobile, {
  KIT_WEB_BASE_URL: KIT_PATH,
});

step('shadcn registry → public/r/native');
run('npm', ['run', 'registry:dist'], mobile);
rmSync(join(pub, 'r'), { recursive: true, force: true });
cpSync(join(mobile, 'dist/r/native'), join(pub, 'r/native'), { recursive: true });

// The web kit prerenders every route, so unlike /m it needs no SPA fallback: each page is its own HTML file.
step(`web kit static export → public${WEB_PATH}`);
rmSync(join(web, 'out'), { recursive: true, force: true });
run('npx', ['next', 'build'], web, { KIT_WEB_EXPORT: '1', KIT_WEB_BASE_PATH: WEB_PATH });
rmSync(join(pub, WEB_PATH.slice(1)), { recursive: true, force: true });
cpSync(join(web, 'out'), join(pub, WEB_PATH.slice(1)), { recursive: true });

step('shadcn registry → public/r/web');
run('npm', ['run', 'registry:dist'], web);
cpSync(join(web, 'dist/r/web'), join(pub, 'r/web'), { recursive: true });

// Halftone themes for any shadcn project (lib/theme/shadcn.mjs): each preset as a registry:theme item, and the
// registry:font items every theme depends on (a fixed set: Halftone's Google fonts, in each role).
step('shadcn themes and fonts → public/r/theme, public/r/font');
{
  const { FONTS, PRESETS, applyRecipe, shadcnFont, shadcnFontPath, shadcnTheme } = await import('@halftone-ds/tokens/theme');
  const base = JSON.parse(readFileSync(join(mobile, 'tokens/tokens.json'), 'utf8'));
  const fontsUrl = `${(kit.siteUrl ?? 'https://halftonedesignsystem.com').replace(/\/$/, '')}/r`;
  const write = (path, item) => {
    mkdirSync(dirname(join(pub, 'r', path)), { recursive: true });
    writeFileSync(join(pub, 'r', path), JSON.stringify(item, null, 2) + '\n');
  };
  for (const p of PRESETS) {
    const { theme } = applyRecipe(base, { ...p.recipe, preset: p.id });
    write(`theme/${p.id}.json`, shadcnTheme(theme, { name: `halftone-${p.id}`, title: `Halftone ${p.name} theme`, fontsUrl }));
  }
  let fonts = 0;
  for (const f of FONTS.filter((f) => !f.system)) {
    for (const role of f.category === 'mono' ? ['body', 'heading', 'mono'] : ['body', 'heading']) {
      write(shadcnFontPath(f.id, role), shadcnFont(f.id, role));
      fonts++;
    }
  }
  console.log(`  ${PRESETS.length} themes, ${fonts} font items`);
}

step('_redirects and _headers');
/**
 * The kit's web export is a single-page app, so its routes must serve /m/index.html. Cloudflare applies
 * _redirects even when a file exists, so a blanket `/m/*` rule would also swallow the kit's JS and
 * assets. One rule per route instead, read from the kit's app/ folder: route groups `(x)` are pathless,
 * files are routes, folders are routes with sub-paths.
 */
function kitRoutes(dir) {
  const routes = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (name.startsWith('_') || name.startsWith('+')) continue;
    if (statSync(full).isDirectory()) {
      if (/^\(.*\)$/.test(name)) routes.push(...kitRoutes(full));
      else routes.push({ path: `/${name}`, nested: true });
    } else if (/\.tsx?$/.test(name)) {
      const route = name.replace(/\.tsx?$/, '');
      if (route !== 'index') routes.push({ path: `/${route}`, nested: false });
    }
  }
  return routes;
}
const routes = kitRoutes(join(mobile, 'app'));
// Rewrite to `/m/`, not `/m/index.html`: with html_handling auto-trailing-slash, Cloudflare answers a
// request for /m/index.html with a redirect to /m/, which would turn every rewrite into a redirect.
const shell = `${KIT_PATH}/`;
const redirects = routes.flatMap(({ path, nested }) => [
  `${KIT_PATH}${path} ${shell} 200`,
  `${KIT_PATH}${path}/ ${shell} 200`,
  ...(nested ? [`${KIT_PATH}${path}/* ${shell} 200`] : []),
]);
// The components used to live under one tree per kit (/components/mobile/<id>, /components/web/<id>); they are
// one catalogue now (/components/<id>, design/components-wireframes.md). Old links keep working.
// The theme studio became Studio (design/studio-wireframes.md); the query (a shared ?t=) comes along.
const moved = [
  ...['mobile', 'web'].flatMap((p) => [`/components/${p} /components/ 301`, `/components/${p}/ /components/ 301`, `/components/${p}/* /components/:splat 301`]),
  '/themes /studio/ 301',
  '/themes/ /studio/ 301',
];
writeFileSync(
  join(pub, '_redirects'),
  `# GENERATED by scripts/build-docs.mjs: the kit's routes → its SPA shell, and moved pages.\n${redirects.join('\n')}\n${moved.join('\n')}\n`
);
writeFileSync(
  join(pub, '_headers'),
  `# GENERATED by scripts/build-docs.mjs
/r/*
  Access-Control-Allow-Origin: *
/install.md
  Content-Type: text/markdown; charset=utf-8
/llms.txt
  Content-Type: text/plain; charset=utf-8
/llms-full.txt
  Content-Type: text/plain; charset=utf-8
/llms.mdx/*
  Content-Type: text/markdown; charset=utf-8
/api/search
  Content-Type: application/json; charset=utf-8
`
);
console.log(`  ${routes.length} kit routes: ${routes.map((r) => r.path).join(' ')}`);

step('next build');
run('npx', ['next', 'build'], docs);

step('check out/');
const expected = [
  'index.html',
  'components/index.html',
  'components/button/index.html',
  'components/list-row/index.html',
  'components/data-table/index.html',
  'docs/install/index.html',
  'screens/index.html',
  'install.md',
  'llms.txt',
  'llms-full.txt',
  'sitemap.xml',
  'robots.txt',
  'api/search',
  'm/index.html',
  'r/native/registry.json',
  'r/native/list-row.json',
  'w/index.html',
  'w/components/index.html',
  'w/dashboard/index.html',
  'w/assistant/index.html',
  'r/web/registry.json',
  'r/web/data-table.json',
  'r/theme/default.json',
  'r/theme/editorial.json',
  'r/font/inter.json',
  'r/font/heading-fraunces.json',
  'r/font/mono-jetbrains-mono.json',
  '_redirects',
  '_headers',
];
const missing = expected.filter((f) => !existsSync(join(docs, 'out', f)));
if (missing.length) {
  console.error(`build-docs: missing from out/: ${missing.join(', ')}`);
  process.exit(1);
}
const kitAssets = readdirSync(join(docs, 'out/m/_expo/static/js/web'));
console.log(`  out/ complete (${expected.length} checked, ${kitAssets.length} kit JS bundles)`);
