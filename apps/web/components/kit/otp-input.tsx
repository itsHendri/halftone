'use client';
import { cn } from 'cn';
import * as React from 'react';

type Props = {
  length?: number;
  value: string;
  onChange: (next: string) => void;
  onComplete?: (code: string) => void;
  error?: string;
  autoFocus?: boolean;
  className?: string;
};

/** N-digit one-time-code entry: auto-advances, handles paste, backspaces into the previous cell. */
export function OtpInput({ length = 6, value, onChange, onComplete, error, autoFocus, className }: Props) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => (value ?? '').replace(/\D/g, '').slice(0, length)[i] ?? '');

  const commit = (next: string[]) => {
    const joined = next.join('');
    onChange(joined);
    if (joined.length === length && !next.includes('')) onComplete?.(joined);
  };
  const setAt = (idx: number, raw: string) => {
    const clean = raw.replace(/\D/g, '');
    const next = [...digits];
    if (clean.length > 1) {
      // A paste, or an autofilled code.
      for (let i = 0; i < clean.length && idx + i < length; i++) next[idx + i] = clean[i];
      commit(next);
      refs.current[Math.min(idx + clean.length, length - 1)]?.focus();
      return;
    }
    next[idx] = clean;
    commit(next);
    if (clean && idx < length - 1) refs.current[idx + 1]?.focus();
  };

  return (
    <div className={className}>
      <div role="group" aria-label={`${length}-digit code`} className="flex gap-2">
        {digits.map((d, idx) => (
          <input
            key={idx}
            ref={(r) => {
              refs.current[idx] = r;
            }}
            value={d}
            autoFocus={autoFocus && idx === 0}
            onChange={(e) => setAt(idx, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
                e.preventDefault();
                const next = [...digits];
                next[idx - 1] = '';
                onChange(next.join(''));
                refs.current[idx - 1]?.focus();
              }
            }}
            onFocus={(e) => e.target.select()}
            inputMode="numeric"
            autoComplete={idx === 0 ? 'one-time-code' : 'off'}
            maxLength={idx === 0 ? length : 1}
            aria-label={`Digit ${idx + 1} of ${length}`}
            aria-invalid={!!error}
            className={cn(
              'bg-card text-foreground focus-visible:ring-ring/50 h-14 w-full min-w-0 flex-1 rounded-lg border text-center text-2xl font-bold tabular-nums outline-none focus-visible:ring-[3px]',
              error ? 'border-destructive' : 'border-border focus-visible:border-ring'
            )}
          />
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-destructive mt-2 text-center text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
