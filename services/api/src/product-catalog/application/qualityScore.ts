export interface QualityBreakdown {
  hasDescription: boolean;
  hasImages: boolean;
  hasAttributes: boolean;
  hasEan: boolean;
  hasSku: boolean;
  hasCollection: boolean;
  hasManufacturer: boolean;
  hasTranslations: boolean;
}

export interface QualityScoreResult {
  score: number;
  breakdown: QualityBreakdown & { weights: Record<string, number> };
}

const WEIGHTS = {
  hasDescription: 15,
  hasImages: 25,
  hasAttributes: 10,
  hasEan: 15,
  hasSku: 10,
  hasCollection: 10,
  hasManufacturer: 10,
  hasTranslations: 5,
} as const;

export function computeQualityScore(input: QualityBreakdown): QualityScoreResult {
  let score = 0;
  for (const [key, weight] of Object.entries(WEIGHTS) as [keyof typeof WEIGHTS, number][]) {
    if (input[key]) score += weight;
  }
  return {
    score,
    breakdown: { ...input, weights: { ...WEIGHTS } },
  };
}
