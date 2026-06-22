import type { CollectionItem } from "@/hooks/useDeck";

export type CollectionSort = "name" | "price" | "acquired";

export const COLLECTION_CONDITIONS = ["NM", "LP", "MP", "HP", "DMG"] as const;

export function filterCollectionItems(
  items: CollectionItem[],
  filters: {
    q?: string;
    game?: string;
    condition?: string;
    foil?: boolean | null;
  },
): CollectionItem[] {
  return items.filter((item) => {
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const name = item.card?.name?.toLowerCase() ?? "";
      if (!name.includes(q)) return false;
    }
    if (filters.game && item.card?.game_code?.toLowerCase() !== filters.game.toLowerCase()) {
      return false;
    }
    if (filters.condition && item.condition !== filters.condition) return false;
    if (filters.foil === true && !item.is_foil) return false;
    if (filters.foil === false && item.is_foil) return false;
    return true;
  });
}

export function sortCollectionItems(items: CollectionItem[], sort: CollectionSort): CollectionItem[] {
  const copy = [...items];
  if (sort === "name") {
    return copy.sort((a, b) => (a.card?.name ?? "").localeCompare(b.card?.name ?? ""));
  }
  if (sort === "acquired") {
    return copy.sort((a, b) => (b.acquired_at ?? "").localeCompare(a.acquired_at ?? ""));
  }
  return copy;
}

export function collectionStats(items: CollectionItem[]) {
  const totalCards = items.reduce((sum, i) => sum + i.quantity, 0);
  const foilCount = items.filter((i) => i.is_foil).reduce((sum, i) => sum + i.quantity, 0);
  return { totalCards, uniqueCards: items.length, foilCount };
}
