import fs from 'node:fs'

export type FactoryRunMetrics = {
  totalMs: number
  scriptMs: number | null
  voiceMs: number | null
  visualsMs: number | null
  composeMs: number | null
  mp4Bytes: number | null
  assetsReused: number
  assetsNew: number
  scriptProvider: string | null
  voiceProvider: string | null
  composeProvider: string | null
  fallbackCount: number
  success: boolean
  packageStatus: string | null
}

type StageLike = {
  ok?: boolean
  durationMs?: number
  provider?: string
  fallbackTrail?: Array<{ status?: string }>
  library?: { hits?: number; misses?: number }
}

/**
 * Operational metrics for the local factory (throughput / 30-day planning).
 */
export function collectFactoryMetrics(input: {
  productionStartedAt?: string | null
  productionCompletedAt?: string | null
  scriptDurationMs?: number | null
  scriptProvider?: string | null
  scriptFallbackTrail?: Array<{ status?: string }> | null
  stages?: Record<string, StageLike | undefined>
  finalVideoPath?: string | null
  packageStatus?: string | null
  success: boolean
}): FactoryRunMetrics {
  const stages = input.stages || {}
  const voice = stages.VOICE
  const visuals = stages.VISUALS
  const composing = stages.COMPOSING

  let totalMs = 0
  if (input.productionStartedAt && input.productionCompletedAt) {
    totalMs = Math.max(
      0,
      new Date(input.productionCompletedAt).getTime() - new Date(input.productionStartedAt).getTime(),
    )
  }
  if (input.scriptDurationMs) totalMs += input.scriptDurationMs

  const fallbackCount =
    countFallbacks(input.scriptFallbackTrail) +
    countFallbacks(voice?.fallbackTrail) +
    (visuals?.library ? 0 : 0)

  let mp4Bytes: number | null = null
  if (input.finalVideoPath && fs.existsSync(input.finalVideoPath)) {
    mp4Bytes = fs.statSync(input.finalVideoPath).size
  }

  return {
    totalMs,
    scriptMs: input.scriptDurationMs ?? null,
    voiceMs: voice?.durationMs ?? null,
    visualsMs: visuals?.durationMs ?? null,
    composeMs: composing?.durationMs ?? null,
    mp4Bytes,
    assetsReused: Number(visuals?.library?.hits || 0),
    assetsNew: Number(visuals?.library?.misses || 0),
    scriptProvider: input.scriptProvider ?? null,
    voiceProvider: voice?.provider ?? null,
    composeProvider: composing?.provider ?? null,
    fallbackCount,
    success: input.success,
    packageStatus: input.packageStatus ?? null,
  }
}

function countFallbacks(trail?: Array<{ status?: string }> | null): number {
  if (!trail?.length) return 0
  // attempts that did not win (NOT_CONFIGURED/ERROR/INVALID/TIMEOUT) before a READY winner
  return trail.filter((t) => t.status && t.status !== 'READY').length
}
