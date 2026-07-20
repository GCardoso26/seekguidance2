import { getGameConfig } from "@/lib/game-config";

export interface FilterOption {
  value: string;
  label: string;
  color?: string;
}

export interface FilterConfig {
  colors?: FilterOption[];
  types?: string[];
  rarities?: string[];
  attributes?: string[];
}

function fromGameConfig(slug: string): FilterConfig | undefined {
  const cfg = getGameConfig(slug);
  if (!cfg) return undefined;
  return {
    colors: cfg.colors,
    types: cfg.types,
    rarities: cfg.rarities.map((r) => r.value),
  };
}

/** Filtros por jogo — R2 configs (lorcana/mtg/pokemon) via GameConfig; demais legado. */
export const gameFilters: Record<string, FilterConfig> = {
  mtg: fromGameConfig("mtg")!,
  magic: fromGameConfig("mtg")!,
  pokemon: fromGameConfig("pokemon")!,
  lorcana: fromGameConfig("lorcana")!,
  yugioh: {
    types: ["Normal", "Effect", "Ritual", "Fusion", "Synchro", "Xyz", "Pendulum", "Link", "Spell", "Trap"],
    attributes: ["DARK", "LIGHT", "EARTH", "WATER", "FIRE", "WIND", "DIVINE"],
  },
  onepiece: {
    types: ["Leader", "Character", "Event", "Stage"],
  },
  fab: {
    types: ["Hero", "Weapon", "Equipment", "Action", "Attack Reaction", "Defense Reaction", "Instant"],
  },
  digimon: {
    types: ["Digimon", "Tamer", "Option", "Digi-Egg"],
  },
  riftbound: {
    types: ["Unit", "Spell", "Gear", "Champion", "Battlefield"],
    rarities: ["common", "uncommon", "rare", "epic", "legendary"],
  },
  sorcery: {
    types: ["Minion", "Avatar", "Artifact", "Site", "Aura", "Magic"],
    rarities: ["Ordinary", "Exceptional", "Elite", "Unique"],
  },
  dbfw: {
    types: ["Leader", "Battle", "Extra"],
    rarities: ["Common", "Uncommon", "Rare", "Super Rare", "Secret Rare"],
  },
};

/** Configuração estendida para filtros avançados na loja (por slug de jogo). */
export const advancedFilters: Record<
  string,
  FilterConfig & { conditions?: string[]; priceRange?: { min: number; max: number } }
> = {
  magic: {
    ...gameFilters.mtg,
    conditions: ["NM", "LP", "MP", "HP", "DMG"],
    priceRange: { min: 0, max: 50000 },
  },
  mtg: {
    ...gameFilters.mtg,
    conditions: ["NM", "LP", "MP", "HP", "DMG"],
    priceRange: { min: 0, max: 50000 },
  },
  pokemon: {
    ...gameFilters.pokemon,
    conditions: ["NM", "LP", "MP", "HP", "DMG"],
    priceRange: { min: 0, max: 10000 },
  },
  lorcana: {
    ...gameFilters.lorcana,
    conditions: ["NM", "LP", "MP", "HP", "DMG"],
    priceRange: { min: 0, max: 10000 },
  },
  yugioh: {
    ...gameFilters.yugioh,
    conditions: ["NM", "LP", "MP", "HP", "DMG"],
    priceRange: { min: 0, max: 10000 },
  },
  riftbound: {
    ...gameFilters.riftbound,
    conditions: ["NM", "LP", "MP", "HP", "DMG"],
    priceRange: { min: 0, max: 5000 },
  },
  sorcery: {
    ...gameFilters.sorcery,
    conditions: ["NM", "LP", "MP", "HP", "DMG"],
    priceRange: { min: 0, max: 5000 },
  },
  dbfw: {
    ...gameFilters.dbfw,
    conditions: ["NM", "LP", "MP", "HP", "DMG"],
    priceRange: { min: 0, max: 5000 },
  },
};
