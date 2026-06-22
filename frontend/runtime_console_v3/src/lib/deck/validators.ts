import { getFormatRules } from "@/lib/deck-validator/rules";
import type { TCGId } from "@/lib/deck-validator/schema";
import type { Deck, DeckBuilderZoneId, DeckCardEntry } from "@/types/deck";
import type { UnifiedCard } from "@/types/card";

function zoneKey(zone: DeckBuilderZoneId): keyof Pick<Deck, "main_deck" | "sideboard" | "commander"> {
  if (zone === "sideboard") return "sideboard";
  if (zone === "commander") return "commander";
  return "main_deck";
}

function countInZone(deck: Deck, zone: DeckBuilderZoneId, cardId?: string): number {
  const cards = deck[zoneKey(zone)] ?? [];
  if (!cardId) return cards.reduce((sum, c) => sum + c.quantity, 0);
  return cards
    .filter((c) => c.card_id === cardId)
    .reduce((sum, c) => sum + c.quantity, 0);
}

export class FormatValidator {
  constructor(
    private readonly format: string,
    private readonly game: string,
  ) {}

  canAddCard(
    deck: Deck,
    card: UnifiedCard,
    zone: DeckBuilderZoneId,
  ): { valid: boolean; reason?: string } {
    const tcg = this.game.toLowerCase() as TCGId;
    const rules = getFormatRules(tcg, this.format);
    const zoneCards = countInZone(deck, zone);
    const maxZone =
      zone === "sideboard"
        ? rules.sideboard_size ?? 15
        : zone === "commander"
          ? 1
          : rules.max_cards;

    if (zoneCards >= maxZone) {
      return { valid: false, reason: `Zona ${zone} cheia (máx. ${maxZone})` };
    }

    const existing = countInZone(deck, zone, card.id);
    const maxCopies = this.format.toLowerCase() === "commander" ? 1 : rules.max_copies;
    if (existing >= maxCopies) {
      return { valid: false, reason: `Máximo de ${maxCopies} cópias de ${card.name}` };
    }

    return { valid: true };
  }

  zoneTotal(deck: Deck, zone: DeckBuilderZoneId): number {
    return countInZone(deck, zone);
  }

  zoneLimit(zone: DeckBuilderZoneId): number {
    const tcg = this.game.toLowerCase() as TCGId;
    const rules = getFormatRules(tcg, this.format);
    if (zone === "sideboard") return rules.sideboard_size ?? 15;
    if (zone === "commander") return 1;
    if (this.format.toLowerCase() === "commander") return 100;
    return rules.max_cards;
  }
}

export function deckManaSummary(cards: DeckCardEntry[]): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const entry of cards) {
    const cost = entry.card.gameData?.mana_cost ?? entry.card.gameData?.manaCost;
    if (typeof cost === "string" && cost.trim()) {
      summary[cost] = (summary[cost] ?? 0) + entry.quantity;
    }
  }
  return summary;
}
