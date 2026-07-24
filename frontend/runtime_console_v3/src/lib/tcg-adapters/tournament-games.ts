/**
 * Lightweight tournament game list — do not import adapters from here.
 * ADR-016: SWU hard-exited from product ecosystem, removed from tournament games.
 */
export const TOURNAMENT_GAMES = [
  { code: "POKEMON" as const, slug: "pokemon", name: "Pokémon TCG", icon: "pokemon" },
  { code: "LORCANA" as const, slug: "lorcana", name: "Disney Lorcana", icon: "lorcana" },
  { code: "MTG" as const, slug: "mtg", name: "Magic: The Gathering", icon: "mtg" },
] as const;
