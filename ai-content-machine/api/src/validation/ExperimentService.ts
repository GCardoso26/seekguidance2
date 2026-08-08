import { getDb, uid, nowIso } from '../db/client.js'
import { emitEvent } from '../services/EventService.js'
import { productionPreflightService } from './ProductionPreflightService.js'
import { dryRunReportService } from './DryRunReportService.js'
import { resolveUnknownOutcome } from './UnknownOutcomeResolver.js'
import { youtubePublisher } from '../publishing/youtube/YouTubePublisher.js'
import { extractContentDNA, winnerDetectionService } from '../winner/WinnerDetectionService.js'
import { strategyService } from '../strategy/StrategyService.js'
import { restoreSafetyDefaults } from './SafetyDefaults.js'

export type ExperimentStatus =
  | 'PLANNED'
  | 'PREFLIGHT'
  | 'DRY_RUN'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'TRACKING'
  | 'ANALYZED'
  | 'COMPLETED'
  | 'FAILED'

const OBJECTIVE_DEFAULT =
  'prove real publishing + real analytics + real feedback (not revenue target)'

export class ExperimentService {
  create(input: {
    workspaceId: string
    contentId?: string
    platform?: string
    objective?: string
    hypothesis?: string
    notes?: string
  }) {
    const id = uid()
    const now = nowIso()
    getDb()
      .prepare(
        `INSERT INTO production_experiments
         (id, workspace_id, content_id, platform, data_origin, started_at, experiment_status,
          objective, hypothesis, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'REAL', ?, 'PLANNED', ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.workspaceId,
        input.contentId ?? null,
        input.platform || 'YOUTUBE_SHORT',
        now,
        input.objective || OBJECTIVE_DEFAULT,
        input.hypothesis ?? null,
        input.notes ?? null,
        now,
        now,
      )
    emitEvent({
      workspaceId: input.workspaceId,
      eventType: 'experiment.created',
      entityType: 'production_experiment',
      entityId: id,
      reality: 'PENDING',
      payload: { status: 'PLANNED', contentId: input.contentId },
    })
    return this.get(id)
  }

  get(id: string) {
    return getDb().prepare(`SELECT * FROM production_experiments WHERE id=?`).get(id) || null
  }

  list(workspaceId: string, limit = 20) {
    return getDb()
      .prepare(
        `SELECT * FROM production_experiments WHERE workspace_id=? ORDER BY created_at DESC LIMIT ?`,
      )
      .all(workspaceId, limit)
  }

  private setStatus(id: string, status: ExperimentStatus, extra: Record<string, unknown> = {}) {
    const fields = ['experiment_status=?', 'updated_at=?']
    const values: unknown[] = [status, nowIso()]
    for (const [k, v] of Object.entries(extra)) {
      fields.push(`${k}=?`)
      values.push(v)
    }
    values.push(id)
    getDb()
      .prepare(`UPDATE production_experiments SET ${fields.join(', ')} WHERE id=?`)
      .run(...values)
    return this.get(id)
  }

  async runPreflight(experimentId: string) {
    const exp = this.get(experimentId) as
      | { id: string; workspace_id: string; content_id: string | null }
      | undefined
    if (!exp) throw new Error('experiment_not_found')
    const report = await productionPreflightService.run({
      workspaceId: exp.workspace_id,
      contentId: exp.content_id || undefined,
    })
    return this.setStatus(experimentId, 'PREFLIGHT', {
      preflight_report: JSON.stringify(report),
    })
  }

  async runDryRun(experimentId: string) {
    const exp = this.get(experimentId) as
      | {
          id: string
          workspace_id: string
          content_id: string | null
          platform: string
        }
      | undefined
    if (!exp) throw new Error('experiment_not_found')
    if (!exp.content_id) throw new Error('experiment_missing_content')
    const report = await dryRunReportService.build({
      workspaceId: exp.workspace_id,
      contentId: exp.content_id,
      platform: exp.platform,
    })
    if (report.wouldUpload !== false) {
      throw new Error('dry_run_must_not_upload')
    }
    return this.setStatus(experimentId, 'DRY_RUN', {
      dry_run_report: JSON.stringify(report),
    })
  }

  approve(experimentId: string, approvedBy: string) {
    const exp = this.get(experimentId) as
      | { id: string; workspace_id: string; content_id: string | null }
      | undefined
    if (!exp) throw new Error('experiment_not_found')
    if (!exp.content_id) throw new Error('experiment_missing_content')
    if (!approvedBy?.trim()) throw new Error('approved_by_required')
    const now = nowIso()
    getDb()
      .prepare(
        `UPDATE contents SET approved_for_publishing=1, approved_for_publishing_at=?, approved_by=?,
         status='approved', updated_at=? WHERE id=? AND workspace_id=?`,
      )
      .run(now, approvedBy, now, exp.content_id, exp.workspace_id)
    return this.setStatus(experimentId, 'APPROVED', {
      approved_at: now,
      approved_by: approvedBy,
    })
  }

  attachPublication(experimentId: string, publicationId: string) {
    const pub = getDb().prepare(`SELECT * FROM publication_runs WHERE id=?`).get(publicationId) as
      | {
          id: string
          content_id: string
          external_id: string | null
          external_url: string | null
          upload_outcome: string | null
          published_at: string | null
          publication_source: string
          status: string
        }
      | undefined
    if (!pub) throw new Error('publication_not_found')
    const status: ExperimentStatus =
      pub.status === 'PUBLISHED' || pub.external_id ? 'PUBLISHED' : 'FAILED'
    return this.setStatus(experimentId, status, {
      publication_id: publicationId,
      content_id: pub.content_id,
      external_id: pub.external_id,
      external_url: pub.external_url,
      upload_outcome: pub.upload_outcome,
      published_at: pub.published_at,
      data_origin: pub.publication_source === 'REAL' ? 'REAL' : 'MOCK',
      result: JSON.stringify({
        publicationStatus: pub.status,
        publicationSource: pub.publication_source,
      }),
    })
  }

  /**
   * Post-publish observation. UNKNOWN → no auto-retry; resolve via remote check.
   */
  async observe(experimentId: string) {
    const exp = this.get(experimentId) as
      | {
          id: string
          workspace_id: string
          publication_id: string | null
          external_id: string | null
          upload_outcome: string | null
        }
      | undefined
    if (!exp) throw new Error('experiment_not_found')
    if (!exp.publication_id) throw new Error('experiment_missing_publication')

    const pub = getDb()
      .prepare(`SELECT * FROM publication_runs WHERE id=?`)
      .get(exp.publication_id) as
      | {
          external_id: string | null
          external_url: string | null
          upload_outcome: string | null
          status: string
          publication_source: string
          published_at: string | null
          content_id: string
        }
      | undefined
    if (!pub) throw new Error('publication_not_found')

    let decision = null as ReturnType<typeof resolveUnknownOutcome> | null
    let remote = null as { found: boolean; status?: string } | null

    if (pub.upload_outcome === 'UNKNOWN' || (!pub.external_id && pub.status !== 'PUBLISHED')) {
      if (pub.external_id) {
        remote = await youtubePublisher.getPublication(pub.external_id, exp.workspace_id)
        decision = resolveUnknownOutcome({
          remoteFound: remote.found,
          remoteStatus: remote.status,
          autoRetryEnabled: false,
        })
        emitEvent({
          workspaceId: exp.workspace_id,
          eventType: 'publication.status_checked',
          entityType: 'publication_run',
          entityId: exp.publication_id,
          reality: 'REAL',
          payload: { decision, remoteFound: remote.found },
        })
        if (decision.action === 'MARK_PUBLISHED') {
          getDb()
            .prepare(
              `UPDATE publication_runs SET status='PUBLISHED', upload_outcome='SUCCESS',
               remote_status=?, updated_at=? WHERE id=?`,
            )
            .run(remote.status || 'EXISTS', nowIso(), exp.publication_id)
        }
      } else {
        decision = resolveUnknownOutcome({
          remoteFound: false,
          autoRetryEnabled: false,
        })
      }
    } else if (pub.external_id) {
      remote = await youtubePublisher.getPublication(pub.external_id, exp.workspace_id)
      decision = remote.found
        ? { action: 'MARK_PUBLISHED' as const, reason: 'remote_exists' as const }
        : { action: 'HOLD' as const, reason: 'await_manual_review' as const }
    }

    const refreshed = getDb()
      .prepare(`SELECT * FROM publication_runs WHERE id=?`)
      .get(exp.publication_id) as typeof pub

    const nextStatus: ExperimentStatus =
      refreshed?.status === 'PUBLISHED' || refreshed?.external_id ? 'TRACKING' : 'FAILED'

    const updated = this.setStatus(experimentId, nextStatus, {
      external_id: refreshed?.external_id,
      external_url: refreshed?.external_url,
      upload_outcome: refreshed?.upload_outcome,
      published_at: refreshed?.published_at,
      data_origin: refreshed?.publication_source === 'REAL' ? 'REAL' : 'MOCK',
      result: JSON.stringify({
        observation: { decision, remote },
        publicationSource: refreshed?.publication_source,
        verifiedExternal: Boolean(remote?.found || refreshed?.external_id),
      }),
    })

    return { experiment: updated, decision, remote }
  }

  /**
   * Analyze with REAL origin tagging. Single evidence → hypothesis / INSUFFICIENT only.
   */
  async analyze(experimentId: string) {
    const exp = this.get(experimentId) as
      | {
          id: string
          workspace_id: string
          content_id: string | null
          platform: string
          data_origin: string
          publication_id: string | null
        }
      | undefined
    if (!exp) throw new Error('experiment_not_found')
    if (!exp.content_id) throw new Error('experiment_missing_content')

    // Source integrity — refuse silent mock bleed into REAL experiment
    if (exp.publication_id) {
      const pub = getDb()
        .prepare(`SELECT publication_source FROM publication_runs WHERE id=?`)
        .get(exp.publication_id) as { publication_source: string } | undefined
      if (pub && pub.publication_source !== 'REAL' && exp.data_origin === 'REAL') {
        throw Object.assign(new Error('real_experiment_cannot_use_mock_publication'), {
          code: 'SOURCE_MISMATCH',
        })
      }
    }

    let winners: unknown = null
    try {
      winners = await winnerDetectionService.detect({
        workspaceId: exp.workspace_id,
        contentId: exp.content_id,
        publicationId: exp.publication_id || undefined,
      })
    } catch (err) {
      winners = {
        error: err instanceof Error ? err.message : String(err),
        state: 'INSUFFICIENT_DATA',
      }
    }

    const strategy = await strategyService.analyze({
      workspaceId: exp.workspace_id,
      windowDays: 7,
      minimumEvidence: 3,
    })

    const dna = extractContentDNA({
      contentId: exp.content_id,
      platform: exp.platform,
      metrics: {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        watchTime: 0,
        averageViewDuration: 0,
        completionRate: 0,
        followersGained: 0,
        clicks: 0,
        conversions: 0,
      },
      state: 'INSUFFICIENT_DATA',
      score: 0,
    })

    const recs = strategyService.listRecommendations(exp.workspace_id, 20)
    const strongCount = recs.filter((r) => String((r as { status?: string }).status) === 'strong').length
    const analysis = {
      winners,
      strategySummary: {
        recommendationCount: recs.length,
        strongCount,
        strongAllowed: false,
        note: 'First experiment: hypothesis / INSUFFICIENT_DATA only (evidence < 3)',
        analyzeResult: strategy,
      },
      contentDna: dna,
      dataOrigin: 'REAL',
    }

    return this.setStatus(experimentId, 'ANALYZED', {
      content_dna: JSON.stringify(dna),
      result: JSON.stringify(analysis),
    })
  }

  complete(experimentId: string, notes?: string) {
    const safety = restoreSafetyDefaults()
    return {
      experiment: this.setStatus(experimentId, 'COMPLETED', {
        notes: notes ?? null,
        result: JSON.stringify({
          ...(JSON.parse(
            String((this.get(experimentId) as { result?: string })?.result || '{}'),
          ) as object),
          safetyRestored: safety.restored,
          completedAt: nowIso(),
        }),
      }),
      safety,
    }
  }

  fail(experimentId: string, reason: string) {
    const safety = restoreSafetyDefaults()
    return {
      experiment: this.setStatus(experimentId, 'FAILED', {
        notes: reason,
      }),
      safety,
    }
  }
}

export const experimentService = new ExperimentService()
