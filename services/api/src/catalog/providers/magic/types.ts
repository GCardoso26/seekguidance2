/** Tipos Scryfall usados pelo CatalogProvider MTG (sem preços). */

export interface ScryfallSet {
  id: string;
  code: string;
  name: string;
  released_at?: string;
  card_count?: number;
  digital?: boolean;
}

export interface ScryfallCard {
  id: string;
  name: string;
  set: string;
  collector_number?: string;
  rarity?: string;
  lang?: string;
  oracle_text?: string;
  type_line?: string;
  artist?: string;
  legalities?: Record<string, string>;
  image_uris?: { normal?: string; large?: string; png?: string };
  card_faces?: Array<{
    image_uris?: { normal?: string };
    oracle_text?: string;
    type_line?: string;
  }>;
  finishes?: string[];
  foil?: boolean;
  nonfoil?: boolean;
}
