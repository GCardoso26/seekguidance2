import type { UnifiedCard } from "@/types/card";

export type DeckZone = "main" | "sideboard" | "commander" | "companion";

export type DeckCardEntry = {
  id: string;
  card_id: string;
  quantity: number;
  zone: DeckZone;
  is_foil: boolean;
  card: UnifiedCard;
};

export type DeckOwner = {
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

export type Deck = {
  id: string;
  name: string;
  description?: string | null;
  game: string;
  game_id?: string | null;
  format: string;
  format_id?: string | null;
  owner_id: string;
  is_public: boolean;
  is_validated?: boolean | null;
  validation_errors?: string[];
  total_cards: number;
  total_price: number;
  likes: number;
  views: number;
  created_at?: string | null;
  updated_at?: string | null;
  owner?: DeckOwner | null;
  main_deck: DeckCardEntry[];
  sideboard: DeckCardEntry[];
  commander: DeckCardEntry[];
  companion: DeckCardEntry[];
};

export type CreateDeckInput = {
  name: string;
  game: string;
  game_id?: string;
  format?: string;
  format_id?: string;
  description?: string;
  is_public?: boolean;
};

export type DeckBuilderZoneId = "main" | "sideboard" | "commander";

export type DeckFormat = {
  id: string;
  slug: string;
  name: string;
  display_name: string;
  rules: Record<string, unknown>;
};

export type DeckValidation = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};
