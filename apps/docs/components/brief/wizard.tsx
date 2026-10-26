'use client';
/**
 * The brief wizard (/brief): start from a guided brief or a transcript, pick a platform and a theme, then take
 * a BRIEF.md and one prompt to your agent. Everything stays in this browser (lib/brief/store.ts) unless you
 * copy a share link. The questions and the markdown live in lib/brief/model.ts.
 */
import { encodeRecipe } from '@halftone-ds/tokens/theme';
import { CheckIcon, CopyIcon, DownloadIcon, LinkIcon, RotateCcwIcon } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { CopyRow } from '@/components/theme/export-panel';
import {
  asks,
  briefCommand,
  briefMarkdown,
  briefPrompt,
  encodeBrief,
  progress,
  SECTIONS,
  type Brief,
  type Platform,
  type Question,
  type Section,
} from '@/lib/brief/model';
import { resetBrief, setAnswer, startBrief, updateBrief, useBrief, useBriefOrigin } from '@/lib/brief/store';
import { rovingKeyDown, rovingTabIndex } from '@/lib/roving';
import { kitBrand, useBrand } from '@/lib/theme/brand';
import { readThemeCode } from '@/lib/theme/read-code';
import { useLiveTheme } from '@/lib/theme/store';

type Step = { id: string; title: string; section?: Section };

const field =
  'border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50';
const button =
  'focus-visible:ring-ring inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50';

function useOrigin() {
  const [origin, setOrigin] = React.useState('https://halftonedesignsystem.com');
  React.useEffect(() => setOrigin(window.location.origin), []);
  return origin;
}

/** A single choice as a row of options (radio group, arrow keys move and pick). */
function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: { id: T; title: string; body?: string }[];
  onChange: (id: T) => void;
}) {
  const checked = options.findIndex((o) => o.id === value);
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={(e) => rovingKeyDown(e, { select: true })} className="grid gap-2 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
      {options.map((o, i) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          tabIndex={rovingTabIndex(i, checked)}
          onClick={() => onChange(o.id)}
          className={`focus-visible:ring-ring flex flex-col gap-0.5 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 ${
            value === o.id ? 'border-foreground bg-accent' : 'border-border bg-card hover:bg-accent'
          }`}>
          <span className="flex items-center gap-2 text-sm font-medium">
            {o.title}
            {value === o.id ? <CheckIcon className="size-4" aria-hidden /> : null}
          </span>
          {o.body ? <span className="text-muted-foreground text-xs leading-5">{o.body}</span> : null}
        </button>
      ))}
    </div>
  );
}

function QuestionField({ q, brief }: { q: Question; brief: Brief }) {
  const a = brief.answers[q.id] ?? {};
  const id = `brief-${q.id}`;
  const hint = q.hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        {q.kind === 'picks' ? (
          <span id={`${id}-label`} className="text-sm font-medium">
            {q.label}
          </span>
        ) : (
          <label htmlFor={id} className="text-sm font-medium">
            {q.label}
          </label>
        )}
        <label className="text-muted-foreground flex items-center gap-2 text-xs">
          <input type="checkbox" checked={!!a.na} onChange={(e) => setAnswer(q.id, { na: e.target.checked })} className="accent-foreground size-3.5" />
          Does not apply
        </label>
      </div>
      {q.hint ? (
        <p id={hint} className="text-muted-foreground -mt-1 text-xs">
          {q.hint}
        </p>
      ) : null}
      {q.kind === 'picks' ? (
        <div role="group" aria-labelledby={`${id}-label`} className="flex flex-wrap gap-1.5">
          {q.options?.map((o) => {
            const on = a.picks?.includes(o) ?? false;
            return (
              <button
                key={o}
                type="button"
                aria-pressed={on}
                disabled={a.na}
                onClick={() => setAnswer(q.id, { picks: on ? (a.picks ?? []).filter((p) => p !== o) : [...(a.picks ?? []), o] })}
                className={`focus-visible:ring-ring rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 ${
                  on ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}>
                {o}
              </button>
            );
          })}
        </div>
      ) : q.kind === 'text' ? (
        <input id={id} aria-describedby={hint} className={field} value={a.text ?? ''} placeholder={q.placeholder} disabled={a.na} onChange={(e) => setAnswer(q.id, { text: e.target.value })} />
      ) : (
        <textarea
          id={id}
          aria-describedby={hint}
          rows={q.kind === 'list' ? 4 : 3}
          className={field}
          value={a.text ?? ''}
          placeholder={q.placeholder}
          disabled={a.na}
          onChange={(e) => setAnswer(q.id, { text: e.target.value })}
        />
      )}
    </div>
  );
}

function ThemeChoice({ brief }: { brief: Brief }) {
  const { theme, ambient, isCommitted } = useLiveTheme();
  const picked = !ambient && !isCommitted ? theme.code : null;
  const [draft, setDraft] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState<string[]>([]);
  const mode = !brief.theme ? 'default' : brief.theme === picked ? 'site' : 'code';
  const options = [
    { id: 'default' as const, title: 'Kit default', body: 'Apply a theme later, any time.' },
    ...(picked ? [{ id: 'site' as const, title: 'My theme', body: `The one you picked on this site: ${picked}` }] : []),
    { id: 'code' as const, title: 'A theme code', body: brief.theme && mode === 'code' ? brief.theme : 'A Halftone code, or a shadcn preset code.' },
  ];
  const apply = (code: string) => {
    try {
      // A shadcn preset code becomes the nearest Halftone theme: the brief carries that theme's code.
      const read = readThemeCode(code);
      setError(null);
      setNotes(read.notes);
      updateBrief({ theme: encodeRecipe(read.recipe) });
    } catch (err) {
      setNotes([]);
      setError(err instanceof Error ? err.message : 'Not a theme code.');
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <Choice
        label="Theme"
        value={mode}
        options={options}
        onChange={(id) => {
          if (id === 'default') updateBrief({ theme: '' });
          else if (id === 'site' && picked) updateBrief({ theme: picked });
          else document.getElementById('brief-theme-code')?.focus();
        }}
      />
      <form
        className="flex flex-col gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          apply(draft);
        }}>
        <label htmlFor="brief-theme-code" className="text-muted-foreground text-xs font-medium">
          Theme code
        </label>
        <div className="flex gap-2">
          <input
            id="brief-theme-code"
            className={`${field} font-mono`}
            value={draft}
            placeholder="ht2-… or b5owWMfJ8l"
            aria-invalid={!!error}
            aria-describedby={error ? 'brief-theme-error' : undefined}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className={`${button} border-border bg-card hover:bg-accent border`}>
            Use
          </button>
        </div>
        {error ? (
          <p id="brief-theme-error" role="alert" className="text-destructive text-xs">
            {error}
          </p>
        ) : null}
        {notes.length ? (
          <div role="status" className="text-muted-foreground text-xs leading-5">
            <p className="text-foreground font-medium">From a shadcn preset, as {brief.theme}. Not carried over exactly:</p>
            <ul className="list-disc pl-4">
              {notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="text-muted-foreground text-xs">
          No code yet? Make a system in the{' '}
          <Link href="/studio" className="text-foreground underline underline-offset-2">
            Studio
          </Link>
          , then come back: it shows up here as My theme.
        </p>
      </form>
    </div>
  );
}

function StartStep({ brief }: { brief: Brief }) {
  const shared = useBriefOrigin() === 'shared';
  return (
    <div className="flex flex-col gap-8">
      {shared ? (
        <p role="status" className="border-border bg-muted-subtle rounded-lg border px-3 py-2 text-sm">
          This brief came from a shared link. Change anything; it saves in this browser.
        </p>
      ) : null}
      <section className="flex flex-col gap-3" aria-labelledby="brief-start-mode">
        <h2 id="brief-start-mode" className="text-base font-semibold">
          How do you want to start?
        </h2>
        <Choice
          label="How do you want to start?"
          value={brief.mode}
          options={[
            { id: 'guided', title: 'Guided brief', body: 'Eight short sections. About ten minutes.' },
            { id: 'transcript', title: 'A transcript', body: 'Paste a meeting transcript or notes; the agent writes the brief.' },
          ]}
          onChange={(mode) => updateBrief({ mode })}
        />
      </section>
      <section className="flex flex-col gap-3" aria-labelledby="brief-start-platform">
        <h2 id="brief-start-platform" className="text-base font-semibold">
          Phone, web or both?
        </h2>
        <Choice<Platform>
          label="Phone, web or both?"
          value={brief.platform}
          options={[
            { id: 'phone', title: 'Phone', body: 'The mobile kit: Expo and React Native.' },
            { id: 'web', title: 'Web', body: 'The web kit: Next.js and shadcn/ui.' },
            { id: 'both', title: 'Both', body: 'Both kits, on one brand.' },
          ]}
          onChange={(platform) => updateBrief({ platform })}
        />
      </section>
      <section className="flex flex-col gap-3" aria-labelledby="brief-start-theme">
        <h2 id="brief-start-theme" className="text-base font-semibold">
          Theme
        </h2>
        <ThemeChoice brief={brief} />
      </section>
    </div>
  );
}

function TranscriptStep({ brief }: { brief: Brief }) {
  return (
    <div className="flex flex-col gap-6">
      <QuestionField q={SECTIONS[0].questions[0]} brief={brief} />
      <div className="flex flex-col gap-2">
        <label htmlFor="brief-transcript" className="text-sm font-medium">
          Transcript or notes
        </label>
        <p id="brief-transcript-hint" className="text-muted-foreground -mt-1 text-xs">
          Paste the whole conversation. The agent quotes it for any decision that could be argued.
        </p>
        <textarea
          id="brief-transcript"
          aria-describedby="brief-transcript-hint"
          rows={16}
          className={`${field} font-mono text-[13px]`}
          value={brief.transcript}
          onChange={(e) => updateBrief({ transcript: e.target.value })}
        />
      </div>
    </div>
  );
}

function SectionStep({ section, brief }: { section: Section; brief: Brief }) {
  return (
    <div className="flex flex-col gap-6">
      {section.questions
        .filter((q) => asks(q, brief))
        .map((q) => (
          <QuestionField key={q.id} q={q} brief={brief} />
        ))}
    </div>
  );
}

function ActionButton({ label, done, icon: Icon, onClick, primary }: { label: string; done: string; icon: typeof CopyIcon; onClick: () => Promise<void> | void; primary?: boolean }) {
  const [state, setState] = React.useState<'idle' | 'done'>('idle');
  React.useEffect(() => {
    if (state !== 'done') return;
    const t = setTimeout(() => setState('idle'), 1800);
    return () => clearTimeout(t);
  }, [state]);
  return (
    <button
      type="button"
      onClick={async () => {
        await onClick();
        setState('done');
      }}
      className={`${button} ${primary ? 'bg-primary text-primary-foreground hover:opacity-90' : 'border-border bg-card hover:bg-accent border'}`}>
      {state === 'done' ? <CheckIcon className="size-4" aria-hidden /> : <Icon className="size-4" aria-hidden />}
      <span aria-live="polite">{state === 'done' ? done : label}</span>
    </button>
  );
}

function ReviewStep({ brief, goTo }: { brief: Brief; goTo: (id: string) => void }) {
  const origin = useOrigin();
  // A logo in the theme studio (this browser): the brief tells the agent to expect the brand zip.
  const brand = kitBrand(useBrand())?.name ?? null;
  const markdown = briefMarkdown(brief, origin, brand);
  const gaps =
    brief.mode === 'guided'
      ? SECTIONS.map((s) => ({ s, p: progress(s, brief) })).filter(({ p }) => p.done < p.of)
      : brief.transcript.trim()
        ? []
        : null;
  return (
    <div className="flex flex-col gap-8">
      {!brief.platform ? (
        <p role="status" className="border-border bg-muted-subtle rounded-lg border px-3 py-2 text-sm">
          No platform yet: the agent will ask.{' '}
          <button type="button" className="underline underline-offset-2" onClick={() => goTo('start')}>
            Choose phone, web or both
          </button>
          .
        </p>
      ) : null}
      {gaps === null ? (
        <p role="status" className="border-border bg-muted-subtle rounded-lg border px-3 py-2 text-sm">
          The transcript is empty.{' '}
          <button type="button" className="underline underline-offset-2" onClick={() => goTo('transcript')}>
            Paste it
          </button>{' '}
          first.
        </p>
      ) : gaps.length ? (
        <div className="flex flex-col gap-2 text-sm">
          <p>
            Unanswered questions are fine: the agent picks a sensible default and lists it under Open questions. Still open:
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {gaps.map(({ s, p }) => (
              <li key={s.id}>
                <button type="button" onClick={() => goTo(s.id)} className="border-border bg-card hover:bg-accent rounded-full border px-3 py-1 text-xs font-medium">
                  {s.title} · {p.done}/{p.of}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="flex flex-col gap-3" aria-labelledby="brief-handoff">
        <h2 id="brief-handoff" className="text-base font-semibold">
          Hand it to your agent
        </h2>
        <p className="text-muted-foreground text-sm leading-6">
          The prompt carries the whole brief. Your agent sets up the kit, applies the theme, plans the screens with the
          components it will use, and <strong className="text-foreground font-medium">stops for your approval before writing code</strong>.
        </p>
        <div data-theme-bar-avoid className="flex flex-wrap gap-2">
          <ActionButton primary label="Copy prompt" done="Prompt copied" icon={CopyIcon} onClick={() => navigator.clipboard.writeText(briefPrompt(brief, origin, brand))} />
          <ActionButton
            label="Download BRIEF.md"
            done="Downloaded"
            icon={DownloadIcon}
            onClick={() => {
              const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown' }));
              Object.assign(document.createElement('a'), { href: url, download: 'BRIEF.md' }).click();
              URL.revokeObjectURL(url);
            }}
          />
          <ActionButton
            label="Copy share link"
            done="Link copied"
            icon={LinkIcon}
            onClick={async () => navigator.clipboard.writeText(`${origin}/brief/?b=${await encodeBrief(brief)}`)}
          />
        </div>
        <CopyRow label="Or in a terminal, with BRIEF.md saved in an empty folder" value={briefCommand} />
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="brief-preview">
        <h2 id="brief-preview" className="text-base font-semibold">
          BRIEF.md
        </h2>
        <pre tabIndex={0} aria-label="BRIEF.md preview" className="border-border bg-muted-subtle max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-xl border p-4 font-mono text-[13px] leading-6">
          {markdown}
        </pre>
      </section>
    </div>
  );
}

export function BriefWizard() {
  const brief = useBrief();
  const [current, setCurrent] = React.useState('start');
  const top = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    void startBrief();
  }, []);

  const steps: Step[] = [
    { id: 'start', title: 'Start' },
    ...(brief.mode === 'guided' ? SECTIONS.map((s) => ({ id: s.id, title: s.title, section: s })) : [{ id: 'transcript', title: 'Transcript' }]),
    { id: 'review', title: 'Review & hand off' },
  ];
  const index = Math.max(0, steps.findIndex((s) => s.id === current));
  const step = steps[index];
  const goTo = (id: string) => {
    setCurrent(id);
    requestAnimationFrame(() => top.current?.focus());
  };
  const status = (s: Step) => {
    if (s.section) {
      const p = progress(s.section, brief);
      return { label: `${p.done}/${p.of}`, done: p.done === p.of };
    }
    if (s.id === 'start') return { label: '', done: !!brief.platform };
    if (s.id === 'transcript') return { label: '', done: !!brief.transcript.trim() };
    return { label: '', done: false };
  };

  return (
    <div className="mx-auto flex w-full max-w-site flex-col gap-8 px-4 pb-16 pt-10 md:px-6 md:pt-14">
      <header className="flex max-w-2xl flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Start a prototype</h1>
        <p className="text-muted-foreground text-lg leading-8">
          Answer a guided brief or paste a transcript. You get a BRIEF.md and one prompt: your agent sets up the kit, plans the
          screens, and waits for your go-ahead before writing code. Your answers stay in this browser.
        </p>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="Brief steps" className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <ol className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {steps.map((s, i) => {
              const st = status(s);
              return (
                <li key={s.id} className="shrink-0">
                  <button
                    type="button"
                    aria-current={s.id === step.id ? 'step' : undefined}
                    onClick={() => goTo(s.id)}
                    className="text-muted-foreground hover:bg-accent hover:text-foreground aria-[current=step]:bg-accent aria-[current=step]:text-foreground focus-visible:ring-ring flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2">
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] tabular-nums ${st.done ? 'bg-foreground text-background' : 'border-border border'}`}
                      aria-hidden>
                      {st.done ? <CheckIcon className="size-3" /> : i + 1}
                    </span>
                    <span className="whitespace-nowrap">{s.title}</span>
                    {st.label ? <span className="ml-auto pl-2 text-xs tabular-nums">{st.label}</span> : null}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="flex min-w-0 max-w-2xl flex-col gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Step {index + 1} of {steps.length}
            </p>
            <h2 ref={top} tabIndex={-1} className="text-2xl font-semibold tracking-tight focus:outline-none">
              {step.title}
            </h2>
            {step.section ? <p className="text-muted-foreground text-sm leading-6">{step.section.intro}</p> : null}
          </div>

          {step.id === 'start' ? (
            <StartStep brief={brief} />
          ) : step.id === 'transcript' ? (
            <TranscriptStep brief={brief} />
          ) : step.id === 'review' ? (
            <ReviewStep brief={brief} goTo={goTo} />
          ) : step.section ? (
            <SectionStep section={step.section} brief={brief} />
          ) : null}

          <div data-theme-bar-avoid className="border-border flex items-center gap-2 border-t pt-5">
            {index > 0 ? (
              <button type="button" onClick={() => goTo(steps[index - 1].id)} className={`${button} border-border bg-card hover:bg-accent border`}>
                Back
              </button>
            ) : null}
            {index < steps.length - 1 ? (
              <button type="button" onClick={() => goTo(steps[index + 1].id)} className={`${button} bg-foreground text-background hover:opacity-90 ml-auto`}>
                {index === steps.length - 2 ? 'Review' : 'Next'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Clear every answer and start again?')) {
                    resetBrief();
                    goTo('start');
                  }
                }}
                className={`${button} text-muted-foreground hover:bg-accent hover:text-foreground ml-auto`}>
                <RotateCcwIcon className="size-4" aria-hidden />
                Start over
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
