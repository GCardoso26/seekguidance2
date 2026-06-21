import type { GameId } from "@/types/card";

export interface GameToken {
  primary: string;
  secondary: string;
  logo: string;
  name: string;
  slug: string;
}

export const GAME_TOKENS: Record<GameId, GameToken> = {
  MTG: {
    primary: "#C41E3A",
    secondary: "#1A1A1A",
    logo: "/logos/mtg.svg",
    name: "Magic: The Gathering",
    slug: "mtg",
  },
  POKEMON: {
    primary: "#FFCB05",
    secondary: "#3B4CCA",
    logo: "/logos/pokemon.svg",
    name: "Pokémon TCG",
    slug: "pokemon",
  },
  YGO: {
    primary: "#8B0000",
    secondary: "#FFD700",
    logo: "/logos/yugioh.svg",
    name: "Yu-Gi-Oh!",
    slug: "yugioh",
  },
  LORCANA: {
    primary: "#1E3A8A",
    secondary: "#F59E0B",
    logo: "/logos/lorcana.svg",
    name: "Disney Lorcana",
    slug: "lorcana",
  },
  ONEPIECE: {
    primary: "#DC2626",
    secondary: "#1F2937",
    logo: "/logos/onepiece.svg",
    name: "One Piece",
    slug: "onepiece",
  },
  FAB: {
    primary: "#7C2D12",
    secondary: "#FEF3C7",
    logo: "/logos/fab.svg",
    name: "Flesh and Blood",
    slug: "fab",
  },
  DIGIMON: {
    primary: "#0EA5E9",
    secondary: "#1E40AF",
    logo: "/logos/digimon.svg",
    name: "Digimon TCG",
    slug: "digimon",
  },
  SWU: {
    primary: "#374151",
    secondary: "#EF4444",
    logo: "/logos/swu.svg",
    name: "Star Wars: Unlimited",
    slug: "swu",
  },
};

export const ALL_GAME_IDS = Object.keys(GAME_TOKENS) as GameId[];

export function gameIdFromSlug(slug: string): GameId | null {
  const normalized = slug.toLowerCase().replace(/-/g, "");
  const entry = ALL_GAME_IDS.find((id) => GAME_TOKENS[id].slug === normalized);
  return entry ?? null;
}

export function gameSlugFromId(gameId: GameId): string {
  return GAME_TOKENS[gameId].slug;
}
