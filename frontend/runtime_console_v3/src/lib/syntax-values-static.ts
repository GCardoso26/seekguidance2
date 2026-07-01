export type SyntaxValueOption = {
  value: string;
  count: number;
  highlight?: string | null;
};

export type SyntaxValuesResponse = {
  field: string;
  game: string;
  query: string;
  values: SyntaxValueOption[];
  total: number;
};

const STATIC_VALUES: Record<string, Record<string, string[]>> = {
  mtg: {
    color: ["W", "U", "B", "R", "G", "C", "M", "White", "Blue", "Black", "Red", "Green", "Colorless", "Multicolor"],
    rarity: ["common", "uncommon", "rare", "mythic", "special", "bonus", "land"],
    type: ["Creature", "Instant", "Sorcery", "Enchantment", "Artifact", "Planeswalker", "Land", "Battle"],
    set: ["Dominaria United", "Modern Horizons 3", "Outlaws of Thunder Junction", "Bloomburrow", "Commander Masters"],
    artist: ["John Avon", "Terese Nielsen", "Seb McKinnon"],
    grading_company: ["PSA", "BGS", "CGC", "SGC", "ACE"],
  },
  pokemon: {
    color: ["Grass", "Fire", "Water", "Lightning", "Psychic", "Fighting", "Darkness", "Metal", "Fairy", "Dragon", "Colorless"],
    rarity: ["Common", "Uncommon", "Rare", "Rare Holo", "Ultra Rare", "Secret Rare", "Promo"],
    type: ["Pokemon", "Trainer", "Energy"],
    set: ["Scarlet & Violet", "Paldea Evolved", "Obsidian Flames"],
  },
};

const COLOR_LABELS: Record<string, string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
  C: "Colorless",
  M: "Multicolor",
};

function highlightText(value: string, query: string): string | null {
  if (!query) return null;
  const idx = value.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return null;
  const before = value.slice(0, idx);
  const match = value.slice(idx, idx + query.length);
  const after = value.slice(idx + query.length);
  return `${before}<b>${match}</b>${after}`;
}

export function getStaticSyntaxValues(
  field: string,
  game: string,
  q: string,
  limit: number,
): SyntaxValuesResponse {
  const gameKey = game.toLowerCase();
  const fieldKey = field.toLowerCase();
  const pool = STATIC_VALUES[gameKey]?.[fieldKey] ?? STATIC_VALUES.mtg?.[fieldKey] ?? [];
  const query = q.trim().toLowerCase();

  let filtered = pool;
  if (query) {
    filtered = pool.filter((v) => v.toLowerCase().includes(query));
  }

  const values: SyntaxValueOption[] = filtered.slice(0, limit).map((value) => {
    const label =
      fieldKey === "color" && COLOR_LABELS[value] ? `${value} (${COLOR_LABELS[value]})` : value;
    return {
      value,
      count: 0,
      highlight:
        highlightText(label, q) ??
        (fieldKey === "color" && COLOR_LABELS[value] ? label : undefined),
    };
  });

  return {
    field: fieldKey,
    game: gameKey,
    query: q,
    values,
    total: values.length,
  };
}
