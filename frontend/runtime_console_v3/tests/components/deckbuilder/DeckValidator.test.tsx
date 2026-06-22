/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { FormatValidator } from "@/lib/deck/validators";
import type { Deck } from "@/types/deck";

const emptyDeck = (): Deck => ({
  id: "1",
  name: "Test",
  game: "mtg",
  format: "standard",
  owner_id: "u1",
  is_public: false,
  total_cards: 0,
  total_price: 0,
  likes: 0,
  views: 0,
  main_deck: [],
  sideboard: [],
  commander: [],
  companion: [],
});

describe("FormatValidator", () => {
  it("permite adicionar carta em deck vazio", () => {
    const validator = new FormatValidator("standard", "mtg");
    const result = validator.canAddCard(emptyDeck(), {
      id: "card-1",
      name: "Bolt",
      game: "MTG",
      set: { name: "MH3", code: "mh3" },
      number: "1",
      rarity: "common",
      language: "en",
      imageUris: { small: "", normal: "", large: "" },
      gameData: {},
    }, "main");
    expect(result.valid).toBe(true);
  });

  it("bloqueia quando zona está cheia", () => {
    const deck = emptyDeck();
    deck.game = "lorcana";
    deck.format = "constructed";
    deck.main_deck = Array.from({ length: 60 }, (_, i) => ({
      id: `row-${i}`,
      card_id: `c-${i}`,
      quantity: 1,
      zone: "main" as const,
      is_foil: false,
      card: {
        id: `c-${i}`,
        name: `Card ${i}`,
        game: "MTG",
        set: { name: "Set", code: "s" },
        number: "1",
        rarity: "common",
        language: "en",
        imageUris: { small: "", normal: "", large: "" },
        gameData: {},
      },
    }));
    const validator = new FormatValidator("constructed", "lorcana");
    const result = validator.canAddCard(deck, deck.main_deck[0].card, "main");
    expect(result.valid).toBe(false);
  });
});
