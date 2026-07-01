import { describe, expect, it } from "vitest";
import {
  ALL_GAME_SLUGS,
  gameCardDetailPath,
  gameCardsPath,
  gameLandingPath,
  isKnownGameSlug,
} from "@/lib/game-routes";

describe("game-routes", () => {
  it("reconhece slugs de TCG conhecidos", () => {
    expect(isKnownGameSlug("mtg")).toBe(true);
    expect(isKnownGameSlug("pokemon")).toBe(true);
    expect(isKnownGameSlug("not-a-game")).toBe(false);
  });

  it("gera paths estilo CardTrader", () => {
    expect(gameLandingPath("mtg")).toBe("/mtg");
    expect(gameCardsPath("lorcana")).toBe("/lorcana/cards");
    expect(gameCardDetailPath("mtg", "abc-123")).toBe("/mtg/cards/abc-123");
  });

  it("lista todos os slugs do catálogo", () => {
    expect(ALL_GAME_SLUGS.length).toBeGreaterThanOrEqual(13);
    expect(ALL_GAME_SLUGS).toContain("vanguard");
  });
});
