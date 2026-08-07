import { describe, expect, it } from "vitest";
import {
  getGameTheme,
  gameThemeCssVars,
  listAllGameThemes,
} from "@/lib/experience/game-theme";
import { ALL_GAME_IDS, PRODUCT_GAME_IDS } from "@/lib/tcg-tokens";
import { gameIdFromSlug } from "@/lib/tcg-tokens";

describe("Theme Engine V2", () => {
  it("exposes identity for every supported GameId", () => {
    for (const id of ALL_GAME_IDS) {
      const theme = getGameTheme(id);
      expect(theme.gameId).toBe(id);
      expect(theme.surfaces.bg).toBeTruthy();
      expect(theme.surfaces.mood).toMatch(/dark|light|mixed/);
      expect(theme.typography.display).toBeTruthy();
      expect(theme.hero.animation).toBeTruthy();
      expect(theme.hero.tagline).toBeTruthy();
      expect(theme.marketplace.skin).toBeTruthy();
      expect(theme.motion.hoverGlow).toBeTruthy();
    }
    expect(listAllGameThemes()).toHaveLength(PRODUCT_GAME_IDS.length);
  });

  it("excludes ADR-016 hard-exited games from the product theme listing", () => {
    const ids = listAllGameThemes().map((t) => t.gameId);
    expect(ids).not.toContain("SWU");
    expect(ids).not.toContain("VANGUARD");
    expect(ids).not.toContain("UARENA");
    expect(ids).toContain("GUNDAM");
  });

  it("keeps Pokémon light and Magic dark — clearly distinct", () => {
    const pokemon = getGameTheme("POKEMON");
    const mtg = getGameTheme("MTG");
    expect(pokemon.surfaces.mood).toBe("light");
    expect(mtg.surfaces.mood).toBe("dark");
    expect(pokemon.surfaces.bg).not.toBe(mtg.surfaces.bg);
    expect(pokemon.marketplace.skin).not.toBe(mtg.marketplace.skin);
  });

  it("injects V2 CSS variables", () => {
    const vars = gameThemeCssVars(getGameTheme("LORCANA")) as Record<string, string>;
    expect(vars["--game-font-display"]).toContain("serif");
    expect(vars["--game-marketplace-skin"]).toBe("inklands");
    expect(vars["--game-card-radius"]).toBeTruthy();
  });

  it("picks CTA foreground with WCAG AA against primary (Pokemon yellow)", () => {
    const pokemon = getGameTheme("POKEMON");
    const vars = gameThemeCssVars(pokemon) as Record<string, string>;
    expect(vars["--game-cta-fg"]).toBe("#0f172a");
    // Galeria: portal não sobrescreve --foreground; só injeta selo de taxonomia
    expect(vars["--foreground"]).toBeUndefined();
    expect(vars["--tcg-seal"]).toMatch(/^\d+ \d+% \d+%$/);
    expect(vars["--tcg-accent"]).toBe(vars["--tcg-seal"]);
  });

  it("keeps white CTA on dark primaries (MTG)", () => {
    const vars = gameThemeCssVars(getGameTheme("MTG")) as Record<string, string>;
    expect(vars["--game-cta-fg"]).toBe("#ffffff");
  });

  it("resolves Epic 6 slug aliases", () => {
    expect(gameIdFromSlug("magic")).toBe("MTG");
    expect(gameIdFromSlug("star-wars")).toBe("SWU");
    expect(gameIdFromSlug("dragon-ball")).toBe("DBFW");
  });
});
