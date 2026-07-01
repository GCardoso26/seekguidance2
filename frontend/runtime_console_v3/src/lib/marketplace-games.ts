/** Jogos suportados no header picker (CardTrader-style). */
import { GAME_TOKENS, ALL_GAME_IDS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

export const MARKETPLACE_GAME_OPTIONS = [
  { id: "MTG", name: "Magic: The Gathering" },
  { id: "POKEMON", name: "Pokémon TCG" },
  { id: "YGO", name: "Yu-Gi-Oh!" },
  { id: "LORCANA", name: "Disney Lorcana" },
  { id: "ONEPIECE", name: "One Piece" },
  { id: "FAB", name: "Flesh and Blood" },
  { id: "DIGIMON", name: "Digimon TCG" },
  { id: "SWU", name: "Star Wars: Unlimited" },
  { id: "RIFTBOUND", name: "Riftbound" },
  { id: "SORCERY", name: "Sorcery" },
  { id: "UARENA", name: "Union Arena" },
  { id: "DBFW", name: "Dragon Ball Fusion World" },
  { id: "VANGUARD", name: "Cardfight!! Vanguard" },
] as const;

export const SUPPORTED_GAMES = ALL_GAME_IDS.map((id: GameId) => {
  const t = GAME_TOKENS[id];
  return {
    id,
    slug: t.slug,
    name: t.name,
    short_name: t.name.split(":")[0].split(" ")[0],
    logo_url: t.logo,
  };
});
