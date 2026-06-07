import type { TCGId } from "@/lib/game-log/schema";

export type { TCGId };

export type Decklist = {
  id: string;
  tcg: TCGId;
  format: string;
  name: string;
  player_id: string;
  main_deck: DeckCard[];
  sideboard?: DeckCard[];
  extra_deck?: DeckCard[];
  created_at: string;
  updated_at: string;
  validated_at?: string;
  validation_result?: ValidationResult;
};

export type DeckCard = {
  definition_id: string;
  name: string;
  quantity: number;
  set_code?: string;
  collector_number?: string;
};

export type ValidationError = {
  code: string;
  message: string;
  severity: "error" | "warning";
  cards_involved?: string[];
  rule_reference?: string;
};

export type ValidationWarning = ValidationError;

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  format_rules_applied: string;
  banlist_version: string;
};

export type FormatSpecialRule =
  | { type: "energy_ratio"; min: number; max: number }
  | { type: "inkable_ratio"; min: number; max: number }
  | { type: "leader_required"; quantity: number }
  | { type: "ride_deck_required"; size: number }
  | { type: "commander_required" }
  | { type: "domain_balance"; elements: string[]; min_each: number }
  | { type: "avatar_required" }
  | { type: "bounty_limit"; max: number };

export type FormatRules = {
  tcg: TCGId;
  format: string;
  min_cards: number;
  max_cards: number;
  max_copies: number;
  has_sideboard: boolean;
  sideboard_size?: number;
  has_extra_deck?: boolean;
  extra_deck_size?: number;
  special_rules?: FormatSpecialRule[];
};

export type BanlistEntry = "banned" | "restricted";

export type Banlist = {
  tcg: TCGId;
  format: string;
  version: string;
  cards: Map<string, BanlistEntry>;
};
