export type PublicationStatus =
  | 'QUEUED'
  | 'VALIDATING'
  | 'SCHEDULED'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REQUIRES_REVIEW'

export type PublicationPlatform =
  | 'YOUTUBE_SHORT'
  | 'TIKTOK'
  | 'INSTAGRAM_REEL'
  | 'PINTEREST'

export type PublicationMetadata = {
  title: string
  description: string
  caption: string
  hashtags: string[]
  tags: string[]
  category: string
  language: string
  thumbnail?: string
  video?: string
  scheduledAt?: string | null
}

export type ValidationResult = {
  ok: boolean
  issues: string[]
  requiresReview?: boolean
}

export type PublicationResult = {
  ok: boolean
  reality: 'MOCK' | 'FAILED' | 'PENDING'
  externalId?: string
  externalUrl?: string
  publishedAt?: string
  scheduledAt?: string
  error?: string
  confirmation?: string
}

export type CanonicalMetrics = {
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  watchTime: number
  averageViewDuration: number
  completionRate: number
  followersGained: number
  clicks: number
  conversions: number
}

export type WinnerState = 'INSUFFICIENT_DATA' | 'TRACKING' | 'WINNER' | 'NORMAL' | 'LOSER'

export type ContentDNA = {
  topic: string
  hook: string
  structure: string[]
  duration: number
  platform: string
  visualStyle: string
  captionStyle: string
  cta: string
  performance: WinnerState
  score: number
}

export type WinnerCriteria = {
  minimumViews: number
  minimumAgeHours: number
  minimumCompletionRate: number
  minimumEngagementRate: number
  minimumScore: number
  loserMaxScore: number
}

export type PerformanceWeights = {
  completionRate: number
  engagementRate: number
  shareRate: number
  saveRate: number
  conversionRate: number
}

export const DEFAULT_WINNER_CRITERIA: WinnerCriteria = {
  minimumViews: 500,
  minimumAgeHours: 0, // mock/tests: allow immediate; production config can raise to 6/24/48
  minimumCompletionRate: 0.4,
  minimumEngagementRate: 0.05,
  minimumScore: 65,
  loserMaxScore: 35,
}

export const DEFAULT_PERFORMANCE_WEIGHTS: PerformanceWeights = {
  completionRate: 0.3,
  engagementRate: 0.25,
  shareRate: 0.15,
  saveRate: 0.15,
  conversionRate: 0.15,
}
