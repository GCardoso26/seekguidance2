export type IdeaScoreBreakdown = {
  curiosity: number
  emotional_value: number
  visual_potential: number
  originality: number
  audience_fit: number
  short_potential: number
  rights_risk: number
  repetition_risk: number
}

export type ScoredIdea = {
  title: string
  angle: string
  hooks: string[]
  formats: string[]
  scores: IdeaScoreBreakdown
  composite: number
  reviewRequired: boolean
}

export type TitleScoreBreakdown = {
  curiosity: number
  clarity: number
  specificity: number
  promise: number
  emotion: number
  click_potential: number
  honesty: number
}

export type ScoredTitle = {
  title: string
  scores: TitleScoreBreakdown
  composite: number
  reviewRequired: boolean
  dishonestClickbait: boolean
}

export type RightsClass =
  | 'ORIGINAL'
  | 'PUBLIC_DOMAIN'
  | 'LICENSED'
  | 'USER_OWNED'
  | 'UNKNOWN'
  | 'RESTRICTED'

export type RightsVerdict = {
  classification: RightsClass
  publishable: boolean
  autoPublishBlocked: boolean
  credits: string[]
  findings: string[]
  reviewRequired: boolean
}

export type OriginalityVerdict = {
  originalityScore: number
  repetitionScore: number
  reviewRequired: boolean
  findings: string[]
  matches: Array<{ kind: string; text: string; score: number }>
}

export type ThumbnailScoreBreakdown = {
  clarity: number
  curiosity: number
  contrast: number
  subject: number
  emotion: number
  composition: number
  mobile_readability: number
  brand_consistency: number
}

export type ThumbnailVerdict = {
  concept: string
  prompt: string
  negativePrompt: string
  scores: ThumbnailScoreBreakdown
  composite: number
  reviewRequired: boolean
}

export type ShortStructure = {
  hook: string
  context: string
  escalation: string
  payoff: string
  cta: string
}

export type LongFormStructure = {
  hook: string
  context: string
  open_loop: string
  act_1: string
  escalation: string
  act_2: string
  revelation: string
  act_3: string
  payoff: string
  cta: string
}

export type DryRunStagePlan = {
  stage: string
  provider: string
  status: 'READY' | 'NOT_CONFIGURED' | 'ERROR' | 'SKIP' | 'DONE'
  expectedOutput: string
  dependencies: string[]
  estimatedWork: string
  skipReason?: string
}

export const IDEA_REVIEW_COMPOSITE_MIN = 55
export const TITLE_HONESTY_MIN = 60
export const TITLE_COMPOSITE_MIN = 55
export const ORIGINALITY_MIN = 45
export const REPETITION_MAX = 55
export const THUMBNAIL_COMPOSITE_MIN = 60
