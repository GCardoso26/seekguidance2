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

export const gameFilters: Record<string, FilterConfig> = {
  mtg: {
    colors: [
      { value: "W", label: "White", color: "#F9FAFB" },
      { value: "U", label: "Blue", color: "#3B82F6" },
      { value: "B", label: "Black", color: "#1F2937" },
      { value: "R", label: "Red", color: "#EF4444" },
      { value: "G", label: "Green", color: "#22C55E" },
    ],
    types: ["Creature", "Instant", "Sorcery", "Enchantment", "Artifact", "Land", "Planeswalker"],
    rarities: ["common", "uncommon", "rare", "mythic"],
  },
  pokemon: {
    types: ["Grass", "Fire", "Water", "Lightning", "Psychic", "Fighting", "Darkness", "Metal", "Dragon", "Colorless"],
    rarities: ["Common", "Uncommon", "Rare", "Rare Holo", "Rare Ultra", "Rare Secret"],
  },
  yugioh: {
    types: ["Normal", "Effect", "Ritual", "Fusion", "Synchro", "Xyz", "Pendulum", "Link", "Spell", "Trap"],
    attributes: ["DARK", "LIGHT", "EARTH", "WATER", "FIRE", "WIND", "DIVINE"],
  },
  lorcana: {
    types: ["Character", "Action", "Item", "Song", "Location"],
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
};
