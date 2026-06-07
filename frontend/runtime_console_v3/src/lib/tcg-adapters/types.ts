export type GameCode = "POKEMON" | "LORCANA" | "MTG" | "SWU";

export type TournamentFormat = {
  code: string;
  name: string;
  description?: string;
  decklist_required: boolean;
  decklist_validation: boolean;
  default_timer_minutes: number;
  default_match_type: "BO1" | "BO3" | "BO5" | "FFA";
  default_swiss_rounds: string;
  default_top_cut?: number | null;
  min_players?: number;
  max_players?: number;
};

export type TournamentGame = {
  code: GameCode;
  slug: string;
  name: string;
  icon: string;
};

export type UnifiedCard = {
  id: string;
  game: GameCode;
  externalId: string;
  name: string;
  normalizedName: string;
  setCode?: string;
  type?: string;
  legality?: Record<string, string>;
  imageUrl?: string;
};

export type DeckCard = {
  definition_id: string;
  name: string;
  quantity: number;
  set_code?: string;
  collector_number?: string;
  card_type?: string;
};

export type ParsedDecklist = {
  tcg: string;
  format: string;
  main_deck: DeckCard[];
  sideboard?: DeckCard[];
  commander?: DeckCard;
};

export type ValidationResult = {
  valid: boolean;
  errors: { code: string; message: string; severity: string }[];
  warnings: { code: string; message: string; severity: string }[];
  format_rules_applied: string;
  banlist_version: string;
};

export type SideboardRules = { maxSize: number; swapRule: string } | null;

export interface GameAdapter {
  code: GameCode;
  name: string;
  slug: string;
  supportedFormats: TournamentFormat[];
  parseDecklist(raw: string, format: string): ParsedDecklist;
  getDecklistHint(format: string): string;
  getMaxCopies(format: string): number;
  getMinDeckSize(format: string): number;
  getMaxDeckSize(format: string): number | null;
  getSideboardRules(format: string): SideboardRules;
}
