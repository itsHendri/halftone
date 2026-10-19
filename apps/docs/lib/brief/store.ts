'use client';
/**
 * The brief wizard's answers: a module-level store (like lib/theme/store.ts), saved to localStorage as you type
 * and nowhere else. A shared link (`/brief/?b=…`) replaces them once, then leaves the address bar.
 */
import * as React from 'react';
import { BRIEF_KEY } from '@/lib/theme/keys';
import { decodeBrief, EMPTY_BRIEF, normalizeBrief, type Answer, type Brief } from './model';

let brief: Brief = EMPTY_BRIEF;
/** 'shared' after a link loaded a brief, until the visitor changes it. */
let origin: 'empty' | 'saved' | 'shared' = 'empty';
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

let saveTimer: ReturnType<typeof setTimeout> | undefined;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(BRIEF_KEY, JSON.stringify(brief));
    } catch {
      /* storage unavailable: the brief lasts for this page */
    }
  }, 250);
}

let started = false;
/** Read a shared link, else this browser's last brief. Safe to call any number of times. */
export async function startBrief() {
  if (started || typeof window === 'undefined') return;
  started = true;
  const url = new URL(window.location.href);
  const code = url.searchParams.get('b');
  if (code) {
    url.searchParams.delete('b');
    window.history.replaceState(window.history.state, '', url);
    const shared = await decodeBrief(code);
    if (shared) {
      brief = shared;
      origin = 'shared';
      save();
      emit();
      return;
    }
  }
  try {
    const saved = normalizeBrief(JSON.parse(localStorage.getItem(BRIEF_KEY) ?? 'null'));
    if (saved) {
      brief = saved;
      origin = 'saved';
      emit();
    }
  } catch {
    /* unreadable: start empty */
  }
}

export function updateBrief(patch: Partial<Brief>) {
  brief = { ...brief, ...patch };
  origin = origin === 'shared' ? 'saved' : origin;
  save();
  emit();
}

export function setAnswer(id: string, patch: Partial<Answer>) {
  const next = { ...brief.answers[id], ...patch };
  updateBrief({ answers: { ...brief.answers, [id]: next } });
}

export function resetBrief() {
  brief = { ...EMPTY_BRIEF, mode: brief.mode, platform: brief.platform };
  origin = 'empty';
  try {
    localStorage.removeItem(BRIEF_KEY);
  } catch {}
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const useBrief = () => React.useSyncExternalStore(subscribe, () => brief, () => EMPTY_BRIEF);
export const useBriefOrigin = () => React.useSyncExternalStore(subscribe, () => origin, () => 'empty' as const);
