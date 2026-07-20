/**
 * GameConfiguration — config por Provider (não é bounded context novo).
 * Seller/Buyer leem via getGameConfig(gameCode); proibido if(game===…) no core.
 *
 * MarketProfile + GameCapabilities: reduzem condicionais por TCG e preparam R3/R4.
 */

export type GameConfigOption = {
  value: string;
  label: string;
  color?: string;
};

export type GameFilterFacet = {
  id: string;
  label: string;
  options: GameConfigOption[];
};

export type SellerWizardCopy = {
  searchPlaceholder: string;
  conditionHint: string;
  finishHint: string;
  emptyInventoryHint: string;
};

/** Perfil de mercado / allowlist — alinhado a ADR-012 / ADR-013. */
export type MarketProfile = {
  /** Release na allowlist comercial */
  releaseTier: "R1" | "R2" | "R3" | "R4" | "denylist" | "unlisted";
  /** Mercado-alvo principal do experimento */
  primaryMarket: "BR" | "LATAM" | "GLOBAL";
  /** Hipótese de liquidez (texto curto; não é North Star) */
  liquidityHypothesis: string;
  /** Tamanho alvo da watchlist operacional */
  watchlistTargetSize: number;
  /** Provider catalog canônico (factory key sem game) */
  catalogProviderId: string;
};

/**
 * Capacidades de produto/UX do jogo (não confundir com ProviderCapabilities de sync).
 * UI usa estes flags em vez de if (game === …).
 */
export type GameCapabilities = {
  foil: boolean;
  etched: boolean;
  serialized: boolean;
  reverseHolo: boolean;
  collectorNumber: boolean;
  multiLanguageListings: boolean;
  competitiveFormats: boolean;
  commanderStyle: boolean;
  enchantedStyleRarities: boolean;
  sealedProduct: boolean;
};

export type GameConfiguration = {
  gameCode: string;
  displayName: string;
  market: MarketProfile;
  capabilities: GameCapabilities;
  rarities: GameConfigOption[];
  languages: GameConfigOption[];
  conditions: GameConfigOption[];
  finishes: GameConfigOption[];
  formats: GameConfigOption[];
  watchlistCardNames: string[];
  searchSynonyms: Record<string, string[]>;
  filterFacets: GameFilterFacet[];
  sellerWizardCopy: SellerWizardCopy;
};
