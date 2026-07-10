/**
 * Wishlist inteligente — múltiplas listas (Sprint 14 Epic 2).
 * Persistência local até o backend expor lists nativas. Não altera contrato BFF existente.
 */

export type WishlistListMeta = {
  id: string;
  name: string;
  created_at: string;
};

const LISTS_KEY = "judgetcg_wishlist_lists_v1";
const LIST_ITEMS_KEY = "judgetcg_wishlist_list_items_v1";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadWishlistLists(): WishlistListMeta[] {
  const lists = readJson<WishlistListMeta[]>(LISTS_KEY, []);
  if (lists.length === 0) {
    const defaults: WishlistListMeta[] = [
      { id: "default", name: "Favoritos", created_at: new Date().toISOString() },
      { id: "decks", name: "Para decks", created_at: new Date().toISOString() },
    ];
    writeJson(LISTS_KEY, defaults);
    return defaults;
  }
  return lists;
}

export function createWishlistList(name: string): WishlistListMeta {
  const lists = loadWishlistLists();
  const entry: WishlistListMeta = {
    id: `list-${crypto.randomUUID().slice(0, 8)}`,
    name: name.trim() || "Nova lista",
    created_at: new Date().toISOString(),
  };
  writeJson(LISTS_KEY, [...lists, entry]);
  return entry;
}

export function getListProductIds(listId: string): string[] {
  const map = readJson<Record<string, string[]>>(LIST_ITEMS_KEY, {});
  return map[listId] ?? [];
}

export function addProductToList(listId: string, productId: string) {
  const map = readJson<Record<string, string[]>>(LIST_ITEMS_KEY, {});
  const curr = new Set(map[listId] ?? []);
  curr.add(productId);
  map[listId] = Array.from(curr);
  writeJson(LIST_ITEMS_KEY, map);
}

export function removeProductFromList(listId: string, productId: string) {
  const map = readJson<Record<string, string[]>>(LIST_ITEMS_KEY, {});
  map[listId] = (map[listId] ?? []).filter((id) => id !== productId);
  writeJson(LIST_ITEMS_KEY, map);
}
