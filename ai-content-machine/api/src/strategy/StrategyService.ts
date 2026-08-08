import { getDb, uid, nowIso } from '../db/client.js'
import { emitEvent } from '../services/EventService.js'
import { withRetry } from '../lib/retry.js'
import { recordAiCost } from '../services/AiCostService.js'
import { researchService } from '../research/ResearchService.js'
import { extractContentDNA } from '../winner/WinnerDetectionService.js'
import type { ContentDNA } from '../publishing/types.js'

export type StrategyKind =
  | 'HOOK_PATTERN'
  | 'TOPIC_PATTERN'
  | 'FORMAT_PATTERN'
  | 'CTA_PATTERN'
  | 'VISUAL_PATTERN'
  | 'DURATION_PATTERN'
  | 'PLATFORM_PATTERN'

export type StrategyRunInput = {
  workspaceId: string
  minimumEvidence?: number
  windowDays?: number
  executionId?: string
  forceFailTimes?: number
  /** trigger research feedback using recommendations */
  feedResearch?: boolean
}

type PatternBucket = {
  kind: StrategyKind
  key: string
  contentIds: string[]
  dnas: ContentDNA[]
}

function bucketKey(kind: StrategyKind, dna: ContentDNA): string {
  switch (kind) {
    case 'HOOK_PATTERN':
      return dna.hook.slice(0, 48).toLowerCase()
    case 'TOPIC_PATTERN':
      return dna.topic.toLowerCase()
    case 'FORMAT_PATTERN':
      return dna.structure.join('>')
    case 'CTA_PATTERN':
      return dna.cta.slice(0, 64).toLowerCase()
    case 'VISUAL_PATTERN':
      return dna.visualStyle
    case 'DURATION_PATTERN':
      return String(Math.round(dna.duration / 5) * 5)
    case 'PLATFORM_PATTERN':
      return dna.platform
  }
}

export class StrategyService {
  private failCounters = new Map<string, number>()

  listRecommendations(workspaceId: string, limit = 50) {
    return getDb()
      .prepare(
        `SELECT * FROM strategy_recommendations WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?`,
      )
      .all(workspaceId, limit)
  }

  async analyze(input: StrategyRunInput) {
    const minEvidence = input.minimumEvidence ?? 3
    const windowDays = input.windowDays ?? 30
    const failKey = `${input.workspaceId}:strategy`
    const retried = await withRetry(async () => {
      const n = (this.failCounters.get(failKey) || 0) + 1
      this.failCounters.set(failKey, n)
      if (n <= (input.forceFailTimes ?? 0)) throw new Error(`forced_strategy_fail_${n}`)
      return this.buildRecommendations(input.workspaceId, minEvidence, windowDays)
    })

    if (!retried.ok) {
      getDb()
        .prepare(
          `INSERT INTO automation_failures
           (id, workflow, execution_id, entity_type, entity_id, error, payload, attempts, status, created_at)
           VALUES (?, 'daily_strategy_agent', ?, 'workspace', ?, ?, ?, ?, 'open', ?)`,
        )
        .run(
          uid(),
          input.executionId ?? input.workspaceId,
          input.workspaceId,
          retried.failure.error,
          JSON.stringify({ stage: 'strategy' }),
          retried.failure.attempts,
          nowIso(),
        )
      throw new Error(retried.failure.error)
    }

    recordAiCost({
      workspaceId: input.workspaceId,
      operation: 'AI_STRATEGY_ANALYSIS',
      provider: 'strategy_engine',
      model: 'pattern_rules',
      estimatedCostCents: 0,
      reality: 'MOCK',
    })

    let researchFeedback: unknown = null
    if (input.feedResearch && retried.value.recommendations.length) {
      researchFeedback = await this.feedResearch(input.workspaceId, input.executionId)
    }

    emitEvent({
      workspaceId: input.workspaceId,
      eventType: 'strategy.recommended',
      entityType: 'workspace',
      entityId: input.workspaceId,
      reality: 'MOCK',
      payload: {
        count: retried.value.recommendations.length,
        strong: retried.value.strong.length,
        hypotheses: retried.value.hypotheses.length,
      },
    })

    return {
      status: 'COMPLETED' as const,
      reality: 'MOCK' as const,
      ...retried.value,
      researchFeedback,
    }
  }

  private buildRecommendations(workspaceId: string, minEvidence: number, windowDays: number) {
    const db = getDb()
    const since = new Date(Date.now() - windowDays * 864e5).toISOString()
    const winners = db
      .prepare(
        `SELECT c.id, c.performance_score, p.platform, p.id as publication_id
         FROM contents c
         JOIN publication_runs p ON p.content_id = c.id AND p.status = 'PUBLISHED'
         WHERE c.workspace_id = ? AND c.performance_class = 'WINNER' AND c.updated_at >= ?`,
      )
      .all(workspaceId, since) as Array<{
      id: string
      performance_score: number
      platform: string
      publication_id: string
    }>

    const dnas: Array<{ contentId: string; dna: ContentDNA }> = []
    for (const w of winners) {
      const snap = db
        .prepare(
          `SELECT * FROM metric_snapshots WHERE publication_id = ? ORDER BY captured_at DESC LIMIT 1`,
        )
        .get(w.publication_id) as
        | {
            views: number
            likes: number
            comments: number
            shares: number
            saves: number
            watch_time: number
            average_view_duration: number
            completion_rate: number
            followers_gained: number
            clicks: number
            conversions: number
          }
        | undefined
      if (!snap) continue
      const dna = extractContentDNA({
        contentId: w.id,
        platform: w.platform,
        metrics: {
          views: snap.views,
          likes: snap.likes,
          comments: snap.comments,
          shares: snap.shares,
          saves: snap.saves,
          watchTime: snap.watch_time,
          averageViewDuration: snap.average_view_duration,
          completionRate: snap.completion_rate,
          followersGained: snap.followers_gained,
          clicks: snap.clicks,
          conversions: snap.conversions,
        },
        state: 'WINNER',
        score: w.performance_score || 0,
      })
      dnas.push({ contentId: w.id, dna })
    }

    const kinds: StrategyKind[] = [
      'HOOK_PATTERN',
      'TOPIC_PATTERN',
      'FORMAT_PATTERN',
      'CTA_PATTERN',
      'VISUAL_PATTERN',
      'DURATION_PATTERN',
      'PLATFORM_PATTERN',
    ]

    const buckets = new Map<string, PatternBucket>()
    for (const kind of kinds) {
      for (const item of dnas) {
        const key = bucketKey(kind, item.dna)
        if (!key) continue
        const mapKey = `${kind}::${key}`
        const cur = buckets.get(mapKey) || { kind, key, contentIds: [], dnas: [] }
        if (!cur.contentIds.includes(item.contentId)) {
          cur.contentIds.push(item.contentId)
          cur.dnas.push(item.dna)
        }
        buckets.set(mapKey, cur)
      }
    }

    const recommendations: Array<Record<string, unknown>> = []
    const strong: string[] = []
    const hypotheses: string[] = []

    for (const bucket of buckets.values()) {
      const evidenceCount = bucket.contentIds.length
      // Single winner → hypothesis only; strong needs minimumEvidence
      const status = evidenceCount >= minEvidence ? 'strong' : 'hypothesis'
      const confidence = Math.min(0.95, evidenceCount / Math.max(minEvidence, 1))
      const id = uid()
      const payload = {
        kind: bucket.kind,
        pattern: bucket.key,
        samples: bucket.dnas.slice(0, 5),
        recommendation: this.humanize(bucket),
      }
      // Origin: REAL only if all source contents have REAL publication; else MOCK
      const origins = db
        .prepare(
          `SELECT DISTINCT publication_source FROM publication_runs
           WHERE content_id IN (${bucket.contentIds.map(() => '?').join(',')}) AND status='PUBLISHED'`,
        )
        .all(...bucket.contentIds) as Array<{ publication_source: string }>
      const dataOrigin =
        origins.length && origins.every((o) => o.publication_source === 'REAL') ? 'REAL' : 'MOCK'

      db.prepare(
        `INSERT INTO strategy_recommendations
         (id, workspace_id, window_days, payload, reality, created_at, kind, confidence, evidence_count, source_content_ids, status, data_origin)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        workspaceId,
        windowDays,
        JSON.stringify(payload),
        dataOrigin,
        nowIso(),
        bucket.kind,
        confidence,
        evidenceCount,
        JSON.stringify(bucket.contentIds),
        status,
        dataOrigin,
      )
      recommendations.push({ id, kind: bucket.kind, status, confidence, evidenceCount, pattern: bucket.key })
      if (status === 'strong') strong.push(id)
      else hypotheses.push(id)
    }

    return { recommendations, strong, hypotheses, winnerCount: winners.length }
  }

  private humanize(bucket: PatternBucket): string {
    return `Repetir padrão ${bucket.kind}="${bucket.key}" (evidência ${bucket.contentIds.length})`
  }

  /**
   * Feed strategy context into Research Engine via existing contracts (no Research rewrite).
   */
  async feedResearch(workspaceId: string, executionId?: string) {
    const niche = getDb()
      .prepare(`SELECT id FROM niches WHERE workspace_id = ? AND active = 1 LIMIT 1`)
      .get(workspaceId) as { id: string } | undefined
    if (!niche) throw new Error('niche_not_found_for_feedback')

    // Use existing ResearchService.run — recommendations influence via niche keywords enrichment
    const recs = this.listRecommendations(workspaceId, 10) as Array<{
      kind: string
      payload: string
      status: string
    }>
    const topicsHint = recs
      .filter((r) => r.kind === 'TOPIC_PATTERN' || r.status === 'strong')
      .slice(0, 5)
      .map((r) => {
        try {
          return String(JSON.parse(r.payload).pattern || '')
        } catch {
          return ''
        }
      })
      .filter(Boolean)

    if (topicsHint.length) {
      const nicheRow = getDb().prepare(`SELECT * FROM niches WHERE id = ?`).get(niche.id) as {
        keywords: string
      }
      const keywords = (() => {
        try {
          return JSON.parse(nicheRow.keywords || '[]') as string[]
        } catch {
          return [] as string[]
        }
      })()
      const merged = [...new Set([...keywords, ...topicsHint])].slice(0, 20)
      getDb()
        .prepare(`UPDATE niches SET keywords = ? WHERE id = ?`)
        .run(JSON.stringify(merged), niche.id)
    }

    // Force a new research cycle (bypass same-day idempotency by unique execution context)
    // ResearchService uses date-based key — for feedback we call with nicheId; if skipped, still OK
    const result = await researchService.run({
      workspaceId,
      nicheId: niche.id,
      executionId,
      force: true,
    })

    emitEvent({
      workspaceId,
      eventType: 'strategy.research_feedback',
      entityType: 'niche',
      entityId: niche.id,
      reality: 'MOCK',
      payload: { topicsHint, research: { status: (result as { status?: string }).status } },
    })

    return result
  }
}

export const strategyService = new StrategyService()
