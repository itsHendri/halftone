/**
 * The Code tab on a component page (design/navigation-wireframes.md › Round two): each kit's demo source, by
 * registry id, read from the kits' demo files with the TypeScript parser. A demo is a `<NAME>_DEMOS` (or `DEMOS`)
 * record's entry: an arrow function (its JSX is shown) or a function named there (the whole function is shown).
 * Anything else is left out, and the page falls back to the API snippet.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

/** Strip the common indent and the outer parentheses of a `() => ( … )` body. */
function tidy(text) {
  const lines = text.replace(/^\s*\(\s*\n/, '').replace(/\n\s*\)\s*$/, '').split('\n');
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(Math.min(indent, l.match(/^ */)[0].length))).join('\n').trim();
}

/** Text of a node as written, with the indent of its first line restored, so `tidy` can dedent it. */
function source(sf, node) {
  const start = node.getStart(sf);
  const lineStart = sf.text.lastIndexOf('\n', start - 1) + 1;
  return ' '.repeat(start - lineStart) + sf.text.slice(start, node.end);
}

function demosIn(file) {
  const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const functions = new Map();
  const records = [];
  for (const st of sf.statements) {
    if (ts.isFunctionDeclaration(st) && st.name) functions.set(st.name.text, st);
    if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        if (!ts.isIdentifier(d.name)) continue;
        if (/DEMOS$/.test(d.name.text) && d.initializer && ts.isObjectLiteralExpression(d.initializer)) records.push(d.initializer);
        else if (d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer))) functions.set(d.name.text, st);
      }
    }
  }
  const out = {};
  for (const rec of records) {
    for (const p of rec.properties) {
      if (!ts.isPropertyAssignment(p)) continue;
      const id = ts.isStringLiteral(p.name) || ts.isIdentifier(p.name) ? p.name.text : null;
      if (!id) continue;
      const v = p.initializer;
      if (ts.isArrowFunction(v)) {
        const body = v.body;
        // A block body is a small component of its own: show the whole function.
        out[id] = tidy(ts.isBlock(body) ? source(sf, v) : source(sf, body));
      } else if (ts.isIdentifier(v) && functions.has(v.text)) {
        out[id] = tidy(source(sf, functions.get(v.text)));
      }
    }
  }
  return out;
}

/** `{ native: { id: code }, web: { id: code } }` for every demo found. */
export function demoSources(appsDir) {
  const mobile = join(appsDir, 'mobile/components/devkit/sections');
  const web = join(appsDir, 'web/components/devkit');
  const native = Object.assign({}, ...readdirSync(mobile).filter((f) => f.endsWith('.tsx')).map((f) => demosIn(join(mobile, f))));
  const webDemos = Object.assign({}, ...['demos-native-twins.tsx', 'demos-controls.tsx', 'demos.tsx'].map((f) => demosIn(join(web, f))));
  return { native, web: webDemos };
}
