import type { TcgType } from "@/types/judge";
import { gameSlugFromTcg } from "@/lib/judge-game-slug";

export type TcgLogo = { src: string; alt: string };

const BY_SLUG: Record<string, TcgLogo> = {
  mtg: { src: "/logos/magic-the-gathering.svg", alt: "Magic: The Gathering" },
  pokemon: { src: "/logos/pokemon-tcg.svg", alt: "Pokémon TCG" },
  yugioh: { src: "/logos/yu-gi-oh.svg", alt: "Yu-Gi-Oh!" },
  lorcana: { src: "/logos/lorcana.svg", alt: "Disney Lorcana" },
  onepiece: { src: "/logos/one-piece.svg", alt: "One Piece Card Game" },
  fab: { src: "/logos/flesh-and-blood.svg", alt: "Flesh and Blood" },
  digimon: { src: "/logos/digimon.svg", alt: "Digimon TCG" },
  gundam: { src: "/logos/gundam.svg", alt: "Gundam Card Game" },
  dbfw: { src: "/logos/dragon-ball.svg", alt: "Dragon Ball Fusion World" },
  sorcery: { src: "/logos/sorcery.svg", alt: "Sorcery: Contested Realm" },
  vanguard: { src: "/logos/cardfight-vanguard.svg", alt: "Cardfight!! Vanguard" },
  riftbound: { src: "/logos/riftbound.svg", alt: "Riftbound" },
  union_arena: { src: "/logos/union-arena.svg", alt: "Union Arena" },
  swu: { src: "/logos/star-wars-unlimited.svg", alt: "Star Wars Unlimited" },
};

const DEFAULT: TcgLogo = { src: "/logos/default-tcg.svg", alt: "TCG" };

export function getTcgLogo(tcg: TcgType): TcgLogo {
  const slug = gameSlugFromTcg(tcg);
  return BY_SLUG[slug] ?? DEFAULT;
}

export function getTcgLogoBySlug(slug: string): TcgLogo {
  return BY_SLUG[slug] ?? DEFAULT;
}
