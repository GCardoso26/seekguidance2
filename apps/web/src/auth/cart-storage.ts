/**
 * Persist open cart id + display meta (names/condition) across refresh.
 * Price/qty always come from Cart API (snapshot).
 */

import type { CartItemDisplayMeta } from "@/src/types/api";

const CART_ID_KEY = "judgetcg.cartId";
const CART_META_KEY = "judgetcg.cartDisplayMeta";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function getPersistedCartId(): string | null {
  if (!canUseStorage()) return null;
  return sessionStorage.getItem(CART_ID_KEY);
}

export function persistCartId(cartId: string): void {
  if (!canUseStorage()) return;
  sessionStorage.setItem(CART_ID_KEY, cartId);
}

export function clearPersistedCartId(): void {
  if (!canUseStorage()) return;
  sessionStorage.removeItem(CART_ID_KEY);
}

export function loadCartDisplayMeta(): Record<string, CartItemDisplayMeta> {
  if (!canUseStorage()) return {};
  const raw = sessionStorage.getItem(CART_META_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, CartItemDisplayMeta>;
  } catch {
    return {};
  }
}

export function saveCartDisplayMeta(meta: Record<string, CartItemDisplayMeta>): void {
  if (!canUseStorage()) return;
  sessionStorage.setItem(CART_META_KEY, JSON.stringify(meta));
}

export function upsertCartDisplayMeta(entry: CartItemDisplayMeta): void {
  const all = loadCartDisplayMeta();
  all[entry.listingId] = entry;
  saveCartDisplayMeta(all);
}

export function clearCartDisplayMeta(): void {
  if (!canUseStorage()) return;
  sessionStorage.removeItem(CART_META_KEY);
}
