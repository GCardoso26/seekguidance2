import { config } from '../config.js'
import { getDb, uid, nowIso, parseJson } from '../db/client.js'
import { emitEvent } from '../services/EventService.js'
import { alreadyProcessed, markProcessed } from '../lib/idempotency.js'
import { withRetry } from '../lib/retry.js'
import { normalizeResults } from './Normalizer.js'
import { dedupeResults } from './Deduplicator.js'
import { extractTopics } from './TopicExtractor.js'
import { scoreTopic } from './Scorer.js'
import type { ResearchProvider, ResearchResult } from './types.js'
import { MockResearchProvider } from './providers/MockResearchProvider.js'
import {
  AlwaysFailResearchProvider,
  RedditResearchProviderStub,
  SearchProviderStub,
  TrendResearchProviderStub,
  YouTubeResearchProviderStub,
} from './providers/stubs.js'

export type ResearchRunInput = {
  workspaceId: string
  nicheId?: string
  providers?: ResearchProvider[]
  executionId?: string
  /** Force failure provider injection for tests */
  testProviders?: ResearchProvider[]
}

function defaultProviders(): ResearchProvider[] {
  // Real stubs stay NOT_CONFIGURED; mock is the only READY provider in mock mode
  const stubs = [
    new SearchProviderStub(),
    new YouTubeResearchProviderStub(),
    new RedditResearchProviderStub(),
    new TrendResearchProviderStub(),
  ]
  if (config.automationMode === 'mock') {
    return [new MockResearchProvider(), ...stubs]
  }
  // production: only configured providers would be added; stubs remain NOT_CONFIGURED
  return stubs
}

function researchIdemKey(workspaceId: string, nicheId: string, date: string, providerLabel: string) {
  return `research:${workspaceId}:${nicheId}:${date}:${providerLabel}`
}

export class ResearchService {
  async run(input: ResearchRunInput) {
    const db = getDb()
    const niche = input.nicheId
      ? (db.prepare(`SELECT * FROM niches WHERE id = ? AND workspace_id = ?`).get(input.nicheId, input.workspaceId) as
          | { id: string; name: string; promise: string | null; keywords: string }
          | undefined)
      : (db
          .prepare(`SELECT * FROM niches WHERE workspace_id = ? AND active = 1 LIMIT 1`)
          .get(input.workspaceId) as { id: string; name: string; promise: string | null; keywords: string } | undefined)

    if (!niche) throw new Error('niche_not_found')

    const date = new Date().toISOString().slice(0, 10)
    const providers = input.testProviders ?? input.providers ?? defaultProviders()
    const providerLabel = providers.map((p) => p.name).sort().join('+')
    const idempotencyKey = researchIdemKey(input.workspaceId, niche.id, date, providerLabel)

    if (alreadyProcessed(idempotencyKey)) {
      const existing = db
        .prepare(`SELECT * FROM research_runs WHERE idempotency_key = ?`)
        .get(idempotencyKey)
      return { skipped: true, reason: 'idempotent_skip', researchRun: existing, reality: 'MOCK' as const }
    }

    const runId = uid()
    db.prepare(
      `INSERT INTO research_runs
       (id, workspace_id, niche_id, status, provider, started_at, items_found, topics_created,
        reality, execution_id, idempotency_key, created_at)
       VALUES (?, ?, ?, 'RUNNING', ?, ?, 0, 0, ?, ?, ?, ?)`,
    ).run(
      runId,
      input.workspaceId,
      niche.id,
      providerLabel,
      nowIso(),
      config.automationMode === 'mock' ? 'MOCK' : 'PENDING',
      input.executionId ?? null,
      idempotencyKey,
      nowIso(),
    )

    emitEvent({
      workspaceId: input.workspaceId,
      eventType: 'research.started',
      entityType: 'research_run',
      entityId: runId,
      reality: config.automationMode === 'mock' ? 'MOCK' : 'PENDING',
    })

    const keywords = parseJson<string[]>(niche.keywords, [])
    const collected: ResearchResult[] = []
    const providerOutcomes: Array<{ name: string; status: string; count?: number; error?: string }> = []
    let hardFailures = 0
    let configuredAttempts = 0

    for (const provider of providers) {
      if (provider.status === 'NOT_CONFIGURED') {
        providerOutcomes.push({ name: provider.name, status: 'NOT_CONFIGURED' })
        continue
      }
      configuredAttempts += 1

      const retry = await withRetry(async () => provider.search({
        workspaceId: input.workspaceId,
        nicheId: niche.id,
        nicheName: niche.name,
        keywords,
        promise: niche.promise,
      }))

      if (!retry.ok) {
        hardFailures += 1
        providerOutcomes.push({
          name: provider.name,
          status: 'FAILED',
          error: retry.failure.error,
        })
        db.prepare(
          `INSERT INTO automation_failures
           (id, workflow, execution_id, entity_type, entity_id, error, payload, attempts, status, created_at)
           VALUES (?, 'research_engine', ?, 'research_run', ?, ?, ?, ?, 'open', ?)`,
        ).run(
          uid(),
          input.executionId ?? runId,
          runId,
          retry.failure.error,
          JSON.stringify({ provider: provider.name }),
          retry.failure.attempts,
          nowIso(),
        )
        continue
      }

      collected.push(...retry.value)
      providerOutcomes.push({ name: provider.name, status: 'SUCCESS', count: retry.value.length })
      for (const item of retry.value) {
        emitEvent({
          workspaceId: input.workspaceId,
          eventType: 'source.discovered',
          entityType: 'source',
          entityId: item.sourceUrl,
          payload: { provider: item.provider, title: item.title, reality: item.reality },
          reality: item.reality === 'MOCK' ? 'MOCK' : 'PENDING',
        })
      }
    }

    if (configuredAttempts > 0 && hardFailures === configuredAttempts && collected.length === 0) {
      db.prepare(
        `UPDATE research_runs SET status='FAILED', completed_at=?, error=?, result=? WHERE id=?`,
      ).run(
        nowIso(),
        'all_providers_failed',
        JSON.stringify({ providerOutcomes }),
        runId,
      )
      emitEvent({
        workspaceId: input.workspaceId,
        eventType: 'research.failed',
        entityType: 'research_run',
        entityId: runId,
        reality: 'FAILED',
      })
      // Do not mark idempotent on FAILED — allows retryWorkflow
      return {
        skipped: false,
        researchRunId: runId,
        status: 'FAILED' as const,
        providerOutcomes,
        topicsCreated: [],
        reality: 'FAILED' as const,
      }
    }

    const normalized = normalizeResults(collected)
    const deduped = dedupeResults(normalized, niche.id)
    const topics = extractTopics(deduped)
    const topicIds: string[] = []

    for (const t of topics) {
      if (!t.fingerprint) continue
      const existing = db
        .prepare(`SELECT id FROM topics WHERE fingerprint = ?`)
        .get(t.fingerprint) as { id: string } | undefined
      if (existing) {
        const scored = scoreTopic(t.source, keywords)
        db.prepare(
          `UPDATE topics SET score=?, score_breakdown=?, opportunity_score=?, trend_score=?, gap_score=? WHERE id=?`,
        ).run(
          scored.score,
          JSON.stringify(scored.breakdown),
          scored.score / 100,
          scored.breakdown.trend / 100,
          scored.breakdown.competition / 100,
          existing.id,
        )
        emitEvent({
          workspaceId: input.workspaceId,
          eventType: 'topic.updated',
          entityType: 'topic',
          entityId: existing.id,
          reality: 'MOCK',
        })
        continue
      }

      const scored = scoreTopic(t.source, keywords)
      const topicId = uid()
      db.prepare(
        `INSERT INTO topics
         (id, workspace_id, niche_id, title, source_trace, opportunity_score, trend_score, gap_score,
          reality, created_at, fingerprint, score, score_breakdown, normalized_title)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        topicId,
        input.workspaceId,
        niche.id,
        t.title,
        JSON.stringify([
          {
            provider: t.source.provider,
            sourceUrl: t.source.sourceUrl,
            sourceTitle: t.source.sourceTitle,
            sourceType: t.source.sourceType,
            rawReference: t.source.rawReference,
            reality: t.source.reality,
          },
        ]),
        scored.score / 100,
        scored.breakdown.trend / 100,
        scored.breakdown.competition / 100,
        t.source.reality === 'MOCK' ? 'MOCK' : 'PENDING',
        nowIso(),
        t.fingerprint,
        scored.score,
        JSON.stringify(scored.breakdown),
        t.normalizedTitle,
      )
      topicIds.push(topicId)
      emitEvent({
        workspaceId: input.workspaceId,
        eventType: 'topic.created',
        entityType: 'topic',
        entityId: topicId,
        payload: { score: scored.score, breakdown: scored.breakdown },
        reality: t.source.reality === 'MOCK' ? 'MOCK' : 'PENDING',
      })
    }

    const status =
      hardFailures > 0 && topicIds.length + collected.length > 0
        ? 'PARTIAL'
        : 'COMPLETED'

    db.prepare(
      `UPDATE research_runs SET status=?, completed_at=?, items_found=?, topics_created=?, result=? WHERE id=?`,
    ).run(
      status,
      nowIso(),
      deduped.length,
      topicIds.length,
      JSON.stringify({ providerOutcomes, normalized: normalized.length, deduped: deduped.length }),
      runId,
    )

    emitEvent({
      workspaceId: input.workspaceId,
      eventType: status === 'PARTIAL' ? 'research.partial' : 'research.completed',
      entityType: 'research_run',
      entityId: runId,
      payload: { topicsCreated: topicIds.length, itemsFound: deduped.length },
      reality: 'MOCK',
    })

    markProcessed({
      eventId: idempotencyKey,
      workflow: 'research_engine',
      executionId: input.executionId,
      entityType: 'research_run',
      entityId: runId,
    })

    return {
      skipped: false,
      researchRunId: runId,
      status,
      providerOutcomes,
      topicsCreated: topicIds,
      itemsFound: deduped.length,
      reality: 'MOCK' as const,
    }
  }

  getRun(id: string) {
    return getDb().prepare(`SELECT * FROM research_runs WHERE id = ?`).get(id)
  }

  listRuns(workspaceId: string, limit = 50) {
    return getDb()
      .prepare(`SELECT * FROM research_runs WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?`)
      .all(workspaceId, limit)
  }
}

export const researchService = new ResearchService()

// re-export for tests
export { AlwaysFailResearchProvider, MockResearchProvider }
