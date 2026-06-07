import { describe, expect, it } from "vitest";
import { DeckValidator } from "@/lib/deck-validator/DeckValidator";
import type { Decklist } from "@/lib/deck-validator/schema";

function deck(cards: { id: string; qty: number }[], tcg: "lorcana" | "pokemon" = "lorcana"): Decklist {
  const now = new Date().toISOString();
  return {
    id: "d1",
    tcg,
    format: "standard",
    name: "Test",
    player_id: "p1",
    main_deck: cards.map((c) => ({
      definition_id: c.id,
      name: c.id,
      quantity: c.qty,
    })),
    created_at: now,
    updated_at: now,
  };
}

describe("DeckValidator", () => {
  const validator = new DeckValidator();

  it("rejeita deck pequeno", async () => {
    const result = await validator.validate(deck([{ id: "c1", qty: 10 }]));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "DECK_TOO_SMALL")).toBe(true);
  });

  it("rejeita carta banida lorcana", async () => {
    const cards = Array.from({ length: 60 }, (_, i) => ({
      id: i === 0 ? "lorcana-banned-001" : `lorcana-${i}`,
      qty: 1,
    }));
    const result = await validator.validate(deck(cards));
    expect(result.errors.some((e) => e.code === "BANNED_CARD")).toBe(true);
  });

  it("aceita deck válido 60 cartas", async () => {
    const cards = Array.from({ length: 60 }, (_, i) => ({ id: `lorcana-${i}`, qty: 1 }));
    const result = await validator.validate(deck(cards));
    expect(result.valid).toBe(true);
  });
});
