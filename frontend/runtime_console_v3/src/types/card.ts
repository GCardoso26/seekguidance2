export type GameId =
  | "MTG"
  | "POKEMON"
  | "YGO"
  | "LORCANA"
  | "ONEPIECE"
  | "FAB"
  | "DIGIMON"
  | "SWU";

export type Rarity = "common" | "uncommon" | "rare" | "mythic" | "special";

export type CardLegalityStatus = "legal" | "not_legal" | "banned" | "restricted";

export interface CardLatestPrice {
  price: number;
  currency: string;
  condition: string;
  foil: boolean;
  source: string;
  timestamp?: string;
}

export interface UnifiedCard {
  id: string;
  externalIds?: {
    scryfall?: string;
    tcgplayer?: string;
    pokemonTcgApi?: string;
    ygoprodeck?: string;
    lorcanaApi?: string;
  };
  game: GameId | string;
  set: {
    id?: string;
    name: string;
    code: string;
    releaseDate?: string;
    totalCards?: number;
  };
  name: string;
  normalizedName?: string;
  number: string;
  rarity: Rarity | string;
  imageUris: {
    small?: string;
    normal?: string;
    large?: string;
    artCrop?: string;
  };
  language: string;
  gameData: Record<string, unknown>;
  source?: string;
  lastUpdated?: string;
  version?: number;
  isReprint?: boolean;
  originalCardId?: string;
  latestPrice?: CardLatestPrice;
  priceTrend7d?: number;
  priceTrend30d?: number;
  lowestPrice?: number;
  listingCount?: number;
  oracleText?: string;
  flavorText?: string;
  artist?: string;
  legalities?: Record<string, CardLegalityStatus>;
  rulings?: Array<{ date: string; text: string }>;
  pricesByCondition?: Array<{
    condition: string;
    foil: boolean;
    price: number;
    currency: string;
    listingCount: number;
  }>;
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
  condition: string;
  foil: boolean;
  volume?: number;
}

export interface CardListing {
  id: string;
  cardId: string;
  sellerId: string;
  sellerName: string;
  sellerReputation: number;
  sellerAvatar?: string;
  condition: "NM" | "LP" | "MP" | "HP" | "DM";
  price: number;
  currency: string;
  quantity: number;
  foil: boolean;
  language: string;
  description?: string;
  images?: string[];
  createdAt: string;
}

export interface CardDetailResponse {
  card: UnifiedCard;
  priceHistory: PriceHistoryPoint[];
  listings: CardListing[];
  relatedCards: UnifiedCard[];
}

export interface CatalogSearchResponse {
  source: "meilisearch" | "postgres";
  cards: UnifiedCard[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export type CatalogHealthStatus = "ready_for_marketplace" | "loading" | "unavailable";

export interface CatalogHealthReport {
  status?: CatalogHealthStatus;
  total_cards: number;
  by_game: Record<string, number>;
  missing_images: Array<{ game: string; count: number }>;
  missing_prices: Array<{ game: string; count: number }>;
  last_sync: Record<string, string>;
  ready_for_marketplace: boolean;
  meilisearch?: "ok" | "disabled";
}
