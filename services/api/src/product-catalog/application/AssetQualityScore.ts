/**
 * Asset Quality Score 0–100 — stored in existing asset metadata (no new table / no Asset BC change).
 * Computed in Product Catalog before/after ingest and passed via ingest metadata.
 */

export interface AssetQualitySignals {
  hasHero?: boolean;
  hasThumb?: boolean;
  hasGallery?: boolean;
  hasWebp?: boolean;
  hasAvif?: boolean;
  hasJpegFallback?: boolean;
  hasBlur?: boolean;
  hasLqip?: boolean;
  hasAltText?: boolean;
  backgroundRemoved?: boolean;
  aspectRatioOk?: boolean;
  resolutionOk?: boolean;
  compressionOk?: boolean;
  onCdn?: boolean;
  responsive?: boolean;
  lazyReady?: boolean;
}

export const ASSET_QUALITY_WEIGHTS: Record<keyof AssetQualitySignals, number> = {
  hasHero: 10,
  hasThumb: 8,
  hasGallery: 10,
  hasWebp: 8,
  hasAvif: 6,
  hasJpegFallback: 5,
  hasBlur: 5,
  hasLqip: 5,
  hasAltText: 5,
  backgroundRemoved: 4,
  aspectRatioOk: 6,
  resolutionOk: 12,
  compressionOk: 4,
  onCdn: 6,
  responsive: 4,
  lazyReady: 2,
};

export interface AssetQualityScoreResult {
  score: number;
  breakdown: Record<string, { weight: number; hit: boolean; points: number }>;
}

export function computeAssetQualityScore(signals: AssetQualitySignals): AssetQualityScoreResult {
  const breakdown: AssetQualityScoreResult["breakdown"] = {};
  let score = 0;
  for (const [key, weight] of Object.entries(ASSET_QUALITY_WEIGHTS) as Array<
    [keyof AssetQualitySignals, number]
  >) {
    const hit = Boolean(signals[key]);
    const points = hit ? weight : 0;
    breakdown[key] = { weight, hit, points };
    score += points;
  }
  return { score: Math.min(100, score), breakdown };
}

/** Infer signals from pipeline derivatives + ingest context (no Asset BC mutation). */
export function inferQualitySignals(input: {
  role?: string;
  alt?: string | null;
  cdnUrl?: string | null;
  blurhash?: string | null;
  width?: number | null;
  height?: number | null;
  derivatives?: Record<string, unknown> | null;
  mediaType?: string | null;
}): AssetQualitySignals {
  const d = input.derivatives ?? {};
  const formats = (d.formats as Record<string, unknown> | undefined) ?? d;
  const hasFormat = (name: string) =>
    Boolean(
      formats[name] ||
        (formats as { webp?: unknown }).webp ||
        Object.keys(d).some((k) => k.toLowerCase().includes(name)),
    );

  const w = input.width ?? 0;
  const h = input.height ?? 0;
  const aspect = w > 0 && h > 0 ? w / h : 0;

  return {
    hasHero: input.role === "hero" || input.mediaType === "HERO" || input.role === "primary",
    hasThumb: true,
    hasGallery: input.role === "gallery" || input.mediaType?.includes("GALLERY") === true,
    hasWebp: hasFormat("webp") || Boolean(input.cdnUrl?.includes(".webp")),
    hasAvif: hasFormat("avif"),
    hasJpegFallback: hasFormat("jpeg") || hasFormat("jpg") || true,
    hasBlur: Boolean(input.blurhash),
    hasLqip: Boolean((d._meta as { lqip?: string } | undefined)?.lqip) || Boolean(input.blurhash),
    hasAltText: Boolean(input.alt?.trim()),
    backgroundRemoved: input.mediaType === "ACCESSORY_TRANSPARENT",
    aspectRatioOk: aspect > 0.4 && aspect < 3,
    resolutionOk: w >= 400 || h >= 400 || Boolean(input.cdnUrl),
    compressionOk: true,
    onCdn: Boolean(input.cdnUrl),
    responsive: hasFormat("webp") || Object.keys(d).length > 0,
    lazyReady: Boolean(input.blurhash) || Boolean((d._meta as { lqip?: string } | undefined)?.lqip),
  };
}
