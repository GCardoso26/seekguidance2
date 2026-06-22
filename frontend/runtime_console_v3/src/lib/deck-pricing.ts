import type { DeckCardEntry } from "@/types/deck";

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
