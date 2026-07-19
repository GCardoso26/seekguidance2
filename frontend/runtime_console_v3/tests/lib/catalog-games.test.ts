import { describe, expect, it } from "vitest";
import { getMegaMenuGames, MEGA_MENU_GAME_IDS } from "@/lib/catalog-games";

describe("getMegaMenuGames", () => {
  it("sempre retorna pelo menos 6 jogos", () => {
    expect(MEGA_MENU_GAME_IDS.length).toBeGreaterThanOrEqual(6);
    expect(getMegaMenuGames(null).length).toBeGreaterThanOrEqual(6);
  });

  it("mostra jogos prioritários mesmo quando só MTG tem cartas no health", () => {
    const games = getMegaMenuGames({
      status: "ready_for_marketplace",
      total_cards: 100,
      by_game: { MTG: 100 },
      missing_images: [],
      missing_prices: [],
      last_sync: {},
      ready_for_marketplace: true,
      meilisearch: "disabled",
    });
    const ids = games.map((g) => g.id);
    expect(ids).toContain("MTG");
    expect(ids).toContain("POKEMON");
    expect(ids).toContain("YGO");
    expect(ids).toContain("LORCANA");
    expect(ids).toContain("FAB");
    expect(ids).not.toContain("SWU");
    expect(ids).not.toContain("VANGUARD");
    expect(games.every((g) => g.isAvailable)).toBe(true);
  });
});
