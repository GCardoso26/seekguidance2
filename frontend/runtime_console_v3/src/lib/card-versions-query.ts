export interface CardVersionPrice {
  cents: number;
  currency: string;
}

export interface CardVersion {
  blueprint_id: number;
  expansion_id: number;
  expansion_name: string;
  expansion_code: string;
  expansion_release_date: string;
  collector_number: string;
  rarity: string;
  image_url: string;
  available_items: number;
  lowest_price: CardVersionPrice | null;
  highest_price: CardVersionPrice | null;
  foil_available: boolean;
  non_foil_available: boolean;
  card_id?: string;
}

export interface CardVersionsResponse {
  card_id: string;
  card_name: string;
  versions: CardVersion[];
  total_versions: number;
  total_items: number;
}
