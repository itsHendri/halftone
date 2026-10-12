'use client';
import { useSyncExternalStore } from 'react';
import { type CartLine, cartTotal, INITIAL_CART, INITIAL_ORDERS, type Order } from './data';

/**
 * The shop's cart and orders for the session: a module-level store, so they survive navigating between
 * pages and reset on reload, which is what a prototype wants. Never call real APIs.
 */
type State = { cart: CartLine[]; orders: Order[] };
const INITIAL: State = { cart: INITIAL_CART, orders: INITIAL_ORDERS };
let state = INITIAL;
const listeners = new Set<() => void>();
const set = (next: Partial<State>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

export const shop = {
  add(productId: string, qty = 1) {
    const line = state.cart.find((l) => l.productId === productId);
    set({ cart: line ? state.cart.map((l) => (l.productId === productId ? { ...l, qty: l.qty + qty } : l)) : [...state.cart, { productId, qty }] });
  },
  setQty(productId: string, qty: number) {
    set({ cart: qty <= 0 ? state.cart.filter((l) => l.productId !== productId) : state.cart.map((l) => (l.productId === productId ? { ...l, qty } : l)) });
  },
  placeOrder(deliveryPrice: number): Order {
    const order: Order = { id: `A${1043 + state.orders.length - 1}`, placedAt: 'Today', total: cartTotal(state.cart) + deliveryPrice, items: state.cart, status: 'processing' };
    set({ orders: [order, ...state.orders], cart: [] });
    return order;
  },
};

export function useShop(): State {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => INITIAL
  );
}
