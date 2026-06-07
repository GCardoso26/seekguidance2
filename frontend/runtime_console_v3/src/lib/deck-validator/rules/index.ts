import type { FormatRules, TCGId } from "@/lib/deck-validator/schema";

const FORMAT_OVERRIDES: Partial<Record<string, Partial<FormatRules>>> = {
  "mtg:commander": { min_cards: 100, max_cards: 100, max_copies: 1, has_sideboard: false, special_rules: [{ type: "commander_required" }] },
  "mtg:draft": { min_cards: 40, max_cards: 999, has_sideboard: false },
  "mtg:sealed": { min_cards: 40, max_cards: 999, has_sideboard: false },
  "pokemon:expanded": { format: "expanded" },
  "lorcana:constructed": { format: "constructed" },
};

const STANDARD_RULES: Partial<Record<TCGId, FormatRules>> = {
  lorcana: {
    tcg: "lorcana",
    format: "constructed",
    min_cards: 60,
    max_cards: 60,
    max_copies: 4,
    has_sideboard: false,
    special_rules: [{ type: "inkable_ratio", min: 0, max: 999 }],
  },
  pokemon: {
    tcg: "pokemon",
    format: "standard",
    min_cards: 60,
    max_cards: 60,
    max_copies: 4,
    has_sideboard: false,
    special_rules: [{ type: "energy_ratio", min: 0, max: 999 }],
  },
  mtg: {
    tcg: "mtg",
    format: "standard",
    min_cards: 60,
    max_cards: 999,
    max_copies: 4,
    has_sideboard: true,
    sideboard_size: 15,
  },
  yugioh: {
    tcg: "yugioh",
    format: "standard",
    min_cards: 40,
    max_cards: 60,
    max_copies: 3,
    has_sideboard: true,
    sideboard_size: 15,
    has_extra_deck: true,
    extra_deck_size: 15,
  },
  vanguard: {
    tcg: "vanguard",
    format: "standard",
    min_cards: 50,
    max_cards: 50,
    max_copies: 4,
    has_sideboard: false,
    special_rules: [{ type: "ride_deck_required", size: 16 }],
  },
  one_piece: {
    tcg: "one_piece",
    format: "standard",
    min_cards: 50,
    max_cards: 50,
    max_copies: 4,
    has_sideboard: false,
    special_rules: [{ type: "leader_required", quantity: 1 }],
  },
  digimon: {
    tcg: "digimon",
    format: "standard",
    min_cards: 50,
    max_cards: 50,
    max_copies: 4,
    has_sideboard: false,
    special_rules: [{ type: "leader_required", quantity: 1 }],
  },
  swu: {
    tcg: "swu",
    format: "standard",
    min_cards: 50,
    max_cards: 50,
    max_copies: 3,
    has_sideboard: false,
    special_rules: [{ type: "bounty_limit", max: 999 }],
  },
};

const DEFAULT_RULE: FormatRules = {
  tcg: "lorcana",
  format: "standard",
  min_cards: 60,
  max_cards: 60,
  max_copies: 4,
  has_sideboard: false,
};

export function getFormatRules(tcg: TCGId, format: string): FormatRules {
  const base = STANDARD_RULES[tcg];
  const key = `${tcg}:${format.toLowerCase()}`;
  const override = FORMAT_OVERRIDES[key];
  if (!base) {
    return { ...DEFAULT_RULE, tcg, format, ...override };
  }
  return { ...base, format, ...override };
}
