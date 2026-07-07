const STORAGE_KEY = "judgetcg-search-favorites-v1";

export type SearchFavorite = {
  id: string;
  title: string;
  href: string;
  group: string;
  addedAt: string;
};

export function loadSearchFavorites(): SearchFavorite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SearchFavorite[]) : [];
  } catch {
    return [];
  }
}

export function toggleSearchFavorite(item: Omit<SearchFavorite, "addedAt">): SearchFavorite[] {
  const prev = loadSearchFavorites();
  const exists = prev.some((f) => f.id === item.id);
  const next = exists
    ? prev.filter((f) => f.id !== item.id)
    : [{ ...item, addedAt: new Date().toISOString() }, ...prev];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function isFavorite(id: string): boolean {
  return loadSearchFavorites().some((f) => f.id === id);
}
