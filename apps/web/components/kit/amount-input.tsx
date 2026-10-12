'use client';
import { cn } from 'cn';
import { ArrowUpDownIcon } from 'lucide-react';
import * as React from 'react';

type Props = {
  value: string;
  onChangeText: (next: string) => void;
  /** "$", "€", "BTC"… */
  symbol: string;
  symbolPosition?: 'leading' | 'trailing';
  /** Line under the field: conversion, balance. */
  helper?: string;
  onMax?: () => void;
  onToggleCurrency?: () => void;
  error?: string;
  placeholder?: string;
  /** Names the field ("Amount to send"). Default "Amount". */
  'aria-label'?: string;
  className?: string;
};

/** Hero amount field for send, trade and deposit screens. */
export function AmountInput({ value, onChangeText, symbol, symbolPosition = 'leading', helper, onMax, onToggleCurrency, error, placeholder = '0', className, ...props }: Props) {
  const id = React.useId();
  const symbolEl = <span className="text-muted-foreground text-3xl font-semibold">{symbol}</span>;
  return (
    <div className={className}>
      <div
        className={cn(
          'bg-card focus-within:ring-ring/50 flex items-center gap-2 rounded-lg border px-4 py-3 focus-within:ring-[3px]',
          error ? 'border-destructive' : 'border-border focus-within:border-ring'
        )}>
        {symbolPosition === 'leading' ? symbolEl : null}
        <input
          value={value}
          onChange={(e) => onChangeText(e.target.value.replace(/[^\d.,]/g, ''))}
          placeholder={placeholder}
          inputMode="decimal"
          aria-label={props['aria-label'] ?? 'Amount'}
          aria-invalid={!!error}
          aria-describedby={error || helper ? `${id}-note` : undefined}
          className="text-foreground placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-3xl font-semibold tabular-nums outline-none"
        />
        {symbolPosition === 'trailing' ? symbolEl : null}
        {onToggleCurrency ? (
          <button type="button" aria-label="Switch currency" onClick={onToggleCurrency} className="bg-muted hover:bg-accent focus-visible:ring-ring/50 flex size-9 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-[3px]">
            <ArrowUpDownIcon className="size-4" aria-hidden />
          </button>
        ) : null}
        {onMax ? (
          <button type="button" aria-label="Use maximum" onClick={onMax} className="bg-muted hover:bg-accent text-primary focus-visible:ring-ring/50 h-8 shrink-0 rounded-full px-3 text-xs font-bold outline-none focus-visible:ring-[3px]">
            MAX
          </button>
        ) : null}
      </div>
      {error || helper ? (
        <p id={`${id}-note`} role={error ? 'alert' : undefined} className={cn('mt-2 text-sm', error ? 'text-destructive' : 'text-muted-foreground text-right')}>
          {error ?? helper}
        </p>
      ) : null}
    </div>
  );
}
