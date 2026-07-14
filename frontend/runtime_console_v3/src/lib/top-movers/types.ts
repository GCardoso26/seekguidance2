export type TopMoverCard = {
  card_id: string;
  name: string;
  set: string;
  game: string;
  price: number;
  delta_pct: number;
  volume: number;
  liquidity: number;
  sellers: number;
  listed_qty: number;
  spread: number;
  foil?: boolean;
  wishlist_count?: number;
  views?: number;
  last_sale?: string | null;
  badge?: string | null;
};

export type TopMoversResponse = {
  source: string;
  marts_used?: string[];
  window?: string;
  sort?: string;
  game?: string | null;
  summary?: {
    market_label?: string;
    gmv?: number;
    volume?: number;
    top_gainer?: TopMoverCard | null;
    top_loser?: TopMoverCard | null;
    trending_card?: TopMoverCard | null;
    product_health_score?: number | null;
    searches?: number;
    catalog_items?: number;
  };
  top_gainers?: TopMoverCard[];
  top_losers?: TopMoverCard[];
  most_sold?: TopMoverCard[];
  most_viewed?: TopMoverCard[];
  trending?: TopMoverCard[];
  most_wishlisted?: TopMoverCard[];
  highest_liquidity?: TopMoverCard[];
  fastest_growing?: TopMoverCard[];
  filtered?: TopMoverCard[];
  insights?: string[];
  query_ms?: number;
};

export type TopMoversQuery = {
  game?: string;
  period?: string;
  sort?: string;
  foil?: string;
  limit?: string;
};
