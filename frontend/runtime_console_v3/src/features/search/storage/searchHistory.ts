const STORAGE_KEY = "judgetcg-search-history-v1";
const MAX_ITEMS = 20;

export type SearchHistoryEntry = {
  id: string;
  query: string;
  resultId?: string;
  title?: string;
  href?: string;
  group?: string;
  at: string;
};

export function loadSearchHistory(): SearchHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SearchHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function pushSearchHistory(entry: Omit<SearchHistoryEntry, "at">) {
  if (typeof window === "undefined") return;
  const prev = loadSearchHistory().filter((e) => e.id !== entry.id);
  const next = [{ ...entry, at: new Date().toISOString() }, ...prev].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function pushSearchQuery(query: string) {
  if (!query.trim()) return;
  pushSearchHistory({ id: `q-${query}`, query: query.trim() });
}
