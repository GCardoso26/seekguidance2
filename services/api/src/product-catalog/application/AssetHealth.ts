/**
 * Asset Health Engine — extends Coverage Analytics (no Analytics BC).
 */

export interface AssetHealthComponent {
  key: string;
  label: string;
  weight: number;
  ok: boolean;
}

export interface AssetHealthScore {
  scorePct: number;
  components: AssetHealthComponent[];
}

export const ASSET_HEALTH_COMPONENTS: Array<{ key: string; label: string; weight: number }> = [
  { key: "original", label: "Original", weight: 6 },
  { key: "thumb", label: "Thumb", weight: 5 },
  { key: "hero", label: "Hero", weight: 8 },
  { key: "gallery", label: "Gallery", weight: 6 },
  { key: "webp", label: "WebP", weight: 6 },
  { key: "avif", label: "AVIF", weight: 4 },
  { key: "jpeg", label: "JPEG", weight: 4 },
  { key: "blur", label: "Blur", weight: 4 },
  { key: "lqip", label: "LQIP", weight: 4 },
  { key: "responsive", label: "Responsive", weight: 4 },
  { key: "cdn", label: "CDN", weight: 6 },
  { key: "metadata", label: "Metadata", weight: 5 },
  { key: "alt", label: "Alt", weight: 4 },
  { key: "hash", label: "Hash", weight: 5 },
  { key: "width", label: "Width", weight: 3 },
  { key: "height", label: "Height", weight: 3 },
  { key: "aspectRatio", label: "Aspect Ratio", weight: 3 },
  { key: "crop", label: "Crop", weight: 2 },
  { key: "background", label: "Background", weight: 2 },
  { key: "verifiedSource", label: "Verified Source", weight: 5 },
  { key: "sourceTrust", label: "Source Trust", weight: 6 },
  { key: "versionHistory", label: "Version History", weight: 4 },
  { key: "qualityScore", label: "Quality Score", weight: 5 },
];

export function computeAssetHealthScore(flags: Record<string, boolean>): AssetHealthScore {
  const components: AssetHealthComponent[] = ASSET_HEALTH_COMPONENTS.map((c) => ({
    ...c,
    ok: Boolean(flags[c.key]),
  }));
  const totalWeight = components.reduce((a, c) => a + c.weight, 0);
  const earned = components.reduce((a, c) => a + (c.ok ? c.weight : 0), 0);
  const scorePct = totalWeight ? Math.round((earned / totalWeight) * 1000) / 10 : 0;
  return { scorePct, components };
}

export interface AssetHealthReport {
  overall: number;
  perPublisher: Array<{ name: string; healthPct: number; assets: number }>;
  perManufacturer: Array<{ name: string; healthPct: number; assets: number }>;
  perGame: Array<{ code: string; healthPct: number; assets: number }>;
  perExpansion: Array<{ name: string; healthPct: number; assets: number }>;
  perAssetType: Array<{ type: string; healthPct: number; assets: number }>;
  orphans: number;
  duplicates: number;
  missingHero: number;
  missingGallery: number;
  missingDerivatives: number;
  missingMetadata: number;
  qualityDistribution: Array<{ bucket: string; count: number }>;
  trustDistribution: Array<{ trust: number; count: number }>;
  generatedAt: string;
}
