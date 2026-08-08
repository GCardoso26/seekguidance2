export type HookType =
  | 'CURIOSITY'
  | 'QUESTION'
  | 'CONTRARIAN'
  | 'WARNING'
  | 'RESULT'
  | 'LIST'
  | 'SECRET'
  | 'MISTAKE'
  | 'COMPARISON'
  | 'STORY'

export type HookCandidate = {
  text: string
  type: HookType
  score: number
  reason: string
}

export type StructuredScript = {
  hook: string
  setup: string
  problem: string
  insight: string
  value: string
  proof: string
  cta: string
}

export type PlatformKey = 'YOUTUBE_SHORT' | 'TIKTOK' | 'INSTAGRAM_REEL' | 'PINTEREST'

export type PlatformScriptProfile = {
  key: PlatformKey
  targetDurationSec: number
  ctaStyle: string
  captionStyle: string
  language: string
  hashtagCount: number
}

export type ScriptGenerationContext = {
  niche: { id: string; name: string; promise?: string | null }
  targetAudience: string
  topic?: { id: string; title: string } | null
  contentIdea: { id: string; title: string; angles: string[]; hooks: string[] }
  angle: string
  brandVoice: Record<string, unknown>
  platform: PlatformKey
  targetDuration: number
  winningHooks: string[]
  winningTopics: string[]
  previousPerformance: Array<{ title: string; class: string; score: number }>
  offer?: { id: string; name: string; price_cents: number } | null
  ctaStrategy: string
}

export type QualityBreakdown = {
  hookStrength: number
  clarity: number
  novelty: number
  retentionPotential: number
  platformFit: number
  ctaQuality: number
  factualRisk: number
}
