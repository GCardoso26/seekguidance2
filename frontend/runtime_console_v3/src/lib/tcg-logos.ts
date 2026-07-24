import type { TcgType } from "@/types/judge";
import { gameSlugFromTcg } from "@/lib/judge-game-slug";

export type TcgLogoMeta = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

const LOGO_SIZE = 120;
const COMPACT_SIZE = 64;

export const TCG_LOGOS: Record<string, TcgLogoMeta> = {
  mtg: { src: "/logos/mtg.svg", alt: "Magic: The Gathering", width: LOGO_SIZE, height: LOGO_SIZE },
  pokemon: { src: "/logos/pokemon.svg", alt: "Pokémon TCG", width: LOGO_SIZE, height: LOGO_SIZE },
  yugioh: { src: "/logos/yugioh.svg", alt: "Yu-Gi-Oh!", width: LOGO_SIZE, height: LOGO_SIZE },
  lorcana: { src: "/logos/lorcana.svg", alt: "Disney Lorcana", width: LOGO_SIZE, height: LOGO_SIZE },
  onepiece: { src: "/logos/onepiece.svg", alt: "One Piece Card Game", width: LOGO_SIZE, height: LOGO_SIZE },
  fab: { src: "/logos/fab.svg", alt: "Flesh and Blood", width: LOGO_SIZE, height: LOGO_SIZE },
  digimon: { src: "/logos/digimon.svg", alt: "Digimon TCG", width: LOGO_SIZE, height: LOGO_SIZE },
  gundam: { src: "/logos/gundam.svg", alt: "Gundam Card Game", width: LOGO_SIZE, height: LOGO_SIZE },
  dbfw: { src: "/logos/dbfw.svg", alt: "Dragon Ball Fusion World", width: LOGO_SIZE, height: LOGO_SIZE },
  sorcery: { src: "/logos/sorcery.svg", alt: "Sorcery: Contested Realm", width: LOGO_SIZE, height: LOGO_SIZE },
  riftbound: { src: "/logos/riftbound.svg", alt: "Riftbound", width: LOGO_SIZE, height: LOGO_SIZE },
  // ADR-016: vanguard / union_arena / swu removidos das listas de produto.
};

const DEFAULT: TcgLogoMeta = {
  src: "/logos/default-tcg.svg",
  alt: "TCG",
  width: LOGO_SIZE,
  height: LOGO_SIZE,
};

export function getTcgLogoBySlug(gameSlug: string): TcgLogoMeta {
  return TCG_LOGOS[gameSlug] ?? DEFAULT;
}

export function getTcgLogo(tcg: TcgType): TcgLogoMeta {
  return getTcgLogoBySlug(gameSlugFromTcg(tcg));
}

export function getTcgLogoDimensions(variant: "default" | "compact"): Pick<TcgLogoMeta, "width" | "height"> {
  const size = variant === "compact" ? COMPACT_SIZE : LOGO_SIZE;
  return { width: size, height: size };
}

export const ALL_TCG_LOGO_SLUGS = Object.keys(TCG_LOGOS);
