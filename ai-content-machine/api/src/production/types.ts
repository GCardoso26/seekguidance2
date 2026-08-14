export type ProductionStatus =
  | 'QUEUED'
  | 'PLANNING'
  | 'VOICE'
  | 'VISUALS'
  | 'SUBTITLES'
  | 'COMPOSING'
  | 'THUMBNAIL'
  | 'QA'
  | 'STORAGE'
  | 'COMPLETED'
  | 'PARTIAL'
  | 'FAILED'
  | 'REQUIRES_REVIEW'
  | 'CANCELLED'

export type ProductionStage =
  | 'PLANNING'
  | 'VOICE'
  | 'VISUALS'
  | 'SUBTITLES'
  | 'COMPOSING'
  | 'THUMBNAIL'
  | 'QA'
  | 'STORAGE'

export type AssetType = 'AUDIO' | 'IMAGE' | 'VIDEO' | 'SUBTITLE' | 'THUMBNAIL' | 'FINAL_VIDEO'
export type SourceType = 'MOCK' | 'GENERATED' | 'STOCK' | 'UPLOADED'
export type ProviderStatus = 'READY' | 'NOT_CONFIGURED' | 'ERROR'

export type ComfyProbeResult = {
  status: ProviderStatus
  latencyMs: number
  endpoint?: string
  detail?: string
}

export type PackageStatus =
  | 'INCOMPLETE'
  | 'READY_FOR_REVIEW'
  | 'READY_FOR_PUBLISH'
  | 'PUBLISHED'
  | 'FAILED'

export type ProductionPlan = {
  platform: string
  aspectRatio: string
  resolution: string
  width: number
  height: number
  fps: number
  targetDuration: number
  voice: { format: string; sampleRate: number }
  visual: {
    sceneCount: number
    assetType: 'IMAGE' | 'VIDEO'
    profileId?: string
  }
  subtitle: { formats: string[]; burnIn: boolean }
  thumbnail: { width: number; height: number; format: string }
}

export type StoryboardScene = {
  scene: number
  startTime: number
  endTime: number
  duration: number
  narrationSegment: string
  visualPrompt: string
  negativePrompt?: string
  role?: string
  subject?: string
  camera?: string
  lighting?: string
  mood?: string
  assetType: 'IMAGE' | 'VIDEO'
  textOverlay: string
  transition: string
}

export type ProductionQualityBreakdown = {
  technicalQuality: number
  audioQuality: number
  subtitleQuality: number
  visualCompleteness: number
  platformFit: number
  assetTraceability: number
}

export const STAGE_ORDER: ProductionStage[] = [
  'PLANNING',
  'VOICE',
  'VISUALS',
  'SUBTITLES',
  'COMPOSING',
  'THUMBNAIL',
  'QA',
  'STORAGE',
]
