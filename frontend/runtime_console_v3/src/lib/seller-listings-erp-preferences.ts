import type { ListingsFilterState } from "@/components/seller-dashboard/listings/ListingsToolbar";

export const LISTINGS_COLUMN_IDS = [
  "select",
  "image",
  "cardName",
  "language",
  "foil",
  "condition",
  "price",
  "quantity",
  "status",
  "updated",
  "actions",
] as const;

export type ListingsColumnId = (typeof LISTINGS_COLUMN_IDS)[number];

export const LISTINGS_COLUMN_LABELS: Record<ListingsColumnId, string> = {
  select: "Seleção",
  image: "Imagem",
  cardName: "Carta",
  language: "Idioma",
  foil: "Foil",
  condition: "Condição",
  price: "Preço",
  quantity: "Quantidade",
  status: "Status",
  updated: "Atualizado",
  actions: "Ações",
};

export type SavedListingsFilter = {
  id: string;
  name: string;
  filters: ListingsFilterState;
};

export type ListingsErpPreferences = {
  columnVisibility: Partial<Record<ListingsColumnId, boolean>>;
  columnOrder: ListingsColumnId[];
  savedFilters: SavedListingsFilter[];
  recentSearches: string[];
};

const STORAGE_KEY = "judgetcg-seller-listings-erp-v1";
const MAX_RECENT = 8;

const DEFAULT_PREFERENCES: ListingsErpPreferences = {
  columnVisibility: {},
  columnOrder: [...LISTINGS_COLUMN_IDS],
  savedFilters: [],
  recentSearches: [],
};

export function loadListingsErpPreferences(): ListingsErpPreferences {
  if (typeof window === "undefined") return { ...DEFAULT_PREFERENCES };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<ListingsErpPreferences>;
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      columnOrder: parsed.columnOrder ?? DEFAULT_PREFERENCES.columnOrder,
      savedFilters: parsed.savedFilters ?? [],
      recentSearches: parsed.recentSearches ?? [],
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function saveListingsErpPreferences(prefs: ListingsErpPreferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function isColumnVisible(
  prefs: ListingsErpPreferences,
  id: ListingsColumnId,
): boolean {
  if (id === "select" || id === "actions") return true;
  return prefs.columnVisibility[id] !== false;
}

export function pushRecentSearch(prefs: ListingsErpPreferences, query: string): ListingsErpPreferences {
  const q = query.trim();
  if (!q) return prefs;
  const next = [q, ...prefs.recentSearches.filter((s) => s !== q)].slice(0, MAX_RECENT);
  return { ...prefs, recentSearches: next };
}

export function orderedVisibleColumns(prefs: ListingsErpPreferences): ListingsColumnId[] {
  const order = prefs.columnOrder.length ? prefs.columnOrder : [...LISTINGS_COLUMN_IDS];
  return order.filter((id) => isColumnVisible(prefs, id));
}
