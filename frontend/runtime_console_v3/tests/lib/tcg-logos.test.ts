import { describe, expect, it } from "vitest";
import { gameSlugFromTcg } from "@/lib/judge-game-slug";
import { ALL_TCG_LOGO_SLUGS, getTcgLogo, getTcgLogoBySlug, getTcgLogoDimensions } from "@/lib/tcg-logos";
import { TCG_OPTIONS } from "@/types/judge";

describe("tcg-logos", () => {
  it("mapeia os 14 slugs de jogo", () => {
    expect(ALL_TCG_LOGO_SLUGS).toHaveLength(14);
    for (const game of TCG_OPTIONS) {
      const slug = gameSlugFromTcg(game.id);
      const logo = getTcgLogo(game.id);
      expect(logo.src).toMatch(/^\/logos\/.+\.svg$/);
      expect(logo.alt.length).toBeGreaterThan(2);
      expect(getTcgLogoBySlug(slug).src).toBe(logo.src);
    }
  });

  it("usa dimensões 120 default e 64 compact", () => {
    expect(getTcgLogoDimensions("default")).toEqual({ width: 120, height: 120 });
    expect(getTcgLogoDimensions("compact")).toEqual({ width: 64, height: 64 });
  });

  it("todos os 14 jogos com SVG dedicado em /public/logos", () => {
    for (const game of TCG_OPTIONS) {
      const slug = gameSlugFromTcg(game.id);
      const logo = getTcgLogo(game.id);
      expect(logo.src).toMatch(/^\/logos\/.+\.svg$/);
      expect(logo.src).not.toBe("/logos/default-tcg.svg");
      expect(getTcgLogoBySlug(slug).src).toBe(logo.src);
    }
  });
});
