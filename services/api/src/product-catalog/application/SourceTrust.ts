/**
 * Source Trust V2 — expanded hierarchy. Never replace higher trust; never replace store_product.
 */

export type SourceTypeV2 =
  | "publisher_api"
  | "publisher_cdn"
  | "official_site"
  | "official_manufacturer"
  | "official_manifest"
  | "distributor_feed"
  | "liga_portal"
  | "community_verified"
  | "seller_upload";

/** Keep SourceType alias for V1 callers. */
export type SourceType = SourceTypeV2;

export const SOURCE_TRUST_V2: Record<SourceTypeV2, number> = {
  publisher_api: 100,
  publisher_cdn: 95,
  official_site: 90,
  official_manufacturer: 85,
  official_manifest: 80,
  distributor_feed: 70,
  liga_portal: 60,
  community_verified: 50,
  seller_upload: 20,
};

/** @deprecated use SOURCE_TRUST_V2 — kept for V2 compatibility */
export const SOURCE_TRUST = SOURCE_TRUST_V2;

export function sourcePriority(type: SourceTypeV2): number {
  return SOURCE_TRUST_V2[type];
}

export function inferSourceType(providerId: string): SourceTypeV2 {
  const id = providerId.toLowerCase();
  if (id.includes("liga")) return "liga_portal";
  if (id.includes("seller") || id.includes("store")) return "seller_upload";
  if (id.includes("community")) return "community_verified";
  // TCGCSV / TCGplayer catalog — below official manufacturer/manifest (ADR-016 priority).
  if (id.includes("tcgcsv") || id.includes("tcgplayer")) return "distributor_feed";
  if (id.includes("distributor") || id.includes("feed") || id.includes("shopify")) {
    return "distributor_feed";
  }
  if (id.includes("cdn") || id.includes("images.wizards") || id.includes("pokemon.com")) {
    return "publisher_cdn";
  }
  if (
    id.includes("scryfall") ||
    id.includes("pokemon") ||
    id.includes("lorcana") ||
    id.includes("ygopro") ||
    id.includes("-sealed") ||
    id.includes("api")
  ) {
    return "publisher_api";
  }
  if (id.includes("official-site") || id.includes("wizards") || id.includes("bandai-site")) {
    return "official_site";
  }
  if (
    id.includes("dragon-shield") ||
    id.includes("ultimate-guard") ||
    id.includes("ultra-pro") ||
    id.includes("heavy-play") ||
    id.includes("gamegenic") ||
    id.includes("central") ||
    id.includes("manufacturer")
  ) {
    return "official_manufacturer";
  }
  return "official_manifest";
}

/**
 * Replace only when incoming trust is strictly higher.
 * Never replace seller uploads (store_product).
 */
export function shouldReplaceOfficialAsset(opts: {
  existingPriority: number;
  incomingPriority: number;
  existingEntityType: string;
}): boolean {
  if (opts.existingEntityType === "store_product") return false;
  return opts.incomingPriority > opts.existingPriority;
}
