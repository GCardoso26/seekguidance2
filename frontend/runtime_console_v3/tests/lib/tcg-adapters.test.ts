import { describe, expect, it } from "vitest";
import { getGameAdapter, parseGenericDecklist, parsePokemonDecklist } from "@/lib/tcg-adapters";

describe("tcg-adapters registry", () => {
  it("resolve os quatro jogos V1", () => {
    expect(getGameAdapter("POKEMON").slug).toBe("pokemon");
    expect(getGameAdapter("mtg").code).toBe("MTG");
    expect(getGameAdapter("swu").name).toContain("Star Wars");
  });

  it("MTG commander tem 100 cartas", () => {
    const mtg = getGameAdapter("MTG");
    expect(mtg.getMinDeckSize("COMMANDER")).toBe(100);
    expect(mtg.getMaxCopies("COMMANDER")).toBe(1);
  });

  it("Pokémon não tem sideboard", () => {
    expect(getGameAdapter("POKEMON").getSideboardRules("STANDARD")).toBeNull();
  });
});

describe("parse-decklist", () => {
  it("parse MTG .dec com sideboard", () => {
    const raw = "4 Lightning Bolt\n56 Island\nSideboard\n2 Negate";
    const deck = parseGenericDecklist(raw, "mtg", "STANDARD");
    expect(deck.main_deck.reduce((s, c) => s + c.quantity, 0)).toBe(60);
    expect(deck.sideboard?.length).toBe(1);
  });

  it("parse Pokémon PTCGO", () => {
    const raw = "Pokémon:\n4 Pikachu\nEnergy:\n8 Lightning Energy";
    const deck = parsePokemonDecklist(raw, "STANDARD");
    expect(deck.main_deck.length).toBe(2);
    expect(deck.main_deck[1].card_type).toBe("energy");
  });

  it("parse commander line", () => {
    const raw = "Commander: 1 Atraxa\n60 Island";
    const deck = parseGenericDecklist(raw, "mtg", "COMMANDER");
    expect(deck.commander?.name).toBe("Atraxa");
  });
});
