import type { VisualPlan, VisualScenePlan } from './visual/visualTypes.js'
import { buildVisualPlan } from './visual/VisualDirector.js'
import { expandStockQueries } from './visual/stockQueries.js'
import { motionForAsset } from './composition/KenBurnsPlanner.js'

export type ScenePlanItem = {
  scene: number
  start: number
  end: number
  purpose: string
  narration: string
  visual_intent: string
  search_queries: string[]
  asset_type: 'video' | 'image'
  motion: string
}

/**
 * SCRIPT → SCENE PLAN. Wraps VisualDirector; adds stock queries + motion ids.
 * Does not replace ProductionPlanner/VisualDirector.
 */
export function planScenes(input: {
  scriptBody: Record<string, string>
  platform?: string
  nicheName?: string | null
  targetDurationSec?: number
  maxScenes?: number
}): { visualPlan: VisualPlan; scenes: ScenePlanItem[] } {
  const visualPlan = buildVisualPlan({
    scriptBody: input.scriptBody,
    platform: input.platform,
    nicheName: input.nicheName,
    targetDurationSec: input.targetDurationSec,
    maxScenes: Math.min(7, input.maxScenes || 5),
  })
  const total = visualPlan.scenes.reduce((s, x) => s + x.durationSec, 0) || 1
  let t = 0
  const scenes: ScenePlanItem[] = visualPlan.scenes.map((seg: VisualScenePlan) => {
    const start = t
    t += seg.durationSec
    const visual_intent = `${seg.role}: ${seg.action} in ${seg.environment}`
    const search_queries = expandStockQueries({
      role: seg.role,
      subject: seg.subject,
      environment: seg.environment,
      visualIntent: visual_intent,
    })
    return {
      scene: seg.scene,
      start: Number(start.toFixed(2)),
      end: Number(t.toFixed(2)),
      purpose: seg.role,
      narration: String(input.scriptBody[seg.role] || '').slice(0, 400),
      visual_intent,
      search_queries,
      asset_type: 'image',
      motion: motionForAsset(seg.scene, `${seg.role}:${total}`),
    }
  })
  return { visualPlan, scenes }
}
