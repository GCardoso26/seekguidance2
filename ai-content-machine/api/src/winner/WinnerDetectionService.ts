import { getDb, uid, nowIso } from '../db/client.js'
import { emitEvent } from '../services/EventService.js'
import { withRetry } from '../lib/retry.js'
import { recordAiCost } from '../services/AiCostService.js'
import {
  DEFAULT_PERFORMANCE_WEIGHTS,
  DEFAULT_WINNER_CRITERIA,
  type CanonicalMetrics,
  type ContentDNA,
  type PerformanceWeights,
  type WinnerCriteria,
  type WinnerState,
} from '../publishing/types.js'

export type WinnerDetectInput = {
  workspaceId: string
  publicationId?: string
  contentId?: string
  criteria?: Partial<WinnerCriteria>
  weights?: Partial<PerformanceWeights>
  /** Override age check for tests — hours since published */
  ageHoursOverride?: number
  executionId?: string
  forceFailTimes?: number
}

function engagementRate(m: CanonicalMetrics): number {
  if (!m.views) return 0
  return (m.likes + m.comments + m.shares + m.saves) / m.views
}

function shareRate(m: CanonicalMetrics): number {
  return m.views ? m.shares / m.views : 0
}

function saveRate(m: CanonicalMetrics): number {
  return m.views ? m.saves / m.views : 0
}

function conversionRate(m: CanonicalMetrics): number {
  return m.views ? m.conversions / m.views : 0
}

export function computePerformanceScore(
  m: CanonicalMetrics,
  weights: PerformanceWeights = DEFAULT_PERFORMANCE_WEIGHTS,
): number {
  const parts = {
    completionRate: Math.min(m.completionRate, 1) * 100,
    engagementRate: Math.min(engagementRate(m) / 0.12, 1) * 100,
    shareRate: Math.min(shareRate(m) / 0.03, 1) * 100,
    saveRate: Math.min(saveRate(m) / 0.04, 1) * 100,
    conversionRate: Math.min(conversionRate(m) / 0.01, 1) * 100,
  }
  const score =
    parts.completionRate * weights.completionRate +
    parts.engagementRate * weights.engagementRate +
    parts.shareRate * weights.shareRate +
    parts.saveRate * weights.saveRate +
    parts.conversionRate * weights.conversionRate
  return Math.round(Math.min(100, Math.max(0, score)))
}

export function classifyWinnerState(
  m: CanonicalMetrics,
  score: number,
  ageHours: number,
  criteria: WinnerCriteria,
): WinnerState {
  if (m.views < criteria.minimumViews || ageHours < criteria.minimumAgeHours) {
    return 'INSUFFICIENT_DATA'
  }
  if (
    score >= criteria.minimumScore &&
    m.completionRate >= criteria.minimumCompletionRate &&
    engagementRate(m) >= criteria.minimumEngagementRate
  ) {
    return 'WINNER'
  }
  if (score <= criteria.loserMaxScore) return 'LOSER'
  if (m.views > 0) return 'NORMAL'
  return 'TRACKING'
}

export function extractContentDNA(input: {
  contentId: string
  platform: string
  metrics: CanonicalMetrics
  state: WinnerState
  score: number
}): ContentDNA {
  const db = getDb()
  const content = db.prepare(`SELECT * FROM contents WHERE id = ?`).get(input.contentId) as
    | { script_id: string | null; title: string }
    | undefined
  let hook = content?.title || ''
  let cta = ''
  let topic = ''
  let structure: string[] = []
  let captionStyle = 'short'
  let visualStyle = 'dark_vertical'
  let duration = 30

  if (content?.script_id) {
    const script = db.prepare(`SELECT * FROM scripts WHERE id = ?`).get(content.script_id) as
      | {
          hook: string
          cta: string
          caption: string | null
          body: string
          visual_brief: string
          idea_id: string
        }
      | undefined
    if (script) {
      hook = script.hook
      cta = script.cta
      captionStyle = (script.caption || '').length > 120 ? 'long' : 'short'
      try {
        const body = JSON.parse(script.body || '{}') as Record<string, string>
        structure = Object.keys(body).filter((k) => body[k])
      } catch {
        structure = ['hook', 'value', 'cta']
      }
      try {
        const brief = JSON.parse(script.visual_brief || '{}') as { durationSec?: number; style?: string }
        duration = brief.durationSec || 30
        visualStyle = brief.style || visualStyle
      } catch {
        /* keep defaults */
      }
      const idea = db.prepare(`SELECT title, topic_id FROM content_ideas WHERE id = ?`).get(script.idea_id) as
        | { title: string; topic_id: string | null }
        | undefined
      if (idea?.topic_id) {
        const t = db.prepare(`SELECT title FROM topics WHERE id = ?`).get(idea.topic_id) as
          | { title: string }
          | undefined
        topic = t?.title || idea.title
      } else {
        topic = idea?.title || hook
      }
    }
  }

  return {
    topic,
    hook,
    structure,
    duration,
    platform: input.platform,
    visualStyle,
    captionStyle,
    cta,
    performance: input.state,
    score: input.score,
  }
}

export class WinnerDetectionService {
  private failCounters = new Map<string, number>()

  async detect(input: WinnerDetectInput) {
    const db = getDb()
    const criteria = { ...DEFAULT_WINNER_CRITERIA, ...input.criteria }
    const weights = { ...DEFAULT_PERFORMANCE_WEIGHTS, ...input.weights }

    let pubs: Array<Record<string, unknown>> = []
    if (input.publicationId) {
      const one = db.prepare(`SELECT * FROM publication_runs WHERE id = ?`).get(input.publicationId)
      if (one) pubs = [one as Record<string, unknown>]
    } else if (input.contentId) {
      pubs = db
        .prepare(`SELECT * FROM publication_runs WHERE content_id = ? AND status='PUBLISHED'`)
        .all(input.contentId) as Array<Record<string, unknown>>
    } else {
      pubs = db
        .prepare(
          `SELECT * FROM publication_runs WHERE workspace_id = ? AND status='PUBLISHED' ORDER BY created_at DESC LIMIT 50`,
        )
        .all(input.workspaceId) as Array<Record<string, unknown>>
    }
    if (!pubs.length) throw new Error('no_publications_for_winner')

    const results = []
    let anyReal = false
    for (const pub of pubs) {
      const failKey = `${pub.id}:winner`
      const retried = await withRetry(async () => {
        const n = (this.failCounters.get(failKey) || 0) + 1
        this.failCounters.set(failKey, n)
        if (n <= (input.forceFailTimes ?? 0)) throw new Error(`forced_winner_fail_${n}`)
        return this.classifyOne(pub, criteria, weights, input.ageHoursOverride)
      })

      if (!retried.ok) {
        db.prepare(
          `INSERT INTO automation_failures
           (id, workflow, execution_id, entity_type, entity_id, error, payload, attempts, status, created_at)
           VALUES (?, 'winner_engine', ?, 'publication_run', ?, ?, ?, ?, 'open', ?)`,
        ).run(
          uid(),
          input.executionId ?? String(pub.id),
          String(pub.id),
          retried.failure.error,
          JSON.stringify({ stage: 'winner' }),
          retried.failure.attempts,
          nowIso(),
        )
        throw new Error(retried.failure.error)
      }
      if (
        String(pub.publication_source || '') === 'REAL' ||
        retried.value.metricsSource === 'YOUTUBE' ||
        retried.value.metricsReality === 'REAL'
      ) {
        anyReal = true
      }
      results.push(retried.value)
    }

    const reality = anyReal ? ('REAL' as const) : ('MOCK' as const)

    recordAiCost({
      workspaceId: input.workspaceId,
      operation: 'winner_analysis',
      provider: 'winner_engine',
      model: 'rules',
      estimatedCostCents: 0,
      reality,
    })

    return {
      status: 'COMPLETED' as const,
      reality,
      results,
      winners: results.filter((r) => r.state === 'WINNER'),
    }
  }

  private classifyOne(
    pub: Record<string, unknown>,
    criteria: WinnerCriteria,
    weights: PerformanceWeights,
    ageHoursOverride?: number,
  ) {
    const db = getDb()
    const contentId = String(pub.content_id)
    const platform = String(pub.platform)
    const snap = db
      .prepare(
        `SELECT * FROM metric_snapshots WHERE publication_id = ?
         ORDER BY CASE WHEN metrics_source = 'YOUTUBE' OR reality = 'REAL' THEN 0 ELSE 1 END,
                  captured_at DESC
         LIMIT 1`,
      )
      .get(String(pub.id)) as
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
          metrics_source?: string
          reality?: string
        }
      | undefined

    if (!snap) {
      return {
        contentId,
        publicationId: String(pub.id),
        state: 'INSUFFICIENT_DATA' as WinnerState,
        score: 0,
        winningFactors: [] as string[],
        metricsSource: null as string | null,
        metricsReality: null as string | null,
      }
    }

    const metrics: CanonicalMetrics = {
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
    }

    const publishedAt = pub.published_at ? new Date(String(pub.published_at)).getTime() : Date.now()
    const ageHours =
      ageHoursOverride ?? Math.max(0, (Date.now() - publishedAt) / 3600_000)
    const score = computePerformanceScore(metrics, weights)
    const state = classifyWinnerState(metrics, score, ageHours, criteria)
    const dna = extractContentDNA({ contentId, platform, metrics, state, score })

    const winningFactors: string[] = []
    if (metrics.completionRate >= criteria.minimumCompletionRate) winningFactors.push('completionRate')
    if (engagementRate(metrics) >= criteria.minimumEngagementRate) winningFactors.push('engagementRate')
    if (shareRate(metrics) >= 0.015) winningFactors.push('shareRate')
    if (saveRate(metrics) >= 0.02) winningFactors.push('saveRate')
    if (conversionRate(metrics) >= 0.001) winningFactors.push('conversionRate')

    // Map to existing contents.performance_class CHECK constraint
    const perfClass =
      state === 'WINNER'
        ? 'WINNER'
        : state === 'LOSER'
          ? 'LOSER'
          : state === 'INSUFFICIENT_DATA' || state === 'TRACKING'
            ? 'NORMAL'
            : 'NORMAL'

    db.prepare(
      `UPDATE contents SET performance_class=?, performance_score=?, updated_at=? WHERE id=?`,
    ).run(perfClass, score, nowIso(), contentId)

    const eventReality =
      String(pub.publication_source || '') === 'REAL' ||
      snap.metrics_source === 'YOUTUBE' ||
      snap.reality === 'REAL'
        ? 'REAL'
        : 'MOCK'

    if (state === 'WINNER') {
      emitEvent({
        workspaceId: String(pub.workspace_id),
        eventType: 'content.winner_detected',
        entityType: 'content',
        entityId: contentId,
        reality: eventReality,
        payload: {
          contentId,
          publicationId: String(pub.id),
          platform,
          score,
          metrics,
          winningFactors,
          dna,
        },
      })
    }

    return {
      contentId,
      publicationId: String(pub.id),
      platform,
      state,
      score,
      metrics,
      winningFactors,
      dna,
      metricsSource: snap.metrics_source || null,
      metricsReality: snap.reality || null,
    }
  }
}

export const winnerDetectionService = new WinnerDetectionService()
