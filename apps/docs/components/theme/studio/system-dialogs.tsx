'use client';
import { PRESETS } from '@halftone-ds/tokens/theme';
import * as React from 'react';
import { destructiveButton, Dialog, outlineButton, primaryButton } from '@/components/theme/studio/dialog';
import { PresetCard } from '@/components/theme/studio/parts';
import { removeSystem, type StudioDialog } from '@/components/theme/studio/systems-menu';
import { toast } from '@/components/theme/studio/toast';
import { rovingKeyDown, rovingTabIndex } from '@/lib/roving';
import { createNewSystem, readImport, renameSystem, useSystems, type HalftoneSystem } from '@/lib/studio/systems';

type Mode = 'preset' | 'copy' | 'import';

const fieldClass =
  'border-border bg-background focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2';

/**
 * New system (wireframe 3): a name, then a preset (Default is the blank), a copy of the system on screen, or an import
 * (a `.halftone.json`, an `ht-` code or a shadcn preset code). There is no empty system.
 */
function NewSystem({ start, onClose }: { start: 'preset' | 'import'; onClose: () => void }) {
  const s = useSystems();
  const [mode, setMode] = React.useState<Mode>(start);
  const [preset, setPreset] = React.useState(PRESETS[0].id);
  const [name, setName] = React.useState<string | null>(null);
  const [code, setCode] = React.useState('');
  const [imported, setImported] = React.useState<{ doc: HalftoneSystem; notes: string[] } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const nameId = React.useId();
  const codeId = React.useId();
  const fileId = React.useId();

  const suggested =
    mode === 'preset' ? (PRESETS.find((p) => p.id === preset)?.name ?? '') : mode === 'copy' ? `Copy of ${s.doc.name}` : (imported?.doc.name ?? '');
  const shown = name ?? suggested;

  const read = (text: string) => {
    if (!text.trim()) {
      setImported(null);
      setError(null);
      return;
    }
    try {
      setImported(readImport(text));
      setError(null);
    } catch (e) {
      setImported(null);
      setError(e instanceof Error ? e.message : 'That couldn’t be read.');
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'import' && !imported) return;
    const doc = createNewSystem(
      shown,
      mode === 'preset' ? { kind: 'preset', preset } : mode === 'copy' ? { kind: 'copy' } : { kind: 'import', doc: imported!.doc }
    );
    toast(`Made “${doc.name}”.`);
    onClose();
  };

  const modes: { id: Mode; label: string }[] = [
    { id: 'preset', label: 'Preset' },
    { id: 'copy', label: `Copy of ${s.doc.name}` },
    { id: 'import', label: 'Import' },
  ];

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={nameId} className="text-sm font-medium">
          Name
        </label>
        <input id={nameId} className={fieldClass} value={shown} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="off" required data-autofocus />
      </div>
      <div role="radiogroup" aria-label="Start from" onKeyDown={(e) => rovingKeyDown(e, { select: true })} className="flex flex-wrap gap-1.5">
        {modes.map((m, i) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={mode === m.id}
            tabIndex={rovingTabIndex(i, modes.findIndex((x) => x.id === mode))}
            onClick={() => setMode(m.id)}
            className={`focus-visible:ring-ring max-w-full truncate rounded-full border px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 ${
              mode === m.id ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-accent'
            }`}>
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'preset' ? (
        <div role="radiogroup" aria-label="Preset" onKeyDown={(e) => rovingKeyDown(e, { select: true })} className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {PRESETS.map((p, i) => (
            <PresetCard
              key={p.id}
              name={p.name}
              recipe={p.recipe}
              selected={preset === p.id}
              tabIndex={rovingTabIndex(i, PRESETS.findIndex((x) => x.id === preset))}
              onPick={() => setPreset(p.id)}
            />
          ))}
        </div>
      ) : mode === 'copy' ? (
        <p className="text-muted-foreground text-sm">Everything in {s.shared ? 'the shared system' : `“${s.doc.name}”`}, logo included, as a new system you can change on its own.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={codeId} className="text-sm font-medium">
              A code or the JSON
            </label>
            <textarea
              id={codeId}
              className={`${fieldClass} min-h-20 font-mono text-xs`}
              placeholder="ht3-… or a shadcn preset code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                read(e.target.value);
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={fileId} className="text-sm font-medium">
              Or a file
            </label>
            <input
              id={fileId}
              type="file"
              accept=".json,application/json"
              className="file:border-border file:bg-background hover:file:bg-accent text-sm file:mr-3 file:rounded-full file:border file:px-3 file:py-1 file:text-sm"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setCode('');
                read(await file.text());
              }}
            />
          </div>
          {error ? (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          ) : imported ? (
            <div className="text-muted-foreground text-sm" role="status">
              <p>
                Ready: <span className="text-foreground font-medium">{imported.doc.name}</span>
                {imported.doc.brand.logo ? ', with its logo' : ''}.
              </p>
              {imported.notes.length ? (
                <ul className="mt-1 list-disc pl-4 text-xs">
                  {imported.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" className={outlineButton} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className={primaryButton} disabled={mode === 'import' && !imported}>
          Create system
        </button>
      </div>
    </form>
  );
}

function Rename({ doc, onClose }: { doc: HalftoneSystem; onClose: () => void }) {
  const [name, setName] = React.useState(doc.name);
  const id = React.useId();
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        renameSystem(doc.id, name);
        onClose();
      }}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium">
          Name
        </label>
        <input id={id} className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="off" required data-autofocus />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className={outlineButton} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className={primaryButton} disabled={!name.trim()}>
          Rename
        </button>
      </div>
    </form>
  );
}

function Delete({ doc, onClose }: { doc: HalftoneSystem; onClose: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">It’s removed from this browser. You can undo it for a few seconds after.</p>
      <div className="flex justify-end gap-2">
        <button type="button" className={outlineButton} onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className={destructiveButton}
          onClick={() => {
            removeSystem(doc.id);
            onClose();
          }}>
          Delete
        </button>
      </div>
    </div>
  );
}

/** Whichever dialog the Studio has open. */
export function SystemDialogs({ dialog, onClose }: { dialog: StudioDialog; onClose: () => void }) {
  const s = useSystems();
  const target = dialog && dialog.kind !== 'new' ? s.saved.find((x) => x.id === dialog.id) : undefined;
  return (
    <>
      <Dialog open={dialog?.kind === 'new'} onClose={onClose} title="New system" wide>
        {dialog?.kind === 'new' ? <NewSystem start={dialog.mode} onClose={onClose} /> : null}
      </Dialog>
      <Dialog open={dialog?.kind === 'rename' && !!target} onClose={onClose} title="Rename system">
        {dialog?.kind === 'rename' && target ? <Rename doc={target} onClose={onClose} /> : null}
      </Dialog>
      <Dialog open={dialog?.kind === 'delete' && !!target} onClose={onClose} title={`Delete “${target?.name ?? ''}”?`}>
        {dialog?.kind === 'delete' && target ? <Delete doc={target} onClose={onClose} /> : null}
      </Dialog>
    </>
  );
}
