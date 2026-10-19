/**
 * The brief wizard's model (app/(home)/brief): the questions, the answers, and what they become — a BRIEF.md
 * an agent plans from, and one prompt that sets up the kit, applies a theme and runs transcript-to-prototype
 * in planning mode (it stops for approval before any code).
 *
 * The guided sections mirror the kits' brief template
 * (apps/*\/.claude/skills/transcript-to-prototype/BRIEF.template.md): change them together.
 */
import kitJson from '../../../../kit.json';

export type Platform = 'phone' | 'web' | 'both';
export type Mode = 'guided' | 'transcript';

/** One answer: free text, picks from a list, or "does not apply". */
export type Answer = { text?: string; picks?: string[]; na?: boolean };

export type Brief = {
  v: 1;
  mode: Mode;
  platform: Platform | null;
  /** A theme code (ht1-…, ht2-…), or '' for the kit's default theme. */
  theme: string;
  transcript: string;
  answers: Record<string, Answer>;
};

export const EMPTY_BRIEF: Brief = { v: 1, mode: 'guided', platform: null, theme: '', transcript: '', answers: {} };

export type Question = {
  id: string;
  label: string;
  hint?: string;
  /** text: one line · long: a paragraph · list: one item per line · picks: choose from `options`. */
  kind: 'text' | 'long' | 'list' | 'picks';
  options?: string[];
  placeholder?: string;
  /** Only asked for these platforms. */
  only?: Platform[];
  /** Only asked when another answer includes this pick. */
  after?: { id: string; pick: string };
};

export type Section = { id: string; title: string; intro: string; questions: Question[] };

export const SECTIONS: Section[] = [
  {
    id: 'product',
    title: 'Product',
    intro: 'What it is, in a sentence or two. Concrete beats clever: the agent copies your words into the screens.',
    questions: [
      { id: 'name', label: 'What is it called?', kind: 'text', placeholder: 'Northwind Invoices' },
      { id: 'concept', label: 'Who is it for, and what does it do?', hint: 'One or two sentences.', kind: 'long', placeholder: 'Freelance designers send invoices from their phone and see who has paid.' },
      { id: 'problem', label: 'What problem does it solve for them?', kind: 'long', placeholder: 'Chasing late payments takes an afternoon a month.' },
    ],
  },
  {
    id: 'users',
    title: 'Users & jobs',
    intro: 'Who uses it and what they come to do. The jobs decide the screens.',
    questions: [
      { id: 'who', label: 'Who uses it?', hint: 'The main person first, then anyone else (an admin, a client).', kind: 'long' },
      { id: 'jobs', label: 'What do they need to get done?', hint: 'One job per line, in their words.', kind: 'list', placeholder: 'Send an invoice in under a minute\nSee who is late at a glance' },
    ],
  },
  {
    id: 'shape',
    title: 'Screens & navigation',
    intro: 'A first version: four to eight screens on a phone, three to six pages on the web.',
    questions: [
      { id: 'kind', label: 'What kind of web product?', kind: 'picks', options: ['App (signed in)', 'Marketing page', 'AI product'], only: ['web', 'both'] },
      { id: 'screens', label: 'Which screens or pages?', hint: 'One per line: the name, then what it is for.', kind: 'list', placeholder: 'Home: what is due and what is late\nNew invoice: client, items, send' },
      { id: 'nav', label: 'How do people move around?', hint: 'Tabs, a sidebar, a single long page…', kind: 'long' },
    ],
  },
  {
    id: 'flows',
    title: 'Key flows',
    intro: 'The tasks that take more than one step. The agent builds these end to end.',
    questions: [
      { id: 'flows', label: 'Which tasks take several steps?', hint: 'One flow per line, as steps.', kind: 'list', placeholder: 'Create invoice → add items → review → send → done' },
      { id: 'ai', label: 'What may the assistant do on its own, and what needs approval?', kind: 'long', only: ['web', 'both'], after: { id: 'kind', pick: 'AI product' } },
    ],
  },
  {
    id: 'data',
    title: 'Data',
    intro: 'What the screens show. The prototype uses realistic mock data, never a real API.',
    questions: [
      { id: 'entities', label: 'What things does it show?', hint: 'One per line, with a few example values.', kind: 'list', placeholder: 'Invoice: number, client, amount, due date, status\nClient: name, email, open balance' },
    ],
  },
  {
    id: 'voice',
    title: 'Voice & tone',
    intro: 'How the copy sounds. Pick up to three.',
    questions: [
      { id: 'tone', label: 'Tone', kind: 'picks', options: ['Plain', 'Warm', 'Expert', 'Calm', 'Playful', 'Bold', 'Formal', 'Friendly'] },
      { id: 'words', label: 'Words to use, or to avoid', kind: 'long', placeholder: 'Say "client", never "customer".' },
    ],
  },
  {
    id: 'proof',
    title: 'Proof & constraints',
    intro: 'What makes it credible, and what it must respect. Only real proof: the agent will not invent any.',
    questions: [
      { id: 'proof', label: 'What makes it credible?', hint: 'Numbers, customers, reviews. Real ones only.', kind: 'long' },
      { id: 'constraints', label: 'Constraints', hint: 'Must-haves, accessibility, brand rules, devices.', kind: 'long' },
    ],
  },
  {
    id: 'scope',
    title: 'Not in v1',
    intro: 'What waits, and what you already know is undecided.',
    questions: [
      { id: 'later', label: 'What was mentioned but should wait?', hint: 'One per line.', kind: 'list' },
      { id: 'open', label: 'Open questions you already know about', hint: 'One per line.', kind: 'list' },
    ],
  },
];

export const asks = (q: Question, brief: Brief) =>
  (!q.only || (brief.platform !== null && q.only.includes(brief.platform))) &&
  (!q.after || !!brief.answers[q.after.id]?.picks?.includes(q.after.pick));

/** Whether a question has an answer (text, a pick, or "does not apply"). */
export const answered = (a: Answer | undefined) => !!a && (a.na || !!a.text?.trim() || !!a.picks?.length);

/** Answered / asked, for one section. */
export function progress(section: Section, brief: Brief) {
  const qs = section.questions.filter((q) => asks(q, brief));
  return { done: qs.filter((q) => answered(brief.answers[q.id])).length, of: qs.length };
}

const PLATFORM_LABEL: Record<Platform, string> = {
  phone: 'Phone: the mobile kit (Expo)',
  web: 'Web: the web kit (Next.js)',
  both: 'Phone and web: both kits, on one brand',
};

/** install.md's path for a platform: A (mobile), B (web), E (the monorepo, both kits on one brand). */
const INSTALL_PATH: Record<Platform, string> = { phone: 'A', web: 'B', both: 'E' };

function answerMd(q: Question, a: Answer) {
  if (a.na) return '_Does not apply._';
  if (q.kind === 'picks') return (a.picks ?? []).join(', ');
  const text = a.text?.trim() ?? '';
  if (q.kind !== 'list') return text;
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `- ${l.replace(/^[-*•]\s*/, '')}`)
    .join('\n');
}

const BRAND_ZIP = { phone: 'brand-mobile.zip', web: 'brand-web.zip', both: 'brand.zip' } as const;

/**
 * The brief as markdown: the answers, then what the agent does with them. `brand` is the product name when the
 * person has a logo in the theme studio (it travels as a zip, not in the brief).
 */
export function briefMarkdown(brief: Brief, origin: string, brand?: string | null) {
  const name = brief.answers.name?.text?.trim() || 'Untitled prototype';
  const platform = brief.platform ?? 'phone';
  const lines: string[] = [
    `# Brief: ${name}`,
    '',
    `> Made with the ${kitJson.name} brief wizard (${origin}/brief/). For the agent: follow "How to use this brief" at the end.`,
    '',
    `- **Platform:** ${brief.platform ? PLATFORM_LABEL[brief.platform] : '_Not chosen: ask before setting anything up._'}`,
    `- **Theme:** ${brief.theme ? `\`${brief.theme}\` (apply it before building)` : 'the kit default'}`,
    ...(brand ? [`- **Brand assets:** the ${brand} logo, app icon and favicons, as \`${BRAND_ZIP[platform]}\` from the theme studio`] : []),
    '',
  ];
  if (brief.mode === 'transcript') {
    lines.push('## Transcript', '', brief.transcript.trim() ? ['```text', brief.transcript.trim(), '```'].join('\n') : '_Empty._', '');
  } else {
    // Answered questions under their section; the rest gathered once at the end, so the brief reads as answers.
    const open: string[] = [];
    for (const section of SECTIONS) {
      const qs = section.questions.filter((q) => asks(q, brief));
      const done = qs.filter((q) => answered(brief.answers[q.id]));
      for (const q of qs) if (!answered(brief.answers[q.id])) open.push(`- ${section.title}: ${q.label}`);
      if (!done.length) continue;
      lines.push(`## ${section.title}`, '');
      for (const q of done) lines.push(`**${q.label}**`, '', answerMd(q, brief.answers[q.id]), '');
    }
    if (open.length) {
      lines.push(
        '## Not answered',
        '',
        'Choose a sensible default for each (the most conventional pattern for the platform) and list it under Open questions.',
        '',
        ...open,
        ''
      );
    }
  }
  const kits = platform === 'both' ? 'in each kit (`apps/mobile` and `apps/web`)' : 'in the kit';
  lines.push(
    '## How to use this brief',
    '',
    `1. **Set up.** Read ${origin}/install.md and take path ${INSTALL_PATH[platform]}${platform === 'both' ? ' (both kits, one brand)' : ''}. Then read AGENTS.md and DESIGN_SYSTEM.md.`,
    brief.theme
      ? `2. **Theme.** Apply \`${brief.theme}\` with the apply-theme skill: \`npx halftone-tokens theme apply ${brief.theme}\`${platform === 'both' ? ` (in the monorepo: \`npm run theme:apply -- ${brief.theme}\` at the root, which themes both kits)` : ''}.` +
        (brand
          ? ` Then unzip \`${BRAND_ZIP[platform]}\` at the ${platform === 'both' ? 'monorepo' : 'kit'} root and follow the skill's "Brand assets" steps (ask the person for the zip if it isn't here).`
          : '')
      : '2. **Theme.** Keep the kit default; the person can apply a theme code later.' +
        (brand
          ? ` Then unzip \`${BRAND_ZIP[platform]}\` at the ${platform === 'both' ? 'monorepo' : 'kit'} root and follow the apply-theme skill's "Brand assets" steps (ask the person for the zip if it isn't here).`
          : ''),
    `3. **Plan, then stop.** Run the transcript-to-prototype skill ${kits} with this brief. Write the kit's BRIEF.md from its template, keeping these answers in the person's words. "Does not apply" means leave it out; never invent proof, numbers or quotes. List every screen or page with the registry components it uses, and the open questions. **Then stop and wait for approval before writing any code.**`,
    '4. **Build after approval,** only from registry components, then run the qc-pass skill and hand over as the skill says.',
    ''
  );
  return lines.join('\n');
}

/** The prompt to paste into an agent: the brief itself, with its instructions. */
export const briefPrompt = (brief: Brief, origin: string, brand?: string | null) =>
  `I'm starting a prototype with ${kitJson.name}. Here is my brief. Follow its "How to use this brief" section: plan first, and wait for my approval before writing code.\n\n${briefMarkdown(brief, origin, brand)}`;

/** For a terminal: the brief saved as BRIEF.md in an empty folder. */
export const briefCommand = `claude "Read BRIEF.md and follow its 'How to use this brief' section. Plan first and wait for my approval before writing code."`;

// ---- share links: /brief/?b=<base64url(deflate(json))> -------------------------------------------------

const toBase64Url = (bytes: Uint8Array) => {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromBase64Url = (text: string) => {
  const s = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
};
async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function encodeBrief(brief: Brief) {
  return toBase64Url(await pipe(new TextEncoder().encode(JSON.stringify(brief)), new CompressionStream('deflate-raw')));
}

/** A shared brief, or null when the code is not one. */
export async function decodeBrief(code: string): Promise<Brief | null> {
  try {
    const json = JSON.parse(new TextDecoder().decode(await pipe(fromBase64Url(code), new DecompressionStream('deflate-raw'))));
    return normalizeBrief(json);
  } catch {
    return null;
  }
}

/** Anything read back (storage, a link) as a well-formed brief. */
export function normalizeBrief(input: unknown): Brief | null {
  if (!input || typeof input !== 'object') return null;
  const b = input as Partial<Brief>;
  if (b.v !== 1) return null;
  const answers: Record<string, Answer> = {};
  for (const [id, a] of Object.entries(b.answers ?? {})) {
    if (!a || typeof a !== 'object') continue;
    answers[id] = {
      ...(typeof a.text === 'string' ? { text: a.text.slice(0, 20_000) } : {}),
      ...(Array.isArray(a.picks) ? { picks: a.picks.filter((p): p is string => typeof p === 'string').slice(0, 20) } : {}),
      ...(a.na ? { na: true } : {}),
    };
  }
  return {
    v: 1,
    mode: b.mode === 'transcript' ? 'transcript' : 'guided',
    platform: b.platform === 'phone' || b.platform === 'web' || b.platform === 'both' ? b.platform : null,
    theme: typeof b.theme === 'string' && /^ht\d-[0-9A-Z]+$/i.test(b.theme) ? b.theme : '',
    transcript: typeof b.transcript === 'string' ? b.transcript.slice(0, 200_000) : '',
    answers,
  };
}
