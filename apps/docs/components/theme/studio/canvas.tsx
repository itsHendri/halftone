"use client";
import { SlidersHorizontalIcon } from "lucide-react";
import * as React from "react";
import { BrowserFrame } from "@/components/browser-frame";
import { PhoneFrame } from "@/components/phone-frame";
import { fontLabel } from "@/components/theme/studio/parts";
import { useInvertedScheme } from "@/components/theme/studio/rail";
import {
  FontFaces,
  IconGrid,
  PaletteSpecimen,
  ProseSample,
  ShapeSpecimen,
  TypeScale,
} from "@/components/theme/specimen";
import { presetLabel } from "@/components/theme/theme-pill";
import { rovingKeyDown, rovingTabIndex } from "@/lib/roving";
import { useLiveTheme } from "@/lib/theme/store";

export const VIEWS = [
  { id: "overview", label: "Overview" },
  { id: "mobile", label: "Mobile" },
  { id: "web", label: "Web" },
  { id: "typeset", label: "Typeset" },
] as const;
export type View = (typeof VIEWS)[number]["id"];

const PHONE_SCREENS = [
  { path: "/shop", label: "Shop" },
  { path: "/habits", label: "Habits" },
  { path: "/components?open=actions", label: "Buttons" },
  { path: "/components?open=inputs", label: "Inputs" },
  { path: "/foundations?open=type", label: "Type" },
];
const WEB_SCREENS = [
  { path: "/showcase", label: "Components" },
  { path: "/dashboard", label: "Dashboard" },
  { path: "/landing", label: "Landing" },
  { path: "/assistant", label: "Assistant" },
];
const FIXTURES = [
  { id: "article", label: "Article" },
  { id: "docs", label: "Docs" },
  { id: "changelog", label: "Changelog" },
  { id: "notes", label: "Notes" },
];

/** A row of chips that picks one (a radio group). */
function Chips({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={(e) => rovingKeyDown(e, { select: true })}
      className="bg-card border-border inline-flex flex-wrap gap-0.5 rounded-full border p-0.5"
    >
      {options.map((o, i) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          tabIndex={rovingTabIndex(
            i,
            options.findIndex((x) => x.id === value),
          )}
          onClick={() => onChange(o.id)}
          className={`focus-visible:ring-ring rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 ${
            value === o.id
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Panel({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`border-border bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-5 shadow-sm ${className ?? ""}`}
    >
      {title ? (
        <h2 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

/**
 * Rendered by this site, so it changes the moment a control does (no frame to reload). `kit-scope`: the
 * specimens take the whole theme (fonts, radius, depth…) while the page around them keeps its own.
 */
function Overview() {
  const { recipe, theme } = useLiveTheme();
  return (
    <div className="kit-scope columns-1 gap-4 md:columns-2 2xl:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
      <Panel>
        <p className="font-heading text-3xl font-semibold tracking-tight">
          {presetLabel(recipe)} · {fontLabel(recipe.font.heading)}
        </p>
        <p className="text-muted-foreground leading-7">
          One theme code, two kits. Every screen an agent builds, on a phone
          or in a browser, takes its colour, type, shape and depth from what
          you set here.
        </p>
        <p className="text-muted-foreground font-mono text-xs">{theme.code}</p>
      </Panel>
      <Panel title="Colour">
        <PaletteSpecimen />
      </Panel>
      <Panel title="Faces">
        <FontFaces />
      </Panel>
      <Panel title="Type scale">
        <TypeScale />
      </Panel>
      <Panel title="Long-form text">
        <ProseSample />
      </Panel>
      <Panel title="Icons">
        <IconGrid />
      </Panel>
      <Panel title="Radius and depth">
        <ShapeSpecimen />
      </Panel>
      <Panel title="Controls">
        <div className="flex flex-wrap gap-2">
          <span className="bg-primary text-primary-foreground inline-flex h-9 items-center rounded-md px-4 text-sm font-medium shadow-sm">
            Primary
          </span>
          <span className="bg-secondary text-secondary-foreground inline-flex h-9 items-center rounded-md px-4 text-sm font-medium">
            Secondary
          </span>
          <span className="border-border inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium">
            Outline
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`bg-primary text-primary-foreground inline-flex h-10 items-center px-5 text-sm font-medium ${recipe.controls === "pill" ? "rounded-full" : "rounded-md"}`}
          >
            Mobile button
          </span>
          <span className="bg-success text-success-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
            Paid
          </span>
          <span className="bg-destructive text-destructive-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
            Overdue
          </span>
        </div>
        <div className="border-border bg-background text-muted-foreground flex h-9 items-center rounded-md border px-3 text-sm">
          billing@northwind.co
        </div>
      </Panel>
    </div>
  );
}

function MobileView() {
  const [screen, setScreen] = React.useState(PHONE_SCREENS[0].path);
  return (
    <div className="flex flex-col items-center gap-4">
      <Chips
        label="Mobile screen"
        value={screen}
        options={PHONE_SCREENS.map((s) => ({ id: s.path, label: s.label }))}
        onChange={setScreen}
      />
      <div className="flex flex-wrap items-start justify-center gap-8">
        <PhoneFrame
          key={screen}
          path={screen}
          title="Native kit, live"
          width={320}
        />
        <PhoneFrame
          path="/components?open=inputs"
          title="Native kit inputs, live"
          width={320}
          className="max-xl:hidden"
        />
      </div>
    </div>
  );
}

function WebView() {
  const [page, setPage] = React.useState(WEB_SCREENS[0].path);
  return (
    <div className="flex flex-col items-center gap-4">
      <Chips
        label="Web page"
        value={page}
        options={WEB_SCREENS.map((s) => ({ id: s.path, label: s.label }))}
        onChange={setPage}
      />
      <BrowserFrame
        key={page}
        path={page}
        title="Web kit, live"
        className="max-w-6xl"
      />
    </div>
  );
}

function TypesetView() {
  const [fixture, setFixture] = React.useState(FIXTURES[0].id);
  return (
    <div className="flex flex-col items-center gap-4">
      <Chips
        label="Sample text"
        value={fixture}
        options={FIXTURES}
        onChange={setFixture}
      />
      <div className="flex w-full items-start justify-center gap-8">
        <BrowserFrame
          key={fixture}
          path={`/showcase/typeset?fixture=${fixture}`}
          address="/showcase/typeset"
          title="Typeset with components, web kit, live"
          viewport={{ width: 1280, height: 900 }}
          className="min-w-0 max-w-5xl flex-1"
        />
        <PhoneFrame
          path="/components?section=prose"
          title="Prose in the native kit, live"
          width={280}
          className="max-2xl:hidden"
        />
      </div>
    </div>
  );
}

/** The floating 01–04 page switcher, in the rail's (inverted) scheme. */
export function ViewSwitcher({
  view,
  onChange,
  controls,
  onControls,
}: {
  view: View;
  onChange: (v: View) => void;
  controls: boolean;
  onControls: () => void;
}) {
  const scheme = useInvertedScheme();
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = VIEWS.findIndex((v) => v.id === view);
    const next =
      VIEWS[
        (i + (e.key === "ArrowRight" ? 1 : VIEWS.length - 1)) % VIEWS.length
      ];
    onChange(next.id);
    (
      e.currentTarget.querySelector(
        `[data-view="${next.id}"]`,
      ) as HTMLElement | null
    )?.focus();
  };
  return (
    <div
      className={`${scheme} bg-card text-card-foreground border-border flex items-center gap-0.5 rounded-xl border p-1 shadow-xl`}
      style={{ colorScheme: scheme.startsWith("kit-dark") ? "dark" : "light" }}
    >
      <button
        type="button"
        onClick={onControls}
        aria-expanded={controls}
        aria-controls="studio-controls"
        className={`focus-visible:ring-ring flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 lg:hidden ${
          controls ? "bg-primary text-primary-foreground" : "text-foreground"
        }`}
      >
        <SlidersHorizontalIcon className="size-3.5" aria-hidden />
        Theme
      </button>
      <div
        role="tablist"
        aria-label="Preview"
        onKeyDown={onKey}
        className="flex gap-0.5"
      >
        {VIEWS.map((v, i) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            data-view={v.id}
            aria-selected={view === v.id}
            tabIndex={view === v.id ? 0 : -1}
            onClick={() => onChange(v.id)}
            className={`focus-visible:ring-ring flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 ${
              view === v.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="font-mono max-sm:hidden">0{i + 1}</span>
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Canvas({ view }: { view: View }) {
  return (
    <div role="tabpanel" aria-label={VIEWS.find((v) => v.id === view)?.label}>
      {view === "overview" ? (
        <Overview />
      ) : view === "mobile" ? (
        <MobileView />
      ) : view === "web" ? (
        <WebView />
      ) : (
        <TypesetView />
      )}
    </div>
  );
}
