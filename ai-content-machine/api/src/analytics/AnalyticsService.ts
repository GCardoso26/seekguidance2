import { getDb, uid, nowIso } from '../db/client.js'
import { emitEvent } from '../services/EventService.js'
import { withRetry } from '../lib/retry.js'
import { recordAiCost } from '../services/AiCostService.js'
import { mockAnalyticsProvider, type MockScenario } from './MockAnalyticsProvider.js'
import { normalizePlatformMetrics } from './MetricNormalizer.js'

export type AnalyticsSyncInput = {
  workspaceId: string
  publicationId?: string
  contentId?: string
  scenario?: MockScenario
  executionId?: string
  forceFailTimes?: number
  windowLabel?: string
}

export class AnalyticsService {
  private failCounters = new Map<string, number>()

  async sync(input: AnalyticsSyncInput) {
    const db = getDb()
    let pubs: Array<Record<string, unknown>> = []
    if (input.publicationId) {
      const one = db.prepare(`SELECT * FROM publication_runs WHERE id = ?`).get(input.publicationId)
      if (one) pubs = [one as Record<string, unknown>]
    } else if (input.contentId) {
      pubs = db
        .prepare(
          `SELECT * FROM publication_runs WHERE content_id = ? AND status = 'PUBLISHED' ORDER BY created_at DESC`,
        )
        .all(input.contentId) as Array<Record<string, unknown>>
    } else {
      pubs = db
        .prepare(
          `SELECT * FROM publication_runs WHERE workspace_id = ? AND status = 'PUBLISHED' ORDER BY created_at DESC LIMIT 50`,
        )
        .all(input.workspaceId) as Array<Record<string, unknown>>
    }

    if (!pubs.length) throw new Error('no_published_publications')

    const snapshots: string[] = []
    for (const pub of pubs) {
      const snapId = await this.captureSnapshot({
        workspaceId: input.workspaceId,
        publication: pub,
        scenario: input.scenario,
        executionId: input.executionId,
        forceFailTimes: input.forceFailTimes,
        windowLabel: input.windowLabel || 'latest',
      })
      snapshots.push(snapId)
    }

    recordAiCost({
      workspaceId: input.workspaceId,
      operation: 'analytics',
      provider: 'mock_analytics',
      model: 'deterministic',
      estimatedCostCents: 0,
      reality: 'MOCK',
    })

    return {
      status: 'COMPLETED' as const,
      reality: 'MOCK' as const,
      snapshots,
      count: snapshots.length,
    }
  }

  private async captureSnapshot(input: {
    workspaceId: string
    publication: Record<string, unknown>
    scenario?: MockScenario
    executionId?: string
    forceFailTimes?: number
    windowLabel: string
  }) {
    const pubId = String(input.publication.id)
    const failKey = `${pubId}:analytics`
    const retried = await withRetry(async () => {
      const n = (this.failCounters.get(failKey) || 0) + 1
      this.failCounters.set(failKey, n)
      if (n <= (input.forceFailTimes ?? 0)) throw new Error(`forced_analytics_fail_${n}`)

      const externalId = String(input.publication.external_id || '')
      const platform = String(input.publication.platform || 'TIKTOK')
      const fetched = mockAnalyticsProvider.fetch({
        externalId,
        platform,
        scenario: input.scenario,
      })
      // Ensure canonical via normalizer (raw may already be canonical)
      const metrics = normalizePlatformMetrics(platform, fetched.raw)
      return { fetched, metrics, platform, externalId }
    })

    if (!retried.ok) {
      getDb()
        .prepare(
          `INSERT INTO automation_failures
           (id, workflow, execution_id, entity_type, entity_id, error, payload, attempts, status, created_at)
           VALUES (?, 'analytics_sync', ?, 'publication_run', ?, ?, ?, ?, 'open', ?)`,
        )
        .run(
          uid(),
          input.executionId ?? pubId,
          pubId,
          retried.failure.error,
          JSON.stringify({ stage: 'analytics' }),
          retried.failure.attempts,
          nowIso(),
        )
      throw new Error(retried.failure.error)
    }

    const { metrics, fetched, platform } = retried.value
    const contentId = String(input.publication.content_id)
    const day = nowIso().slice(0, 10)
    const snapshotKey = `${pubId}:${input.windowLabel}:${day}`
    const existing = getDb()
      .prepare(`SELECT id FROM metric_snapshots WHERE snapshot_key = ?`)
      .get(snapshotKey) as { id: string } | undefined
    if (existing) return existing.id

    const id = uid()
    getDb()
      .prepare(
        `INSERT INTO metric_snapshots
         (id, workspace_id, publication_id, content_id, platform, captured_at,
          views, likes, comments, shares, saves, watch_time, average_view_duration,
          completion_rate, followers_gained, clicks, conversions, raw_metrics,
          source, reality, snapshot_key, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'MOCK', 'MOCK', ?, ?)`,
      )
      .run(
        id,
        input.workspaceId,
        pubId,
        contentId,
        platform,
        nowIso(),
        metrics.views,
        metrics.likes,
        metrics.comments,
        metrics.shares,
        metrics.saves,
        metrics.watchTime,
        metrics.averageViewDuration,
        metrics.completionRate,
        metrics.followersGained,
        metrics.clicks,
        metrics.conversions,
        JSON.stringify(fetched.raw),
        snapshotKey,
        nowIso(),
      )

    // Also append to legacy content_metrics for Daily Engine compatibility
    const metricRowId = uid()
    getDb()
      .prepare(
        `INSERT INTO content_metrics
         (id, content_id, views, likes, comments, shares, saves, watch_time_sec, retention_pct,
          ctr, clicks, followers_gained, reality, fetched_at, publication_id, platform, snapshot_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'MOCK', ?, ?, ?, ?)`,
      )
      .run(
        metricRowId,
        contentId,
        metrics.views,
        metrics.likes,
        metrics.comments,
        metrics.shares,
        metrics.saves,
        metrics.watchTime,
        metrics.completionRate * 100,
        metrics.views ? (metrics.clicks / metrics.views) * 100 : 0,
        metrics.clicks,
        metrics.followersGained,
        nowIso(),
        pubId,
        platform,
        id,
      )

    emitEvent({
      workspaceId: input.workspaceId,
      eventType: 'metrics.snapshot_created',
      entityType: 'metric_snapshot',
      entityId: id,
      reality: 'MOCK',
      payload: { publicationId: pubId, scenario: fetched.scenario },
    })
    emitEvent({
      workspaceId: input.workspaceId,
      eventType: 'metrics.updated',
      entityType: 'content',
      entityId: contentId,
      reality: 'MOCK',
      payload: { snapshotId: id, views: metrics.views },
    })

    return id
  }

  listSnapshots(workspaceId: string, limit = 50) {
    return getDb()
      .prepare(
        `SELECT * FROM metric_snapshots WHERE workspace_id = ? ORDER BY captured_at DESC LIMIT ?`,
      )
      .all(workspaceId, limit)
  }
}

export const analyticsService = new AnalyticsService()
