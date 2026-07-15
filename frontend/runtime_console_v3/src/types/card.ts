export type GameId =
  | "MTG"
  | "POKEMON"
  | "YGO"
  | "LORCANA"
  | "ONEPIECE"
  | "FAB"
  | "DIGIMON"
  | "SWU"
  | "RIFTBOUND"
  | "SORCERY"
  | "UARENA"
  | "DBFW"
  | "VANGUARD";

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
  typeLine?: string | null;
  types?: string[];
  subtypes?: string[];
  finishes?: string[];
  erratas?: Array<{ date: string; text: string; source?: string }>;
  manaCost?: string | null;
  cmc?: number | null;
  colors?: string[] | string | null;
  power?: string | null;
  toughness?: string | null;
}

export interface CardMarketSummary {
  listedQuantity: number;
  storeCount: number;
  bestOffer: number | null;
  currency: string;
  avgPrice?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  suggestedPrice?: number | null;
  demandSignal?: string;
  soldVolume?: number | string | null;
  sellVelocity?: string | null;
  popularity?: string | null;
  competitiveness?: string | null;
  avgSellerTrust?: number | null;
}

export interface CardSellerAiHints {
  suggestedPrice?: number | null;
  demand?: string;
  competitiveness?: string;
  velocityHint?: string;
}

export interface CardIntelligenceRelated {
  sameSet: UnifiedCard[];
  alternatives: UnifiedCard[];
  staples: UnifiedCard[];
  upgrades: UnifiedCard[];
  downgrades: UnifiedCard[];
  frequentlyTogether: UnifiedCard[];
  commanderHints: UnifiedCard[];
}

export interface CardVariantSummary {
  id: string;
  name: string;
  language: string;
  setCode?: string;
  setName?: string;
  number?: string;
  rarity?: string;
  imageUrl?: string;
  finishes?: string[];
  lowestPrice?: number | null;
  kind?: string;
}

export interface CardIntelligenceResponse {
  cardId: string;
  taxonomy: {
    typeLine?: string | null;
    types?: string[];
    subtypes?: string[];
    finishes?: string[];
    erratas?: Array<{ date: string; text: string; source?: string }>;
  };
  related: CardIntelligenceRelated;
  variants: CardVariantSummary[];
  marketStats: {
    sampleCount: number;
    minPrice: number | null;
    maxPrice: number | null;
    avgPrice: number | null;
    daysWithData: number;
    demandSignal: string;
  };
  sellerAiHints: CardSellerAiHints;
  generatedAt: string;
  source: string;
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
  productId?: string;
  storeId?: string;
  cardName?: string;
  setName?: string;
}

export interface CardDetailResponse {
  card: UnifiedCard;
  priceHistory: PriceHistoryPoint[];
  listings: CardListing[];
  relatedCards: UnifiedCard[];
  marketSummary?: CardMarketSummary | null;
  intelligence?: {
    sellerAiHints?: CardSellerAiHints | null;
    variantsCount?: number;
    staplesCount?: number;
  } | null;
}

export interface CatalogSearchResponse {
  source: "meilisearch" | "postgres";
  cards: UnifiedCard[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  /** Soft-degrade from BFF when upstream is down/rate-limited. */
  degraded?: boolean;
  error?: string;
  upstream_status?: number;
  message?: string;
  retryAfter?: number;
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
