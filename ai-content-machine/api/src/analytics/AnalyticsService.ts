import { getDb, uid, nowIso } from '../db/client.js'
import { emitEvent } from '../services/EventService.js'
import { withRetry } from '../lib/retry.js'
import { recordAiCost } from '../services/AiCostService.js'
import { mockAnalyticsProvider, type MockScenario } from './MockAnalyticsProvider.js'
import { youtubeAnalyticsProvider } from './YouTubeAnalyticsProvider.js'
import { normalizePlatformMetrics } from './MetricNormalizer.js'
import { config } from '../config.js'

export type AnalyticsSyncInput = {
  workspaceId: string
  publicationId?: string
  contentId?: string
  scenario?: MockScenario
  executionId?: string
  forceFailTimes?: number
  windowLabel?: string
  /** Prefer real YouTube analytics when connected */
  preferReal?: boolean
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

    if (!pubs.length) {
      if (input.publicationId) throw new Error('publication_not_found')
      // Cron workspace-wide sync with zero publications must not fail the workflow
      return {
        status: 'COMPLETED' as const,
        reality: 'MOCK' as const,
        snapshots: [],
        count: 0,
        note: 'no_published_publications',
      }
    }
    const snapshots: string[] = []
    let anyReal = false
    for (const pub of pubs) {
      const snapId = await this.captureSnapshot({
        workspaceId: input.workspaceId,
        publication: pub,
        scenario: input.scenario,
        executionId: input.executionId,
        forceFailTimes: input.forceFailTimes,
        windowLabel: input.windowLabel || 'latest',
        preferReal: input.preferReal,
      })
      snapshots.push(snapId)
      const row = db
        .prepare(`SELECT metrics_source, reality FROM metric_snapshots WHERE id=?`)
        .get(snapId) as { metrics_source?: string; reality?: string } | undefined
      if (row?.metrics_source === 'YOUTUBE' || row?.reality === 'REAL') anyReal = true
    }

    recordAiCost({
      workspaceId: input.workspaceId,
      operation: 'analytics',
      provider: anyReal ? 'youtube_analytics' : 'mock_analytics',
      model: anyReal ? 'youtube_data_api' : 'deterministic',
      estimatedCostCents: 0,
      reality: anyReal ? 'REAL' : 'MOCK',
    })

    return {
      status: 'COMPLETED' as const,
      reality: (anyReal ? 'REAL' : 'MOCK') as 'REAL' | 'MOCK',
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
    preferReal?: boolean
  }) {
    const pubId = String(input.publication.id)
    const failKey = `${pubId}:analytics`
    const retried = await withRetry(async () => {
      const n = (this.failCounters.get(failKey) || 0) + 1
      this.failCounters.set(failKey, n)
      if (n <= (input.forceFailTimes ?? 0)) throw new Error(`forced_analytics_fail_${n}`)

      const externalId = String(input.publication.external_id || '')
      const platform = String(input.publication.platform || 'TIKTOK')
      const publicationSource = String(input.publication.publication_source || 'MOCK')
      // preferReal / publication REAL overrides AUTOMATION_MODE=mock (same idea as forceReal publish)
      const wantReal =
        (Boolean(input.preferReal) || publicationSource === 'REAL') &&
        platform.toUpperCase().includes('YOUTUBE') &&
        Boolean(externalId) &&
        youtubeAnalyticsProvider.status() === 'READY'

      emitEvent({
        workspaceId: input.workspaceId,
        eventType: 'metrics.sync_started',
        entityType: 'publication_run',
        entityId: pubId,
        reality: wantReal ? 'REAL' : 'MOCK',
        payload: { window: input.windowLabel, preferReal: Boolean(input.preferReal) },
      })

      if (wantReal) {
        try {
          const real = await youtubeAnalyticsProvider.fetch({
            externalId,
            platform,
            workspaceId: input.workspaceId,
          })
          return {
            fetched: { raw: real.raw, scenario: real.status },
            metrics: real.metrics,
            platform,
            externalId,
            metricsSource: 'YOUTUBE' as const,
            reality: 'REAL' as const,
          }
        } catch (err) {
          emitEvent({
            workspaceId: input.workspaceId,
            eventType: 'metrics.sync_fallback_mock',
            entityType: 'publication_run',
            entityId: pubId,
            reality: 'MOCK',
            payload: {
              preferReal: Boolean(input.preferReal),
              error: err instanceof Error ? err.message : String(err),
            },
          })
          // fall through to mock envelope
        }
      }

      const fetched = mockAnalyticsProvider.fetch({
        externalId,
        platform,
        scenario: input.scenario,
      })
      const metrics = normalizePlatformMetrics(platform, fetched.raw)
      return {
        fetched,
        metrics,
        platform,
        externalId,
        metricsSource: 'MOCK' as const,
        reality: 'MOCK' as const,
      }
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
      emitEvent({
        workspaceId: input.workspaceId,
        eventType: 'metrics.sync_failed',
        entityType: 'publication_run',
        entityId: pubId,
        reality: 'FAILED',
        payload: { error: retried.failure.error },
      })
      throw new Error(retried.failure.error)
    }

    const { metrics, fetched, platform, metricsSource, reality } = retried.value
    const contentId = String(input.publication.content_id)
    const day = nowIso().slice(0, 10)
    const snapshotKey = `${pubId}:${input.windowLabel}:${day}:${metricsSource}`
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
          source, reality, snapshot_key, created_at, metrics_source, window_label)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        metricsSource,
        reality,
        snapshotKey,
        nowIso(),
        metricsSource,
        input.windowLabel,
      )

    // Also append to legacy content_metrics for Daily Engine compatibility
    const metricRowId = uid()
    getDb()
      .prepare(
        `INSERT INTO content_metrics
         (id, content_id, views, likes, comments, shares, saves, watch_time_sec, retention_pct,
          ctr, clicks, followers_gained, reality, fetched_at, publication_id, platform, snapshot_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        reality,
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
      reality,
      payload: { publicationId: pubId, scenario: fetched.scenario, metricsSource },
    })
    emitEvent({
      workspaceId: input.workspaceId,
      eventType: 'metrics.updated',
      entityType: 'content',
      entityId: contentId,
      reality,
      payload: { snapshotId: id, views: metrics.views, metricsSource },
    })
    emitEvent({
      workspaceId: input.workspaceId,
      eventType: 'metrics.sync_completed',
      entityType: 'metric_snapshot',
      entityId: id,
      reality,
      payload: { publicationId: pubId, metricsSource },
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
