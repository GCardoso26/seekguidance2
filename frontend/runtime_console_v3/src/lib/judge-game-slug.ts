import type { TcgType } from "@/types/judge";

const TCG_TO_GAME_SLUG: Partial<Record<TcgType, string>> = {
  magic: "mtg",
  pokemon: "pokemon",
  lorcana: "lorcana",
  yugioh: "yugioh",
  one_piece: "onepiece",
  flesh_and_blood: "fab",
  digimon: "digimon",
  gundam: "gundam",
  dragon_ball: "dbfw",
  sorcery: "sorcery",
  vanguard: "vanguard",
  riftbound: "riftbound",
  union_arena: "union_arena",
  star_wars_unlimited: "swu",
};

export function gameSlugFromTcg(tcg: TcgType): string {
  return TCG_TO_GAME_SLUG[tcg] ?? tcg.replace(/-/g, "_");
}
