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
    expect(isKnownGameSlug("magic")).toBe(true);
    expect(isKnownGameSlug("gundam")).toBe(true);
    expect(isKnownGameSlug("sorcery")).toBe(true);
    expect(isKnownGameSlug("not-a-game")).toBe(false);
  });

  it("ADR-016: hard-exit denylist não é navegável", () => {
    expect(isKnownGameSlug("swu")).toBe(false);
    expect(isKnownGameSlug("vanguard")).toBe(false);
    expect(isKnownGameSlug("union-arena")).toBe(false);
    expect(isKnownGameSlug("star-wars")).toBe(false);
  });

  it("gera paths estilo CardTrader", () => {
    expect(gameLandingPath("mtg")).toBe("/mtg");
    expect(gameCardsPath("lorcana")).toBe("/lorcana/cards");
    expect(gameCardDetailPath("mtg", "abc-123")).toBe("/mtg/cards/abc-123");
  });

  it("lista slugs do ecossistema de produto (sem denylist)", () => {
    expect(ALL_GAME_SLUGS.length).toBeGreaterThanOrEqual(11);
    expect(ALL_GAME_SLUGS).toContain("gundam");
    expect(ALL_GAME_SLUGS).not.toContain("vanguard");
    expect(ALL_GAME_SLUGS).not.toContain("swu");
    expect(ALL_GAME_SLUGS).not.toContain("union-arena");
  });
});
