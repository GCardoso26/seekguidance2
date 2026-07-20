/**
 * GameConfiguration (FE) — espelho do contrato API R2.
 * Lookup por slug/código; seller/buyer sem if(game===…) hardcoded de rarities.
 */

export type GameConfigOption = {
  value: string;
  label: string;
  color?: string;
};

export type GameFilterFacet = {
  id: string;
  label: string;
  options: GameConfigOption[];
};

export type SellerWizardCopy = {
  searchPlaceholder: string;
  conditionHint: string;
  finishHint: string;
  emptyInventoryHint: string;
};

export type MarketProfile = {
  releaseTier: "R1" | "R2" | "R3" | "R4" | "denylist" | "unlisted";
  primaryMarket: "BR" | "LATAM" | "GLOBAL";
  liquidityHypothesis: string;
  watchlistTargetSize: number;
  catalogProviderId: string;
};

export type GameCapabilities = {
  foil: boolean;
  etched: boolean;
  serialized: boolean;
  reverseHolo: boolean;
  collectorNumber: boolean;
  multiLanguageListings: boolean;
  competitiveFormats: boolean;
  commanderStyle: boolean;
  enchantedStyleRarities: boolean;
  sealedProduct: boolean;
};

export type GameConfiguration = {
  gameCode: string;
  slugs: string[];
  displayName: string;
  market: MarketProfile;
  capabilities: GameCapabilities;
  rarities: GameConfigOption[];
  languages: GameConfigOption[];
  conditions: GameConfigOption[];
  finishes: GameConfigOption[];
  formats: GameConfigOption[];
  watchlistCardNames: string[];
  searchSynonyms: Record<string, string[]>;
  filterFacets: GameFilterFacet[];
  sellerWizardCopy: SellerWizardCopy;
  /** Compat com game-filters legado */
  types?: string[];
  colors?: GameConfigOption[];
};

const DEFAULT_CONDITIONS: GameConfigOption[] = [
  { value: "NM", label: "Near Mint" },
  { value: "LP", label: "Lightly Played" },
  { value: "MP", label: "Moderately Played" },
  { value: "HP", label: "Heavily Played" },
  { value: "DM", label: "Damaged" },
];

export const GAME_CONFIGS: GameConfiguration[] = [
  {
    gameCode: "LORCANA",
    slugs: ["lorcana", "disney-lorcana"],
    displayName: "Disney Lorcana",
    market: {
      releaseTier: "R1",
      primaryMarket: "BR",
      liquidityHypothesis: "Lorcana BR gera LPC recorrente como beachhead",
      watchlistTargetSize: 20,
      catalogProviderId: "lorcana-dataset",
    },
    capabilities: {
      foil: true,
      etched: false,
      serialized: false,
      reverseHolo: false,
      collectorNumber: true,
      multiLanguageListings: true,
      competitiveFormats: true,
      commanderStyle: false,
      enchantedStyleRarities: true,
      sealedProduct: false,
    },
    rarities: [
      { value: "common", label: "Common", color: "#9CA3AF" },
      { value: "uncommon", label: "Uncommon", color: "#22C55E" },
      { value: "rare", label: "Rare", color: "#3B82F6" },
      { value: "super_rare", label: "Super Rare", color: "#8B5CF6" },
      { value: "legendary", label: "Legendary", color: "#F59E0B" },
      { value: "enchanted", label: "Enchanted", color: "#EC4899" },
      { value: "promo", label: "Promo", color: "#EF4444" },
    ],
    languages: [
      { value: "en", label: "Inglês" },
      { value: "pt", label: "Português" },
    ],
    conditions: DEFAULT_CONDITIONS,
    finishes: [
      { value: "nonfoil", label: "Non-foil" },
      { value: "foil", label: "Foil" },
    ],
    formats: [{ value: "core", label: "Core Constructed" }],
    watchlistCardNames: [
      "Rapunzel – Gifted with Healing",
      "Be Prepared",
      "Diablo – Loyal Henchman",
    ],
    searchSynonyms: {
      rapunzel: ["rapunzel gifted", "gifted with healing"],
      prepared: ["be prepared"],
      diablo: ["diablo loyal"],
      maui: ["maui hero"],
      elsa: ["elsa snow", "enchanted elsa"],
    },
    filterFacets: [],
    types: ["Character", "Action", "Item", "Song", "Location"],
    sellerWizardCopy: {
      searchPlaceholder: "Buscar carta Lorcana (ex.: Rapunzel)",
      conditionHint: "Condição da single Lorcana",
      finishHint: "Foil ou non-foil",
      emptyInventoryHint: "Publique staples da watchlist Lorcana",
    },
  },
  {
    gameCode: "MTG",
    slugs: ["mtg", "magic"],
    displayName: "Magic: The Gathering",
    market: {
      releaseTier: "R2",
      primaryMarket: "BR",
      liquidityHypothesis: "Modelo Lorcana se repete em MTG",
      watchlistTargetSize: 30,
      catalogProviderId: "scryfall",
    },
    capabilities: {
      foil: true,
      etched: true,
      serialized: true,
      reverseHolo: false,
      collectorNumber: true,
      multiLanguageListings: true,
      competitiveFormats: true,
      commanderStyle: true,
      enchantedStyleRarities: false,
      sealedProduct: false,
    },
    rarities: [
      { value: "common", label: "Common", color: "#9CA3AF" },
      { value: "uncommon", label: "Uncommon", color: "#22C55E" },
      { value: "rare", label: "Rare", color: "#3B82F6" },
      { value: "mythic", label: "Mythic", color: "#EF4444" },
      { value: "special", label: "Special", color: "#F59E0B" },
    ],
    languages: [
      { value: "en", label: "Inglês" },
      { value: "pt", label: "Português" },
      { value: "ja", label: "Japonês" },
      { value: "es", label: "Espanhol" },
    ],
    conditions: DEFAULT_CONDITIONS,
    finishes: [
      { value: "nonfoil", label: "Non-foil" },
      { value: "foil", label: "Foil" },
      { value: "etched", label: "Etched" },
      { value: "serialized", label: "Serialized" },
    ],
    formats: [
      { value: "commander", label: "Commander" },
      { value: "modern", label: "Modern" },
      { value: "legacy", label: "Legacy" },
    ],
    watchlistCardNames: ["Sol Ring", "Cyclonic Rift", "Lightning Bolt", "Force of Will"],
    searchSynonyms: {
      bolt: ["lightning bolt"],
      sol: ["sol ring"],
      rift: ["cyclonic rift"],
      fow: ["force of will"],
      brainstorm: ["brainstorm"],
    },
    filterFacets: [
      {
        id: "finish",
        label: "Acabamento",
        options: [
          { value: "foil", label: "Foil" },
          { value: "etched", label: "Etched" },
          { value: "serialized", label: "Serialized" },
        ],
      },
      {
        id: "format",
        label: "Formato",
        options: [
          { value: "commander", label: "Commander" },
          { value: "modern", label: "Modern" },
          { value: "legacy", label: "Legacy" },
        ],
      },
    ],
    types: ["Creature", "Instant", "Sorcery", "Enchantment", "Artifact", "Land", "Planeswalker"],
    colors: [
      { value: "W", label: "White", color: "#F9FAFB" },
      { value: "U", label: "Blue", color: "#3B82F6" },
      { value: "B", label: "Black", color: "#1F2937" },
      { value: "R", label: "Red", color: "#EF4444" },
      { value: "G", label: "Green", color: "#22C55E" },
    ],
    sellerWizardCopy: {
      searchPlaceholder: "Buscar carta MTG (ex.: Sol Ring)",
      conditionHint: "Condição da single Magic",
      finishHint: "Non-foil, Foil, Etched ou Serialized",
      emptyInventoryHint: "Publique staples Commander/Modern da watchlist MTG",
    },
  },
  {
    gameCode: "POKEMON",
    slugs: ["pokemon", "pokémon"],
    displayName: "Pokémon TCG",
    market: {
      releaseTier: "R2",
      primaryMarket: "BR",
      liquidityHypothesis: "Modelo Lorcana se repete em Pokémon",
      watchlistTargetSize: 25,
      catalogProviderId: "pokemon-dataset",
    },
    capabilities: {
      foil: true,
      etched: false,
      serialized: false,
      reverseHolo: true,
      collectorNumber: true,
      multiLanguageListings: true,
      competitiveFormats: true,
      commanderStyle: false,
      enchantedStyleRarities: false,
      sealedProduct: false,
    },
    rarities: [
      { value: "Common", label: "Common", color: "#9CA3AF" },
      { value: "Uncommon", label: "Uncommon", color: "#22C55E" },
      { value: "Rare", label: "Rare", color: "#3B82F6" },
      { value: "Rare Holo", label: "Rare Holo", color: "#6366F1" },
      { value: "Illustration Rare", label: "Illustration Rare", color: "#EC4899" },
      { value: "Special Illustration Rare", label: "Special Illustration Rare", color: "#F59E0B" },
      { value: "ACE SPEC", label: "ACE SPEC", color: "#EF4444" },
    ],
    languages: [
      { value: "en", label: "Inglês" },
      { value: "pt", label: "Português" },
      { value: "ja", label: "Japonês" },
    ],
    conditions: DEFAULT_CONDITIONS,
    finishes: [
      { value: "nonholo", label: "Non-Holo" },
      { value: "holo", label: "Holo" },
      { value: "reverse_holo", label: "Reverse Holo" },
    ],
    formats: [
      { value: "standard", label: "Standard" },
      { value: "expanded", label: "Expanded" },
    ],
    watchlistCardNames: ["Pikachu", "Charizard ex", "Professor's Research", "Ultra Ball"],
    searchSynonyms: {
      pika: ["pikachu"],
      char: ["charizard", "charizard ex"],
      zard: ["charizard ex"],
      prof: ["professor's research"],
      ultra: ["ultra ball"],
      boss: ["boss's orders"],
      ir: ["illustration rare"],
      sir: ["special illustration rare"],
    },
    filterFacets: [
      {
        id: "finish",
        label: "Acabamento",
        options: [
          { value: "holo", label: "Holo" },
          { value: "reverse_holo", label: "Reverse Holo" },
        ],
      },
    ],
    types: [
      "Grass",
      "Fire",
      "Water",
      "Lightning",
      "Psychic",
      "Fighting",
      "Darkness",
      "Metal",
      "Dragon",
      "Colorless",
    ],
    sellerWizardCopy: {
      searchPlaceholder: "Buscar carta Pokémon (ex.: Charizard ex)",
      conditionHint: "Condição da single Pokémon",
      finishHint: "Holo, Reverse Holo ou Non-Holo",
      emptyInventoryHint: "Publique staples Standard da watchlist Pokémon",
    },
  },
];

export function getGameConfig(gameOrSlug: string | undefined | null): GameConfiguration | undefined {
  if (!gameOrSlug) return undefined;
  const key = gameOrSlug.trim().toLowerCase();
  return GAME_CONFIGS.find(
    (c) =>
      c.gameCode.toLowerCase() === key ||
      c.slugs.includes(key) ||
      c.slugs.some((s) => s === key),
  );
}

export function getGameConfigOrFallback(gameOrSlug: string | undefined | null): GameConfiguration {
  return getGameConfig(gameOrSlug) ?? GAME_CONFIGS.find((c) => c.gameCode === "LORCANA")!;
}
