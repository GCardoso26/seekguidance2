import type { GameId } from "@/types/card";
import { isProductEcosystemDenied } from "@/lib/product-game-allowlist";

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
    logo: "/logos/mtg.webp",
    name: "Magic: The Gathering",
    slug: "mtg",
  },
  POKEMON: {
    primary: "#FFCB05",
    secondary: "#3B4CCA",
    logo: "/logos/pokemon.webp",
    name: "Pokémon TCG",
    slug: "pokemon",
  },
  YGO: {
    primary: "#8B0000",
    secondary: "#FFD700",
    logo: "/logos/yugioh.webp",
    name: "Yu-Gi-Oh!",
    slug: "yugioh",
  },
  LORCANA: {
    primary: "#1E3A8A",
    secondary: "#F59E0B",
    logo: "/logos/lorcana.webp",
    name: "Disney Lorcana",
    slug: "lorcana",
  },
  ONEPIECE: {
    primary: "#DC2626",
    secondary: "#1F2937",
    logo: "/logos/onepiece.webp",
    name: "One Piece",
    slug: "onepiece",
  },
  FAB: {
    primary: "#7C2D12",
    secondary: "#FEF3C7",
    logo: "/logos/fab.webp",
    name: "Flesh and Blood",
    slug: "fab",
  },
  DIGIMON: {
    primary: "#0EA5E9",
    secondary: "#1E40AF",
    logo: "/logos/digimon.webp",
    name: "Digimon TCG",
    slug: "digimon",
  },
  SWU: {
    primary: "#374151",
    secondary: "#EF4444",
    logo: "/logos/swu.webp",
    name: "Star Wars: Unlimited",
    slug: "swu",
  },
  RIFTBOUND: {
    primary: "#C89B3C",
    secondary: "#0A1428",
    logo: "/logos/riftbound.svg",
    name: "Riftbound",
    slug: "riftbound",
  },
  SORCERY: {
    primary: "#7C3AED",
    secondary: "#1E1B4B",
    logo: "/logos/sorcery.webp",
    name: "Sorcery: Contested Realms",
    slug: "sorcery",
  },
  UARENA: {
    primary: "#2563EB",
    secondary: "#1E3A8A",
    logo: "/logos/union-arena.svg",
    name: "Union Arena",
    slug: "union-arena",
  },
  DBFW: {
    primary: "#F97316",
    secondary: "#1F2937",
    logo: "/logos/dbfw.webp",
    name: "Dragon Ball Fusion World",
    slug: "dbfw",
  },
  VANGUARD: {
    primary: "#22D3EE",
    secondary: "#155E75",
    logo: "/logos/vanguard.webp",
    name: "Cardfight!! Vanguard",
    slug: "vanguard",
  },
  GUNDAM: {
    primary: "#EF4444",
    secondary: "#1F2937",
    logo: "/logos/gundam.svg",
    name: "Gundam Card Game",
    slug: "gundam",
  },
};

export const ALL_GAME_IDS = Object.keys(GAME_TOKENS) as GameId[];

/**
 * Jogos elegíveis para o ecossistema de produto (ADR-016 hard-exit).
 * Use esta lista — e não `ALL_GAME_IDS` — em qualquer lugar voltado ao usuário
 * (marketplace, seller, torneios, busca, onboarding).
 */
export const PRODUCT_GAME_IDS = ALL_GAME_IDS.filter((id) => !isProductEcosystemDenied(id));

/** Human-friendly aliases → GameId (Epic 6 Game Identity). */
const SLUG_ALIASES: Record<string, GameId> = {
  magic: "MTG",
  magicthegathering: "MTG",
  mtg: "MTG",
  pokemon: "POKEMON",
  pokémon: "POKEMON",
  yugioh: "YGO",
  ygo: "YGO",
  lorcana: "LORCANA",
  disneylorcana: "LORCANA",
  onepiece: "ONEPIECE",
  swu: "SWU",
  starwars: "SWU",
  starwarsunlimited: "SWU",
  digimon: "DIGIMON",
  riftbound: "RIFTBOUND",
  dbfw: "DBFW",
  dragonball: "DBFW",
  dragonballfusionworld: "DBFW",
  fab: "FAB",
  fleshandblood: "FAB",
  sorcery: "SORCERY",
  unionarena: "UARENA",
  vanguard: "VANGUARD",
  cardfightvanguard: "VANGUARD",
  gundam: "GUNDAM",
  gundamcardgame: "GUNDAM",
};

export function gameIdFromSlug(slug: string): GameId | null {
  const raw = slug.toLowerCase().trim();
  const normalized = raw.replace(/-/g, "");
  if (SLUG_ALIASES[normalized]) return SLUG_ALIASES[normalized];
  const entry = ALL_GAME_IDS.find(
    (id) => GAME_TOKENS[id].slug.replace(/-/g, "") === normalized,
  );
  return entry ?? null;
}

export function gameSlugFromId(gameId: GameId): string {
  return GAME_TOKENS[gameId].slug;
}
