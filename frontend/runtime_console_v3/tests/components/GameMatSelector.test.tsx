import { describe, expect, it } from "vitest";
import { gameSlugFromTcg } from "@/lib/judge-game-slug";
import { getTcgLogo } from "@/lib/tcg-logos";
import { TCG_OPTIONS } from "@/types/judge";

describe("GameMatSelector logos", () => {
  it("cada opção TCG tem logo com alt acessível", () => {
    for (const game of TCG_OPTIONS) {
      const logo = getTcgLogo(game.id);
      expect(logo.alt).toBeTruthy();
      expect(logo.width).toBeGreaterThan(0);
      expect(logo.height).toBeGreaterThan(0);
    }
  });

  it("slugs esperados batem com ficheiros em public/logos", () => {
    const expected: Record<string, string> = {
      magic: "/logos/mtg.svg",
      pokemon: "/logos/pokemon.svg",
      yugioh: "/logos/yugioh.svg",
      lorcana: "/logos/lorcana.svg",
      one_piece: "/logos/onepiece.svg",
      flesh_and_blood: "/logos/fab.svg",
      digimon: "/logos/digimon.svg",
      gundam: "/logos/gundam.svg",
      dragon_ball: "/logos/dbfw.svg",
      sorcery: "/logos/sorcery.svg",
      vanguard: "/logos/vanguard.svg",
      riftbound: "/logos/riftbound.svg",
      union_arena: "/logos/union-arena.svg",
      star_wars_unlimited: "/logos/swu.svg",
    };

    for (const game of TCG_OPTIONS) {
      expect(getTcgLogo(game.id).src).toBe(expected[game.id]);
      expect(gameSlugFromTcg(game.id)).toBeTruthy();
    }
  });
});
