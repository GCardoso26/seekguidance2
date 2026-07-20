import type { JudgeHistoryItem } from "@/types/judge";

const STORAGE_KEY = "judge-favorites-v1";
const LISTS_KEY = "judge-favorite-lists-v1";

export type FavoriteList = {
  id: string;
  name: string;
  itemIds: string[];
  updatedAt: string;
};

export function loadJudgeFavorites(): JudgeHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as JudgeHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistFavorites(items: JudgeHistoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 200)));
}

export function toggleJudgeFavorite(item: JudgeHistoryItem): JudgeHistoryItem[] {
  const prev = loadJudgeFavorites();
  const exists = prev.some((f) => f.id === item.id);
  const next = exists ? prev.filter((f) => f.id !== item.id) : [item, ...prev].slice(0, 200);
  persistFavorites(next);
  return next;
}

export function isJudgeFavorite(id: string): boolean {
  return loadJudgeFavorites().some((f) => f.id === id);
}

export function removeJudgeFavorite(id: string): JudgeHistoryItem[] {
  const next = loadJudgeFavorites().filter((f) => f.id !== id);
  persistFavorites(next);
  return next;
}

export function searchJudgeFavorites(query: string): JudgeHistoryItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return loadJudgeFavorites();
  return loadJudgeFavorites().filter((f) => {
    const name = String((f as { name?: string }).name ?? f.id).toLowerCase();
    return name.includes(q) || f.id.toLowerCase().includes(q);
  });
}

export function loadFavoriteLists(): FavoriteList[] {
  try {
    const raw = localStorage.getItem(LISTS_KEY);
    if (!raw) {
      const def: FavoriteList = {
        id: "default",
        name: "Favoritos",
        itemIds: loadJudgeFavorites().map((f) => f.id),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(LISTS_KEY, JSON.stringify([def]));
      return [def];
    }
    const parsed = JSON.parse(raw) as FavoriteList[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function upsertFavoriteList(list: FavoriteList): FavoriteList[] {
  const prev = loadFavoriteLists().filter((l) => l.id !== list.id);
  const next = [...prev, { ...list, updatedAt: new Date().toISOString() }];
  localStorage.setItem(LISTS_KEY, JSON.stringify(next));
  return next;
}

/** Share payload structure (prepared — no public share endpoint yet). */
export function buildFavoriteListSharePayload(listId: string): {
  version: 1;
  listId: string;
  name: string;
  itemIds: string[];
} | null {
  const list = loadFavoriteLists().find((l) => l.id === listId);
  if (!list) return null;
  return {
    version: 1,
    listId: list.id,
    name: list.name,
    itemIds: list.itemIds,
  };
}
