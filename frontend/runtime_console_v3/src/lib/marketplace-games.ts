/** Jogos suportados no header picker (CardTrader-style). */
import { GAME_TOKENS, PRODUCT_GAME_IDS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

/** ADR-016: SWU, Union Arena e Vanguard tiveram hard-exit do ecossistema de produto. */
export const MARKETPLACE_GAME_OPTIONS = [
  { id: "MTG", name: "Magic: The Gathering" },
  { id: "POKEMON", name: "Pokémon TCG" },
  { id: "YGO", name: "Yu-Gi-Oh!" },
  { id: "LORCANA", name: "Disney Lorcana" },
  { id: "ONEPIECE", name: "One Piece" },
  { id: "FAB", name: "Flesh and Blood" },
  { id: "DIGIMON", name: "Digimon TCG" },
  { id: "RIFTBOUND", name: "Riftbound" },
  { id: "SORCERY", name: "Sorcery" },
  { id: "DBFW", name: "Dragon Ball Fusion World" },
  { id: "GUNDAM", name: "Gundam Card Game" },
] as const;

export const SUPPORTED_GAMES = PRODUCT_GAME_IDS.map((id: GameId) => {
  const t = GAME_TOKENS[id];
  return {
    id,
    slug: t.slug,
    name: t.name,
    short_name: t.name.split(":")[0].split(" ")[0],
    logo_url: t.logo,
  };
});
