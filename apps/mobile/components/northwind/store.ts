/**
 * Mock data and a tiny store for the Northwind sample: the made-up invoicing product the web kit's
 * dashboard shows (apps/web/components/dashboard/data.ts), with the same invoices. Delete with app/northwind.
 */
import * as React from 'react';

export type InvoiceStatus = 'Paid' | 'Due' | 'Overdue' | 'Draft';
export type Invoice = { id: string; customer: string; issued: string; due: string; amount: number; status: InvoiceStatus };

export const CUSTOMERS = ['Acme Studio', 'Fernway', 'Lumen Labs', 'Northgate Coffee', 'Orbit Health', 'Pinecrest', 'Quill & Co'];

const INVOICES: Invoice[] = [
  { id: 'INV-1051', customer: 'Orbit Health', issued: '2026-06-24', due: '2026-07-24', amount: 3200, status: 'Draft' },
  { id: 'INV-1050', customer: 'Pinecrest', issued: '2026-06-20', due: '2026-07-20', amount: 1450, status: 'Due' },
  { id: 'INV-1049', customer: 'Quill & Co', issued: '2026-06-16', due: '2026-07-16', amount: 980, status: 'Due' },
  { id: 'INV-1048', customer: 'Northgate Coffee', issued: '2026-06-12', due: '2026-07-12', amount: 640, status: 'Paid' },
  { id: 'INV-1047', customer: 'Fernway', issued: '2026-05-28', due: '2026-06-11', amount: 1240, status: 'Overdue' },
  { id: 'INV-1046', customer: 'Acme Studio', issued: '2026-05-24', due: '2026-06-07', amount: 860, status: 'Overdue' },
  { id: 'INV-1045', customer: 'Lumen Labs', issued: '2026-05-10', due: '2026-05-24', amount: 2310, status: 'Overdue' },
  { id: 'INV-1044', customer: 'Orbit Health', issued: '2026-05-06', due: '2026-06-05', amount: 4100, status: 'Paid' },
  { id: 'INV-1043', customer: 'Pinecrest', issued: '2026-04-30', due: '2026-05-30', amount: 1450, status: 'Paid' },
  { id: 'INV-1042', customer: 'Acme Studio', issued: '2026-04-18', due: '2026-05-18', amount: 1720, status: 'Paid' },
];

/** Paid per month invoiced, for the overview chart. */
export const MONTHLY = [
  { label: 'Jan', value: 8400 },
  { label: 'Feb', value: 9100 },
  { label: 'Mar', value: 7800 },
  { label: 'Apr', value: 10400 },
  { label: 'May', value: 11900 },
  { label: 'Jun', value: 9800 },
];

export const STATUSES: ('All' | InvoiceStatus)[] = ['All', 'Overdue', 'Due', 'Paid', 'Draft'];
/** The dot per status. The status word stays in foreground text: status colours as small text fail AA on their tints. */
export const STATUS_TONE = { Paid: 'success', Due: 'warning', Overdue: 'destructive', Draft: 'muted' } as const;

export const money = (n: number) => `£${n.toLocaleString('en-GB')}`;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "2026-06-24" → "24 Jun", without the device's locale (the same everywhere). */
export const shortDate = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
export const sum = (xs: Invoice[]) => xs.reduce((n, x) => n + x.amount, 0);

let state = INVOICES;
const listeners = new Set<() => void>();
const set = (next: Invoice[]) => {
  state = next;
  listeners.forEach((l) => l());
};

export const invoices = {
  add(invoice: Omit<Invoice, 'id'>): Invoice {
    const last = Math.max(...state.map((i) => Number(i.id.slice(4))));
    const created = { ...invoice, id: `INV-${last + 1}` };
    set([created, ...state]);
    return created;
  },
  setStatus(id: string, status: InvoiceStatus) {
    set(state.map((i) => (i.id === id ? { ...i, status } : i)));
  },
  remove(id: string) {
    set(state.filter((i) => i.id !== id));
  },
};

export function useInvoices(): Invoice[] {
  return React.useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state
  );
}
