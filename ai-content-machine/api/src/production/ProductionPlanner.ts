import type { ProductionPlan, StoryboardScene } from './types.js'
import { getProductionProfile } from './PlatformProductionProfiles.js'

export function buildProductionPlan(input: {
  platform?: string
  visualBrief?: Record<string, unknown>
  targetDurationOverride?: number
}): ProductionPlan {
  const profile = getProductionProfile(input.platform)
  const duration =
    input.targetDurationOverride ||
    Number(input.visualBrief?.durationSec) ||
    profile.targetDuration

  return {
    platform: profile.platform,
    aspectRatio: profile.aspectRatio,
    resolution: profile.resolution,
    width: profile.width,
    height: profile.height,
    fps: profile.fps,
    targetDuration: duration,
    voice: profile.voice,
    visual: {
      ...profile.visual,
      sceneCount: Math.max(3, Number((input.visualBrief as { shots?: unknown[] })?.shots?.length || profile.visual.sceneCount)),
    },
    subtitle: profile.subtitle,
    thumbnail: profile.thumbnail,
  }
}

export function buildStoryboard(input: {
  plan: ProductionPlan
  scriptBody: Record<string, string>
  visualBrief?: Record<string, unknown>
}): StoryboardScene[] {
  const sections = ['hook', 'setup', 'problem', 'insight', 'value', 'proof', 'cta'] as const
  const texts = sections
    .map((k) => ({ key: k, text: String(input.scriptBody[k] || '').trim() }))
    .filter((x) => x.text)

  const count = Math.min(input.plan.visual.sceneCount, Math.max(3, texts.length))
  const slice = texts.slice(0, count)
  const dur = input.plan.targetDuration / slice.length

  return slice.map((seg, i) => ({
    scene: i + 1,
    startTime: Number((i * dur).toFixed(2)),
    endTime: Number(((i + 1) * dur).toFixed(2)),
    duration: Number(dur.toFixed(2)),
    narrationSegment: seg.text,
    visualPrompt: `Dark content scene for ${seg.key}: ${seg.text.slice(0, 80)}`,
    assetType: input.plan.visual.assetType,
    textOverlay: seg.key === 'hook' ? 'Hook' : seg.key.toUpperCase(),
    transition: i === 0 ? 'cut' : 'fade',
  }))
}
