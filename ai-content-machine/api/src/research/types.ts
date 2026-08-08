export type ProviderStatus = 'READY' | 'NOT_CONFIGURED' | 'ERROR'

export type ResearchInput = {
  workspaceId: string
  nicheId: string
  nicheName: string
  keywords: string[]
  promise?: string | null
}

export type ResearchResult = {
  provider: string
  sourceType: string
  sourceUrl: string
  sourceTitle: string
  sourceAuthor?: string
  publishedAt?: string
  title: string
  description: string
  keywords: string[]
  engagement?: { views?: number; likes?: number; comments?: number; score?: number }
  metadata?: Record<string, unknown>
  license?: string
  rawReference?: string
  reality: 'MOCK' | 'REAL' | 'NOT_CONFIGURED'
}

export interface ResearchProvider {
  name: string
  status: ProviderStatus
  search(input: ResearchInput): Promise<ResearchResult[]>
}

export type ScoreBreakdown = {
  demand: number
  trend: number
  engagement: number
  monetization: number
  contentFit: number
  competition: number
  freshness: number
}

export type TopicScoringConfig = {
  weights: ScoreBreakdown
}

export const DEFAULT_SCORING_CONFIG: TopicScoringConfig = {
  weights: {
    demand: 1,
    trend: 1.2,
    engagement: 1,
    monetization: 1.1,
    contentFit: 1.3,
    competition: 0.8,
    freshness: 0.9,
  },
}
