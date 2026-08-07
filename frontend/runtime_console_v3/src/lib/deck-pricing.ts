import type { Deck, DeckCardEntry } from "@/types/deck";
import { gameCardsPath } from "@/lib/game-routes";

export interface DeckPrice {
  total: number;
  byGame: Record<string, number>;
  currency: "USD";
}

export function calculateDeckPrice(deck: DeckCardEntry[]): DeckPrice {
  const byGame: Record<string, number> = {};
  let total = 0;

  for (const card of deck) {
    const cents = card.card.lowestPrice ?? 0;
    const subtotal = cents * card.quantity;
    total += subtotal;
    const game = String(card.card.game || "unknown").toLowerCase();
    byGame[game] = (byGame[game] ?? 0) + subtotal;
  }

  return { total, byGame, currency: "USD" };
}

export interface MissingCard {
  card_id: string;
  name: string;
  needed: number;
  owned: number;
  missing: number;
}

export interface CollectionOwnership {
  card_id: string;
  quantity: number;
}

export function calculateMissingCards(
  deckCards: DeckCardEntry[],
  owned: CollectionOwnership[],
): MissingCard[] {
  const ownedMap = new Map<string, number>();
  for (const entry of owned) {
    ownedMap.set(entry.card_id, (ownedMap.get(entry.card_id) ?? 0) + entry.quantity);
  }

  const neededMap = new Map<string, { name: string; needed: number }>();
  for (const entry of deckCards) {
    const prev = neededMap.get(entry.card_id);
    neededMap.set(entry.card_id, {
      name: entry.card.name,
      needed: (prev?.needed ?? 0) + entry.quantity,
    });
  }

  const missing: MissingCard[] = [];
  for (const [card_id, { name, needed }] of neededMap) {
    const ownedQty = ownedMap.get(card_id) ?? 0;
    const gap = needed - ownedQty;
    if (gap > 0) {
      missing.push({ card_id, name, needed, owned: ownedQty, missing: gap });
    }
  }

  return missing.sort((a, b) => a.name.localeCompare(b.name));
}

export function buildMissingCardsSearchUrl(gameSlug: string, missing: MissingCard[]): string {
  const params = new URLSearchParams();
  for (const item of missing) {
    params.append("card_id", item.card_id);
    params.append("qty", String(item.missing));
  }
  return `${gameCardsPath(gameSlug)}?${params.toString()}`;
}

export function estimateCollectionValue(
  items: Array<{ quantity: number; card?: { lowestPrice?: number } }>,
): number {
  return items.reduce((sum, item) => {
    const cents = item.card?.lowestPrice ?? 0;
    return sum + cents * item.quantity;
  }, 0);
}
