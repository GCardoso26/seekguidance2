export type DecklistReview = {
  id: string;
  rating: number;
  comment?: string;
  title?: string;
  handle?: string;
  display_name?: string;
};

export type DecklistDetail = {
  id: string;
  name: string;
  game_code: string;
  format: string;
  description?: string;
  price_cents: number;
  sales_count: number;
  average_rating?: number;
  decklist_data: Record<string, unknown>;
  seller_handle?: string;
  seller_name?: string;
  reviews: DecklistReview[];
};
