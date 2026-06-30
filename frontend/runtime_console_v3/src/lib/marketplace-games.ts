/** Lista compacta de jogos para filtros do marketplace (evita importar GAME_TOKENS). */
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
