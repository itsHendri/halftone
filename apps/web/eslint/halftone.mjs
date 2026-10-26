/**
 * halftone/* — the design system's guardrails as lint rules, so an agent hears about a raw colour or a
 * component that isn't in the registry while it writes, not in review. eslint.config.* turns them on for
 * screens (app/**, components/**), outside the registry sources (components/ui, components/kit); no-alpha-colour
 * reads the registry sources too.
 *
 *   no-raw-colour         Tailwind palette classes (bg-red-500, text-white), colour arbitrary values
 *                         (text-[#fff]) and colour literals in style objects or colour props
 *   no-alpha-colour       a theme colour at partial opacity on a surface, text or border (bg-primary/15,
 *                         text-foreground/60, border-warning/40): its contrast changes with what is behind it.
 *                         Overlays may: the scrim (bg-black/50) and a frosted bar (bg-background/90 + backdrop-blur);
 *                         focus halos are ring-*, which this rule doesn't read
 *   registry-imports      @/components/ui|kit imports must be files the registry lists
 *   no-foreign-ui         other UI and icon libraries
 *   no-raw-primitives     platform primitives a screen should get from the kit (options per app)
 *   disable-needs-reason  a halftone/ disable says why: `// eslint-disable-next-line halftone/x -- reason`
 *
 * SOURCE: apps/mobile/eslint/halftone.mjs. apps/web/eslint/halftone.mjs is a copy (`npm run lint:sync` at the
 * monorepo root); the two kits differ only in the options their eslint config passes.
 */
import { dirname, join, normalize, relative } from 'node:path';

const PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|mauve|olive|mist|taupe';
const UTILITY =
  'bg|text|border(?:-[xytrblse])?|divide|outline|ring(?:-offset)?|fill|stroke|from|via|to|shadow|inset-shadow|inset-ring|drop-shadow|text-shadow|decoration|accent|caret|placeholder';
const PALETTE_CLASS = new RegExp(`^(?:${UTILITY})-(?:(${PALETTE})-(?:50|[1-9]00|950)|(white|black))(?:/\\S+)?$`);
/** The modal scrim and shadow tints: black at an opacity is a shade, not a brand colour. */
const SCRIM = /^(?:bg|shadow)-black\/\d+$/;
/** `utility-[value]` or `[property:value]`, with an optional /opacity. */
const ARBITRARY = /^[\w-]+-\[(.+)\](?:\/\S+)?$|^\[[\w-]+:(.+)\]$/;
const HEX = '#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})';
const FUNCTION = '(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\\((?![^)]*var\\()';
/** A value that is a colour and nothing else (`#fff`, `rgb(0 0 0)`, `white`); `hsl(var(--x))` is a token. */
const COLOUR_VALUE = new RegExp(`^\\s*(?:${HEX}|${FUNCTION}[^)]*\\)|white|black)\\s*$`, 'i');
/** A colour anywhere in a value (`1px solid #ccc`, `0 0 0 1px rgba(…)`). */
const COLOUR_ANYWHERE = new RegExp(`${HEX}\\b|${FUNCTION}`, 'i');
/** Props and style keys whose whole value is a colour. */
const COLOUR_KEY = /^(?:color|colour|fill|stroke|background|tint)$|Colou?r$/;
/** Style keys whose value may hold a colour among other things. */
const COMPOUND_KEY = /^(?:border\w*|boxShadow|textShadow|outline\w*|background\w*|shadow\w*)$/;

const HINTS = {
  red: 'destructive', rose: 'destructive',
  green: 'success', emerald: 'success', lime: 'success',
  amber: 'warning', yellow: 'warning', orange: 'warning',
  blue: 'primary or info', sky: 'info', cyan: 'info', indigo: 'primary',
  slate: 'muted, muted-foreground or border', gray: 'muted, muted-foreground or border', zinc: 'muted, muted-foreground or border',
  neutral: 'muted, muted-foreground or border', stone: 'muted, muted-foreground or border',
  white: 'background or card, or the -foreground of the fill it sits on', black: 'foreground',
};
const hintFor = (family) => HINTS[family] ?? 'primary, accent or a chart-N colour';

/** The class itself, without variants (`dark:hover:`, `[&_svg]:`), important (`!`) or a negative sign. */
function baseClass(token) {
  let depth = 0;
  let cut = -1;
  for (let i = 0; i < token.length; i++) {
    const ch = token[i];
    if (ch === '[') depth++;
    else if (ch === ']') depth--;
    else if (ch === ':' && depth === 0) cut = i;
  }
  return token.slice(cut + 1).replace(/^!|!$/g, '').replace(/^-/, '');
}

/** What is wrong with one class token, or null. */
function classProblem(token) {
  const cls = baseClass(token);
  if (!cls || SCRIM.test(cls)) return null;
  const palette = PALETTE_CLASS.exec(cls);
  if (palette) return { cls, hint: hintFor(palette[1] ?? palette[2]) };
  const arbitrary = ARBITRARY.exec(cls);
  if (arbitrary) {
    const value = (arbitrary[1] ?? arbitrary[2]).replace(/_/g, ' ');
    if (COLOUR_ANYWHERE.test(value) || COLOUR_VALUE.test(value)) return { cls, hint: 'a semantic colour class (bg-primary, text-muted-foreground, border-border)' };
  }
  return null;
}

const isImportSource = (node) =>
  node.parent &&
  ((node.parent.type === 'ImportDeclaration' || node.parent.type === 'ExportNamedDeclaration' || node.parent.type === 'ExportAllDeclaration' || node.parent.type === 'ImportExpression') &&
    node.parent.source === node);

const keyName = (key) => (key?.type === 'Identifier' ? key.name : key?.type === 'Literal' ? String(key.value) : key?.type === 'JSXIdentifier' ? key.name : null);

/** The string a value node holds, if it is a plain string or a template without expressions. */
function staticString(node) {
  if (!node) return null;
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].value.cooked;
  if (node.type === 'JSXExpressionContainer') return staticString(node.expression);
  return null;
}

const noRawColour = {
  meta: {
    type: 'problem',
    docs: { description: 'Colours come from the theme: semantic classes and tokens, never the Tailwind palette or a literal.' },
    messages: {
      paletteClass: '`{{cls}}` is a raw colour. Use a semantic class instead: {{hint}} (DESIGN_SYSTEM.md › Colour).',
      literal: '`{{value}}` is a raw colour. Use a theme colour: a semantic class, or the palette from the kit (usePalette() on mobile, var(--token) on web).',
    },
    schema: [],
  },
  create(context) {
    const checkClasses = (node, text) => {
      for (const token of text.split(/\s+/)) {
        if (!token) continue;
        const problem = classProblem(token);
        if (problem) context.report({ node, messageId: 'paletteClass', data: problem });
      }
    };
    const checkValue = (node, key, value) => {
      if (value == null || key == null) return;
      if ((COLOUR_KEY.test(key) && COLOUR_VALUE.test(value)) || (COMPOUND_KEY.test(key) && COLOUR_ANYWHERE.test(value))) {
        context.report({ node, messageId: 'literal', data: { value: value.trim() } });
      }
    };
    return {
      Literal(node) {
        if (typeof node.value === 'string' && !isImportSource(node)) checkClasses(node, node.value);
      },
      TemplateElement(node) {
        // `bg-${tone}-500` can't be checked; the pieces next to an expression are partial classes.
        const text = node.value.cooked ?? '';
        const tokens = text.split(/\s+/);
        const parent = node.parent;
        const index = parent.quasis.indexOf(node);
        if (index > 0 && !/^\s/.test(text)) tokens.shift();
        if (index < parent.quasis.length - 1 && !/\s$/.test(text)) tokens.pop();
        checkClasses(node, tokens.join(' '));
      },
      Property(node) {
        checkValue(node.value, keyName(node.key), staticString(node.value));
      },
      JSXAttribute(node) {
        checkValue(node.value, keyName(node.name), staticString(node.value));
      },
      VariableDeclarator(node) {
        if (node.id.type === 'Identifier' && /colou?r$/i.test(node.id.name)) {
          const value = staticString(node.init);
          if (value != null && COLOUR_VALUE.test(value)) context.report({ node: node.init, messageId: 'literal', data: { value: value.trim() } });
        }
      },
    };
  },
};

/** A colour class at an opacity: `bg-primary/15`, `border-x-warning/40`, `text-foreground/[0.6]`. */
const ALPHA_CLASS = /^(bg|text|border(?:-[xytrblse])?)-([a-z][a-z0-9-]*)\/(?:\d+|\[[^\]]+\])$/;
/** `text-sm/6` is a size with a line height, not a colour. */
const TEXT_SIZE = /^(?:xs|sm|base|lg|[2-9]?xl|type-[a-z0-9-]+)$/;
const TONES = new Set(['primary', 'success', 'warning', 'destructive', 'info']);

/** The ramp role that replaces `utility-colour/alpha` (DESIGN_SYSTEM.md › Colour). */
function alphaHint(utility, colour) {
  if (utility === 'text') return colour === 'foreground' ? 'text-muted-foreground' : `text-${colour} (opaque), or text-muted-foreground`;
  if (utility.startsWith('border')) return TONES.has(colour) ? `${utility}-${colour}-border` : `${utility}-border or ${utility}-input`;
  if (TONES.has(colour)) return `bg-${colour}-subtle (a tint)${colour === 'primary' ? ', or bg-primary-pressed (pressed)' : ''}`;
  if (colour === 'secondary') return 'bg-secondary-pressed (pressed) or bg-secondary';
  if (colour === 'muted' || colour === 'accent' || colour === 'input') return 'bg-muted-subtle (a step off the page), bg-muted or bg-accent';
  return 'an opaque role (bg-card, bg-muted, bg-foreground)';
}

const noAlphaColour = {
  meta: {
    type: 'problem',
    docs: { description: 'Colours come from the ramps, not from opacity: a see-through colour changes contrast with whatever is behind it.' },
    messages: {
      alpha:
        '`{{cls}}` draws a colour at partial opacity, so its contrast changes with whatever is behind it. Use {{hint}} (DESIGN_SYSTEM.md › Colour). Only overlays are see-through: the scrim (bg-black/50), a frosted bar (bg-background/90 with backdrop-blur), a focus ring\'s halo.',
    },
    schema: [],
  },
  create(context) {
    const checkClasses = (node, text) => {
      const tokens = text.split(/\s+/).filter(Boolean);
      // A frosted bar: the page shows through on purpose, blurred.
      const frosted = tokens.some((t) => /^backdrop-blur/.test(baseClass(t)));
      for (const token of tokens) {
        const cls = baseClass(token);
        const m = ALPHA_CLASS.exec(cls);
        if (!m) continue;
        const [, utility, colour] = m;
        if (utility === 'text' && TEXT_SIZE.test(colour)) continue;
        if (SCRIM.test(cls) || (frosted && utility === 'bg' && colour === 'background')) continue;
        context.report({ node, messageId: 'alpha', data: { cls, hint: alphaHint(utility, colour) } });
      }
    };
    return {
      Literal(node) {
        if (typeof node.value === 'string' && !isImportSource(node)) checkClasses(node, node.value);
      },
      TemplateElement(node) {
        const text = node.value.cooked ?? '';
        const tokens = text.split(/\s+/);
        const parent = node.parent;
        const index = parent.quasis.indexOf(node);
        if (index > 0 && !/^\s/.test(text)) tokens.shift();
        if (index < parent.quasis.length - 1 && !/\s$/.test(text)) tokens.pop();
        checkClasses(node, tokens.join(' '));
      },
    };
  },
};

const registryImports = {
  meta: {
    type: 'problem',
    docs: { description: 'Screens import only components the registry lists.' },
    messages: {
      unregistered:
        '`{{source}}` is not in the registry. Use a component from DESIGN_SYSTEM.md › Component registry, or add one with the add-component skill (after adding, run `npm run registry:build`).',
    },
    schema: [
      {
        type: 'object',
        properties: { root: { type: 'string' }, files: { type: 'array', items: { type: 'string' } } },
        required: ['root', 'files'],
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const { root, files } = context.options[0];
    const registered = new Set(files.map((f) => normalize(f)));
    const known = (rel) => ['', '.tsx', '.ts', '/index.tsx', '/index.ts'].some((ext) => registered.has(normalize(rel + ext)));
    const check = (node, source) => {
      if (typeof source !== 'string') return;
      let rel = null;
      const alias = /^@\/(components\/(?:ui|kit)\/.+)$/.exec(source);
      if (alias) rel = alias[1];
      else if (source.startsWith('./') || source.startsWith('../')) {
        const target = relative(root, join(dirname(context.filename), source));
        if (/^components[/\\](?:ui|kit)[/\\]/.test(target)) rel = target;
      }
      if (rel && !known(rel)) context.report({ node, messageId: 'unregistered', data: { source } });
    };
    return {
      ImportDeclaration: (node) => check(node.source, node.source.value),
      ExportNamedDeclaration: (node) => node.source && check(node.source, node.source.value),
      ExportAllDeclaration: (node) => check(node.source, node.source.value),
      ImportExpression: (node) => node.source.type === 'Literal' && check(node.source, node.source.value),
    };
  },
};

const noForeignUi = {
  meta: {
    type: 'problem',
    docs: { description: 'One component kit: no other UI or icon libraries.' },
    messages: {
      foreign: '`{{source}}` is another UI library. Build from the kit (DESIGN_SYSTEM.md › Component registry); icons are lucide through <Icon>.',
    },
    schema: [
      { type: 'object', properties: { packages: { type: 'array', items: { type: 'string' } } }, required: ['packages'], additionalProperties: false },
    ],
  },
  create(context) {
    const { packages } = context.options[0];
    const banned = (source) => packages.some((p) => source === p || source.startsWith(`${p}/`));
    const check = (node) => {
      if (node && typeof node.value === 'string' && banned(node.value)) context.report({ node, messageId: 'foreign', data: { source: node.value } });
    };
    return {
      ImportDeclaration: (node) => check(node.source),
      ExportNamedDeclaration: (node) => check(node.source),
      ExportAllDeclaration: (node) => check(node.source),
      ImportExpression: (node) => node.source.type === 'Literal' && check(node.source),
    };
  },
};

const noRawPrimitives = {
  meta: {
    type: 'problem',
    docs: { description: 'Screens get text, inputs and touch targets from the kit, not the platform.' },
    messages: { primitive: '{{message}}' },
    schema: [
      {
        type: 'object',
        properties: {
          imports: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                source: { type: 'string' },
                names: { type: 'array', items: { type: 'string' } },
                unlessFileImports: {
                  type: 'object',
                  properties: { source: { type: 'string' }, name: { type: 'string' } },
                  required: ['source', 'name'],
                  additionalProperties: false,
                },
                message: { type: 'string' },
              },
              required: ['source', 'message'],
              additionalProperties: false,
            },
          },
        },
        required: ['imports'],
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const { imports } = context.options[0];
    const seen = [];
    return {
      ImportDeclaration(node) {
        seen.push(node);
      },
      'Program:exit'() {
        const fileImports = (source, name) =>
          seen.some((d) => d.source.value === source && d.specifiers.some((s) => s.type === 'ImportSpecifier' && keyName(s.imported) === name));
        for (const rule of imports) {
          if (rule.unlessFileImports && fileImports(rule.unlessFileImports.source, rule.unlessFileImports.name)) continue;
          for (const decl of seen) {
            if (decl.source.value !== rule.source) continue;
            if (!rule.names) {
              context.report({ node: decl, messageId: 'primitive', data: { message: rule.message } });
              continue;
            }
            for (const spec of decl.specifiers) {
              if (spec.type === 'ImportSpecifier' && rule.names.includes(keyName(spec.imported))) {
                context.report({ node: spec, messageId: 'primitive', data: { message: `${keyName(spec.imported)} from ${rule.source}: ${rule.message}` } });
              }
            }
          }
        }
      },
    };
  },
};

const disableNeedsReason = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Turning a halftone/ rule off says why.' },
    messages: { reason: 'Say why this halftone/ rule is off: `// eslint-disable-next-line {{rules}} -- <reason>`.' },
    schema: [],
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          const directive = /^\s*eslint-disable(?:-next-line|-line)?\s+([^]*)$/.exec(comment.value);
          if (!directive) continue;
          const [rules, reason] = directive[1].split(/\s--\s/);
          if (!/\bhalftone\//.test(rules)) continue;
          if (!reason?.trim()) context.report({ loc: comment.loc, messageId: 'reason', data: { rules: rules.trim() } });
        }
      },
    };
  },
};

const plugin = {
  meta: { name: 'halftone' },
  rules: {
    'no-raw-colour': noRawColour,
    'no-alpha-colour': noAlphaColour,
    'registry-imports': registryImports,
    'no-foreign-ui': noForeignUi,
    'no-raw-primitives': noRawPrimitives,
    'disable-needs-reason': disableNeedsReason,
  },
};

export default plugin;
