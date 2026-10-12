/**
 * Mock catalogue for the shop sample: the same products, prices and orders as the native kit's shop
 * (apps/mobile/components/shop/store.ts), so the two read as one product. Server-safe: no hooks here.
 */
import { BackpackIcon, CoffeeIcon, HeadphonesIcon, LampIcon, type LucideIcon, NotebookIcon, ShoppingBagIcon, SpeakerIcon, SproutIcon } from 'lucide-react';

export type Product = { id: string; name: string; price: number; category: 'home' | 'audio' | 'desk' | 'bags'; rating: number; blurb: string; seed: string };
export type CartLine = { productId: string; qty: number };
export type OrderStatus = 'processing' | 'shipped' | 'delivered';
export type Order = { id: string; placedAt: string; total: number; items: CartLine[]; status: OrderStatus };
export type Delivery = { id: 'standard' | 'express'; label: string; description: string; price: number };

export const PRODUCTS: Product[] = [
  { id: 'lamp', name: 'Arc desk lamp', price: 48, category: 'desk', rating: 4.6, blurb: 'Warm dimmable light with a weighted base.', seed: 'lamp' },
  { id: 'mug', name: 'Stoneware mug', price: 18, category: 'home', rating: 4.8, blurb: 'Hand-glazed, holds 350 ml.', seed: 'mug' },
  { id: 'headphones', name: 'Over-ear headphones', price: 129, category: 'audio', rating: 4.4, blurb: '30-hour battery, folds flat.', seed: 'audio' },
  { id: 'tote', name: 'Canvas tote', price: 32, category: 'bags', rating: 4.2, blurb: 'Heavy canvas with an inside pocket.', seed: 'tote' },
  { id: 'planter', name: 'Ceramic planter', price: 26, category: 'home', rating: 4.5, blurb: 'Drainage hole and saucer included.', seed: 'plant' },
  { id: 'speaker', name: 'Pocket speaker', price: 59, category: 'audio', rating: 4.1, blurb: 'Splash-proof, pairs in seconds.', seed: 'speaker' },
  { id: 'notebook', name: 'Dot-grid notebook', price: 14, category: 'desk', rating: 4.7, blurb: '192 pages, lies flat.', seed: 'notebook' },
  { id: 'backpack', name: 'Commuter backpack', price: 89, category: 'bags', rating: 4.3, blurb: 'Fits a 16-inch laptop.', seed: 'backpack' },
];

export const CATEGORIES: { value: 'all' | Product['category']; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'home', label: 'Home' },
  { value: 'desk', label: 'Desk' },
  { value: 'audio', label: 'Audio' },
  { value: 'bags', label: 'Bags' },
];

export const DELIVERY: Delivery[] = [
  { id: 'standard', label: 'Standard delivery', description: '3–5 business days', price: 0 },
  { id: 'express', label: 'Express delivery', description: 'Tomorrow before noon', price: 9.9 },
];

/** Free standard delivery from this subtotal; below it, a flat fee. */
export const FREE_DELIVERY_FROM = 40;
export const SMALL_ORDER_FEE = 4.9;

const ICONS: Record<string, LucideIcon> = { lamp: LampIcon, mug: CoffeeIcon, headphones: HeadphonesIcon, tote: ShoppingBagIcon, planter: SproutIcon, speaker: SpeakerIcon, notebook: NotebookIcon, backpack: BackpackIcon };
export const iconFor = (p: Product): LucideIcon => ICONS[p.id] ?? ShoppingBagIcon;
export const money = (n: number) => `$${n.toFixed(2)}`;
export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);
export const cartTotal = (cart: CartLine[]) => cart.reduce((n, l) => n + (productById(l.productId)?.price ?? 0) * l.qty, 0);
export const cartCount = (cart: CartLine[]) => cart.reduce((n, l) => n + l.qty, 0);

export const INITIAL_CART: CartLine[] = [{ productId: 'lamp', qty: 1 }];
export const INITIAL_ORDERS: Order[] = [
  { id: 'A1042', placedAt: '18 Sep', total: 66, items: [{ productId: 'mug', qty: 2 }, { productId: 'planter', qty: 1 }], status: 'delivered' },
];
