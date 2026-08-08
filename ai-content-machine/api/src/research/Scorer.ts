import type { ResearchResult, ScoreBreakdown, TopicScoringConfig } from './types.js'
import { DEFAULT_SCORING_CONFIG } from './types.js'

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)))
}

export function scoreTopic(
  result: ResearchResult,
  nicheKeywords: string[],
  config: TopicScoringConfig = DEFAULT_SCORING_CONFIG,
): { score: number; breakdown: ScoreBreakdown } {
  const eng = result.engagement?.score ?? 0
  const views = result.engagement?.views ?? 0
  const text = `${result.title} ${result.description} ${result.keywords.join(' ')}`.toLowerCase()
  const fitHits = nicheKeywords.filter((k) => text.includes(k.toLowerCase())).length
  const contentFit = nicheKeywords.length
    ? clamp((fitHits / nicheKeywords.length) * 100)
    : 70

  const breakdown: ScoreBreakdown = {
    demand: clamp(40 + Math.min(views / 200, 50)),
    trend: clamp((eng || 0.5) * 100),
    engagement: clamp(30 + Math.min((result.engagement?.likes ?? 0) / 20, 60)),
    monetization: /renda|dinheiro|vender|afiliad|produto|kit/i.test(text) ? 80 : 55,
    contentFit,
    competition: clamp(100 - fitHits * 15), // more niche overlap → slightly higher competition pressure inverse for MVP
    freshness: result.publishedAt ? 85 : 60,
  }

  // competition dimension: higher means "more competitive" so invert in weighted sum contribution
  const competitionAdvantage = 100 - breakdown.competition

  const w = config.weights
  const totalWeight =
    w.demand + w.trend + w.engagement + w.monetization + w.contentFit + w.competition + w.freshness
  const weighted =
    (breakdown.demand * w.demand +
      breakdown.trend * w.trend +
      breakdown.engagement * w.engagement +
      breakdown.monetization * w.monetization +
      breakdown.contentFit * w.contentFit +
      competitionAdvantage * w.competition +
      breakdown.freshness * w.freshness) /
    totalWeight

  return { score: clamp(weighted), breakdown }
}
