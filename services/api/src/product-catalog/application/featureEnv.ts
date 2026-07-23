/** Feature flags via env (sem SQL cross-schema). Default off. */
export function isProductCatalogFlagOn(envKey: string): boolean {
  const v = (process.env[envKey] ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

export const FF_CENTRAL_DRIVE_API = "PRODUCT_CATALOG_CENTRAL_DRIVE_API";
export const FF_LIGA_IMAGE_FALLBACK = "PRODUCT_CATALOG_LIGA_IMAGE_FALLBACK";
export const FF_PUBLISHER_OFFICIAL_SITES = "PRODUCT_CATALOG_PUBLISHER_OFFICIAL_SITES";
