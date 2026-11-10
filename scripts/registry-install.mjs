/**
 * What the two syncs share (vite-sync.mjs for apps/vite, docs-sync.mjs for the docs site's Controls): serve the web
 * kit's built registry on a local port, run the shadcn CLI, and compare what it wrote and the npm ranges it declared.
 */
import { spawn } from 'node:child_process';
import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
/** `npm run registry:dist -w apps/web` writes it. */
export const dist = join(root, 'apps/web/dist/r/web');

export function requireDist(name) {
  if (!existsSync(join(dist, 'registry.json'))) {
    console.error(`${name}: run \`npm run registry:dist -w apps/web\` first.`);
    process.exit(1);
  }
}

/** Serves dist/r/web; resolves to the server and the `{name}.json` URL to put in a components.json. */
export async function serveRegistry() {
  const server = createServer((req, res) => {
    const file = join(dist, decodeURIComponent(req.url.split('?')[0]));
    if (file.startsWith(dist) && existsSync(file) && statSync(file).isFile()) {
      res.writeHead(200, { 'content-type': 'application/json' });
      createReadStream(file).pipe(res);
    } else res.writeHead(404).end();
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, url: `http://127.0.0.1:${server.address().port}/{name}.json` };
}

export function sh(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, CI: '1' } });
    let out = '';
    child.stdout.on('data', (c) => (out += c));
    child.stderr.on('data', (c) => (out += c));
    child.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}\n${out.slice(-4000)}`))));
  });
}

/** Every file under `base/dir`, as paths relative to `base`. */
export function filesUnder(base, dir, found = []) {
  const full = join(base, dir);
  if (!existsSync(full)) return found;
  for (const name of readdirSync(full)) {
    const rel = posix.join(dir, name);
    if (statSync(join(base, rel)).isDirectory()) filesUnder(base, rel, found);
    else found.push(rel);
  }
  return found;
}

/** Every npm range the kit's registry declares, by package (`cn@^0.5.2` in an item's dependencies). */
export function declaredRanges() {
  const ranges = new Map();
  for (const f of readdirSync(dist).filter((f) => f.endsWith('.json') && f !== 'registry.json')) {
    for (const dep of JSON.parse(readFileSync(join(dist, f), 'utf8')).dependencies ?? []) {
      const at = dep.lastIndexOf('@');
      if (at > 0) ranges.set(dep.slice(0, at), dep.slice(at + 1));
    }
  }
  return ranges;
}

/** Whether an app's caret range sits inside the registry's: the same major (minor, under 1.0), and no lower. */
export function within(have, want) {
  if (!have) return false;
  if (have === want) return true;
  const parse = (r) => /^\^(\d+)\.(\d+)\.(\d+)$/.exec(r)?.slice(1).map(Number);
  const [h, w] = [parse(have), parse(want)];
  if (!h || !w) return false;
  const bucket = (v) => (v[0] > 0 ? `${v[0]}` : `0.${v[1]}`);
  const atLeast = h[0] - w[0] || h[1] - w[1] || h[2] - w[2];
  return bucket(h) === bucket(w) && atLeast >= 0;
}
