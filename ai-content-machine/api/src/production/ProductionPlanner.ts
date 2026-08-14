import type { ProductionPlan, StoryboardScene } from './types.js'
import { getProductionProfile } from './PlatformProductionProfiles.js'
import type { VisualPlan } from './visual/visualTypes.js'
import { buildVisualPlan, retimedVisualPlan } from './visual/VisualDirector.js'

export function buildProductionPlan(input: {
  platform?: string
  visualBrief?: Record<string, unknown>
  targetDurationOverride?: number
  visualPlan?: VisualPlan | null
}): ProductionPlan {
  const profile = getProductionProfile(input.platform)
  const duration =
    input.targetDurationOverride ||
    Number(input.visualBrief?.durationSec) ||
    profile.targetDuration

  const briefShots = Number((input.visualBrief as { shots?: unknown[] })?.shots?.length || 0)
  const planScenes = input.visualPlan?.scenes.length
  const maxScenes = input.visualPlan?.maxScenes || profile.visual.sceneCount
  const sceneCount = Math.max(
    3,
    Math.min(maxScenes, planScenes || briefShots || profile.visual.sceneCount),
  )

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
      sceneCount,
      profileId: input.visualPlan?.profileId,
    },
    subtitle: profile.subtitle,
    thumbnail: profile.thumbnail,
  }
}

export function buildStoryboard(input: {
  plan: ProductionPlan
  scriptBody: Record<string, string>
  visualBrief?: Record<string, unknown>
  visualPlan?: VisualPlan | null
  nicheName?: string | null
}): StoryboardScene[] {
  const visualPlan =
    input.visualPlan ||
    buildVisualPlan({
      scriptBody: input.scriptBody,
      platform: input.plan.platform,
      nicheName: input.nicheName,
      targetDurationSec: input.plan.targetDuration,
      maxScenes: input.plan.visual.sceneCount,
    })

  const timed = retimedVisualPlan(visualPlan, input.plan.targetDuration)
  const count = Math.min(input.plan.visual.sceneCount, Math.max(3, timed.scenes.length))
  const slice = timed.scenes.slice(0, count)
  const dur = input.plan.targetDuration / slice.length

  return slice.map((seg, i) => ({
    scene: i + 1,
    startTime: Number((i * dur).toFixed(2)),
    endTime: Number(((i + 1) * dur).toFixed(2)),
    duration: Number(dur.toFixed(2)),
    narrationSegment: String(input.scriptBody[seg.role] || seg.subject).slice(0, 400),
    visualPrompt: seg.prompt,
    negativePrompt: seg.negativePrompt || timed.negativeGlobal,
    role: seg.role,
    subject: seg.subject,
    camera: seg.camera,
    lighting: seg.lighting,
    mood: seg.mood,
    assetType: input.plan.visual.assetType,
    textOverlay: String(input.scriptBody[seg.role] || seg.subject).slice(0, 60),
    transition: i === 0 ? 'cut' : 'fade',
  }))
}

export { buildVisualPlan, retimedVisualPlan }
