import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import { resetDbForTests, getDb, uid, nowIso } from '../src/db/client.js'
import { buildServer } from '../src/server.js'
import { bootstrapWorkspace } from '../src/services/pipelines/dailyContentEngine.js'
import { productionService } from '../src/production/ProductionService.js'
import { publishingService } from '../src/publishing/PublishingService.js'
import { analyticsService } from '../src/analytics/AnalyticsService.js'
import { winnerDetectionService, computePerformanceScore, classifyWinnerState } from '../src/winner/WinnerDetectionService.js'
import { strategyService } from '../src/strategy/StrategyService.js'
import { mockAnalyticsProvider } from '../src/analytics/MockAnalyticsProvider.js'
import { DEFAULT_WINNER_CRITERIA, DEFAULT_PERFORMANCE_WEIGHTS } from '../src/publishing/types.js'
import { automationService } from '../src/services/AutomationService.js'

process.env.AUTOMATION_MODE = 'mock'
process.env.CWM_FAST_RETRY = '1'

async function seedReadyContent(workspaceId: string, platform = 'YOUTUBE_SHORT') {
  const db = getDb()
  const niche = db.prepare(`SELECT id FROM niches WHERE workspace_id=? LIMIT 1`).get(workspaceId) as {
    id: string
  }
  const topicId = uid()
  const ideaId = uid()
  const scriptId = uid()
  db.prepare(
    `INSERT INTO topics (id, workspace_id, niche_id, title, source_trace, opportunity_score, trend_score, gap_score, reality, created_at, fingerprint, score, score_breakdown)
     VALUES (?, ?, ?, ?, '[]', 0.8, 0.7, 0.6, 'MOCK', ?, ?, 85, '{}')`,
  ).run(topicId, workspaceId, niche.id, `Topic ${scriptId.slice(0, 6)}`, nowIso(), `fp-${topicId}`)
  db.prepare(
    `INSERT INTO content_ideas
     (id, workspace_id, topic_id, title, hooks, angles, formats, opportunity_score, status, reality, created_at)
     VALUES (?, ?, ?, ?, '[]', '[]', '[]', 0.9, 'selected', 'MOCK', ?)`,
  ).run(ideaId, workspaceId, topicId, `Idea ${ideaId.slice(0, 6)}`, nowIso())
  const body = {
    hook: 'Hook vencedor de produtividade com IA',
    setup: 'Setup',
    problem: 'Problem',
    insight: 'Insight',
    value: 'Value',
    proof: 'Proof',
    cta: 'Pegue o kit na bio',
  }
  db.prepare(
    `INSERT INTO scripts
     (id, workspace_id, idea_id, hook, body, cta, caption, hashtags, visual_brief,
      qa_status, qa_notes, reality, created_at, platform, status, quality_score, quality_breakdown, selected_hooks)
     VALUES (?, ?, ?, ?, ?, ?, 'caption', '["#ia","#produtividade"]', ?, 'passed', '[]', 'MOCK', ?, ?, 'approved', 90, '{}', '[]')`,
  ).run(
    scriptId,
    workspaceId,
    ideaId,
    body.hook,
    JSON.stringify(body),
    body.cta,
    JSON.stringify({ durationSec: 2, shots: [{}, {}, {}], style: 'dark_vertical' }),
    nowIso(),
    platform,
  )

  const prod = await productionService.run({
    workspaceId,
    scriptId,
    platform,
    targetDurationOverride: 2,
  })
  assert.equal(prod.status, 'COMPLETED')
  assert.equal(prod.packageStatus, 'READY_FOR_PUBLISH')
  const run = productionService.getRun(prod.productionRunId!) as { content_id: string }
  return { scriptId, contentId: run.content_id, productionRunId: prod.productionRunId! }
}

describe('Phase 4 Publishing + Feedback Loop', () => {
  const tmp = path.join(os.tmpdir(), `cwm-p4-${Date.now()}.sqlite`)
  let app: Awaited<ReturnType<typeof buildServer>>
  let workspaceId = ''

  before(async () => {
    resetDbForTests(tmp)
    app = await buildServer()
    const boot = await bootstrapWorkspace({ name: 'P4 E2E', email: 'p4@cwm.test' })
    workspaceId = boot.workspaceId
  })

  it('MockPublisher: READY_FOR_PUBLISH → PUBLISHED with MOCK reality', async () => {
    const { contentId } = await seedReadyContent(workspaceId)
    const out = await publishingService.run({
      workspaceId,
      contentId,
      platform: 'YOUTUBE_SHORT',
    })
    assert.equal(out.status, 'PUBLISHED')
    assert.equal(out.reality, 'MOCK')
    assert.ok(out.externalId?.startsWith('mock_'))
    const content = getDb().prepare(`SELECT * FROM contents WHERE id=?`).get(contentId) as {
      status: string
      platform_post_id: string
    }
    assert.equal(content.status, 'published')
    assert.ok(content.platform_post_id)
    const pkg = getDb()
      .prepare(`SELECT status FROM content_packages WHERE content_id=?`)
      .get(contentId) as { status: string }
    assert.equal(pkg.status, 'PUBLISHED')
  })

  it('idempotency: publish twice → one publication', async () => {
    const { contentId } = await seedReadyContent(workspaceId, 'TIKTOK')
    const a = await publishingService.run({ workspaceId, contentId, platform: 'TIKTOK' })
    const b = await publishingService.run({ workspaceId, contentId, platform: 'TIKTOK' })
    assert.equal(b.skipped, true)
    assert.equal(a.publicationRunId, b.publicationRunId)
    const count = getDb()
      .prepare(`SELECT COUNT(*) as c FROM publication_runs WHERE content_id=? AND platform='TIKTOK'`)
      .get(contentId) as { c: number }
    assert.equal(count.c, 1)
  })

  it('publish failure → retry → DLQ', async () => {
    const { contentId } = await seedReadyContent(workspaceId, 'INSTAGRAM_REEL')
    const failed = await publishingService.run({
      workspaceId,
      contentId,
      platform: 'INSTAGRAM_REEL',
      forceFailTimes: 99,
    })
    assert.equal(failed.status, 'FAILED')
    const dlq = getDb()
      .prepare(`SELECT * FROM automation_failures WHERE workflow='content_publisher' AND entity_id=?`)
      .all(failed.publicationRunId) as Array<{ attempts: number }>
    assert.ok(dlq.length >= 1)
    assert.ok(dlq[0].attempts >= 3)

    const retried = await publishingService.retry(failed.publicationRunId!)
    assert.equal(retried.status, 'PUBLISHED')
  })

  it('analytics snapshot is append-only and deterministic by scenario', async () => {
    const { contentId } = await seedReadyContent(workspaceId)
    const pub = await publishingService.run({ workspaceId, contentId, platform: 'YOUTUBE_SHORT' })
    const s1 = await analyticsService.sync({
      workspaceId,
      publicationId: pub.publicationRunId,
      scenario: 'WINNER',
      windowLabel: 't1',
    })
    const s2 = await analyticsService.sync({
      workspaceId,
      publicationId: pub.publicationRunId,
      scenario: 'WINNER',
      windowLabel: 't2',
    })
    assert.equal(s1.snapshots.length, 1)
    assert.equal(s2.snapshots.length, 1)
    assert.notEqual(s1.snapshots[0], s2.snapshots[0])
    const snaps = getDb()
      .prepare(`SELECT views FROM metric_snapshots WHERE publication_id=?`)
      .all(pub.publicationRunId) as Array<{ views: number }>
    assert.ok(snaps.every((s) => s.views === 12000))
  })

  it('preferReal + publication REAL yields YOUTUBE snapshot even when AUTOMATION_MODE=mock', async () => {
    const { config } = await import('../src/config.js')
    const prevId = config.youtubeClientId
    const prevSecret = config.youtubeClientSecret
    config.youtubeClientId = 'test-client-id'
    config.youtubeClientSecret = 'test-client-secret'

    const { youtubeAnalyticsProvider } = await import('../src/analytics/YouTubeAnalyticsProvider.js')
    const originalFetch = youtubeAnalyticsProvider.fetch.bind(youtubeAnalyticsProvider)
    youtubeAnalyticsProvider.fetch = async () => ({
      metrics: {
        views: 7,
        likes: 2,
        comments: 1,
        shares: 0,
        saves: 0,
        watchTime: 0,
        averageViewDuration: 9,
        completionRate: 0.3,
        followersGained: 0,
        clicks: 0,
        conversions: 0,
      },
      raw: { viewCount: 7, provider: 'youtube_analytics' },
      source: 'YOUTUBE',
      status: 'TRACKING',
    })

    try {
      const { contentId } = await seedReadyContent(workspaceId)
      const pub = await publishingService.run({ workspaceId, contentId, platform: 'YOUTUBE_SHORT' })
      getDb()
        .prepare(
          `UPDATE publication_runs SET publication_source='REAL', external_id=?, status='PUBLISHED' WHERE id=?`,
        )
        .run('fakeVideoIdPreferReal', pub.publicationRunId)

      const sync = await analyticsService.sync({
        workspaceId,
        publicationId: pub.publicationRunId,
        preferReal: true,
        windowLabel: 'prefer-real-test',
      })
      assert.equal(sync.reality, 'REAL')
      assert.equal(sync.status, 'COMPLETED')
      const row = getDb()
        .prepare(`SELECT metrics_source, reality, views FROM metric_snapshots WHERE id=?`)
        .get(sync.snapshots[0]) as { metrics_source: string; reality: string; views: number }
      assert.equal(row.metrics_source, 'YOUTUBE')
      assert.equal(row.reality, 'REAL')
      assert.equal(row.views, 7)
    } finally {
      youtubeAnalyticsProvider.fetch = originalFetch
      config.youtubeClientId = prevId
      config.youtubeClientSecret = prevSecret
    }
  })

  it('Winner engine classifies WINNER/NORMAL/LOSER/INSUFFICIENT_DATA deterministically', () => {
    const profiles = ['WINNER', 'NORMAL', 'LOSER', 'INSUFFICIENT_DATA'] as const
    for (const scenario of profiles) {
      const m = mockAnalyticsProvider.profile(scenario)
      const score = computePerformanceScore(m, DEFAULT_PERFORMANCE_WEIGHTS)
      const state = classifyWinnerState(m, score, 24, {
        ...DEFAULT_WINNER_CRITERIA,
        minimumAgeHours: 0,
      })
      if (scenario === 'WINNER') assert.equal(state, 'WINNER')
      if (scenario === 'LOSER') assert.equal(state, 'LOSER')
      if (scenario === 'INSUFFICIENT_DATA') assert.equal(state, 'INSUFFICIENT_DATA')
      if (scenario === 'NORMAL') assert.ok(state === 'NORMAL' || state === 'TRACKING')
    }
  })

  it('3 winners → strong strategy recommendation', async () => {
    const contentIds: string[] = []
    for (let i = 0; i < 3; i++) {
      const { contentId } = await seedReadyContent(workspaceId, 'YOUTUBE_SHORT')
      const pub = await publishingService.run({
        workspaceId,
        contentId,
        platform: 'YOUTUBE_SHORT',
        publicationVersion: 1,
      })
      // unique idempotency already by contentId
      await analyticsService.sync({
        workspaceId,
        publicationId: pub.publicationRunId,
        scenario: 'WINNER',
      })
      await winnerDetectionService.detect({
        workspaceId,
        publicationId: pub.publicationRunId,
        ageHoursOverride: 24,
        criteria: { minimumAgeHours: 0 },
      })
      contentIds.push(contentId)
    }
    const strat = await strategyService.analyze({
      workspaceId,
      minimumEvidence: 3,
      feedResearch: false,
    })
    assert.ok(strat.strong.length >= 1)
    const strong = getDb()
      .prepare(
        `SELECT * FROM strategy_recommendations WHERE workspace_id=? AND status='strong' ORDER BY created_at DESC LIMIT 1`,
      )
      .get(workspaceId) as { evidence_count: number; kind: string }
    assert.ok(strong.evidence_count >= 3)
    void contentIds
  })

  it('API publishing run default 202 + await feedback loop', async () => {
    const { contentId } = await seedReadyContent(workspaceId)
    const queued = await app.inject({
      method: 'POST',
      url: '/api/publishing/run',
      payload: { workspaceId, contentId, platform: 'TIKTOK' },
    })
    assert.equal(queued.statusCode, 202)
    assert.equal(queued.json().status, 'QUEUED')

    const { contentId: c2 } = await seedReadyContent(workspaceId)
    const loop = await app.inject({
      method: 'POST',
      url: '/api/publishing/run',
      payload: {
        workspaceId,
        contentId: c2,
        platform: 'YOUTUBE_SHORT',
        await: true,
        feedbackLoop: true,
        scenario: 'WINNER',
      },
    })
    assert.equal(loop.statusCode, 200)
    const body = loop.json()
    assert.equal(body.status, 'COMPLETED')
    assert.ok(body.result.analytics.snapshots.length >= 1)
    assert.ok(body.result.winners.results.some((r: { state: string }) => r.state === 'WINNER'))
    assert.ok(body.result.strategy.recommendations.length >= 1)
    assert.ok(body.result.strategy.researchFeedback)
  })

  it('Full CWM loop: Research → Script → Production → Publish → Metrics → Winner → Strategy → Research', async () => {
    // Research
    const niche = getDb()
      .prepare(`SELECT id FROM niches WHERE workspace_id=? LIMIT 1`)
      .get(workspaceId) as { id: string }
    const research = await automationService.triggerWorkflow('research_engine', workspaceId, {
      nicheId: niche.id,
    })
    assert.ok(research.executionId)

    // Idea + Script
    const topic = getDb()
      .prepare(`SELECT id FROM topics WHERE workspace_id=? ORDER BY created_at DESC LIMIT 1`)
      .get(workspaceId) as { id: string }
    const ideaId = uid()
    getDb()
      .prepare(
        `INSERT INTO content_ideas
         (id, workspace_id, topic_id, title, hooks, angles, formats, opportunity_score, status, reality, created_at)
         VALUES (?, ?, ?, 'Loop Idea', '[]', '[]', '[]', 0.9, 'selected', 'MOCK', ?)`,
      )
      .run(ideaId, workspaceId, topic.id, nowIso())
    const script = await automationService.triggerWorkflow('script_factory', workspaceId, {
      contentIdeaId: ideaId,
      platform: 'YOUTUBE_SHORT',
    })
    const scriptId = (script.result as { scriptId?: string }).scriptId
    assert.ok(scriptId)
    getDb().prepare(`UPDATE scripts SET status='approved', qa_status='passed' WHERE id=?`).run(scriptId)

    // Production
    const prod = await automationService.triggerWorkflow('content_production', workspaceId, {
      scriptId,
      platform: 'YOUTUBE_SHORT',
      targetDurationOverride: 2,
    })
    assert.equal((prod.result as { packageStatus?: string }).packageStatus, 'READY_FOR_PUBLISH')
    const contentId = (
      productionService.getRun((prod.result as { productionRunId: string }).productionRunId) as {
        content_id: string
      }
    ).content_id

    // Publish + feedback
    const loop = await automationService.triggerWorkflow('content_publisher', workspaceId, {
      contentId,
      platform: 'YOUTUBE_SHORT',
      feedbackLoop: true,
      scenario: 'WINNER',
      feedResearch: true,
      minimumEvidence: 1,
    })
    assert.equal((loop.result as { status: string }).status, 'COMPLETED')
    const publicationRunId = (loop.result as { publicationRunId: string }).publicationRunId

    // Assertions: 1 published, 1 snapshot, 1 winner, 1 recommendation, new research
    const pub = getDb()
      .prepare(`SELECT * FROM publication_runs WHERE id=?`)
      .get(publicationRunId) as { status: string; reality: string }
    assert.equal(pub.status, 'PUBLISHED')
    assert.equal(pub.reality, 'MOCK')

    const snaps = getDb()
      .prepare(`SELECT COUNT(*) as c FROM metric_snapshots WHERE publication_id=?`)
      .get(publicationRunId) as { c: number }
    assert.ok(snaps.c >= 1)

    const content = getDb().prepare(`SELECT performance_class FROM contents WHERE id=?`).get(contentId) as {
      performance_class: string
    }
    assert.equal(content.performance_class, 'WINNER')

    const recs = getDb()
      .prepare(`SELECT COUNT(*) as c FROM strategy_recommendations WHERE workspace_id=?`)
      .get(workspaceId) as { c: number }
    assert.ok(recs.c >= 1)

    const researchFeedback = (loop.result as { strategy?: { researchFeedback?: { skipped?: boolean; status?: string } } })
      .strategy?.researchFeedback
    assert.ok(researchFeedback)
    // force research creates a new run (not necessarily skipped)
    const researchCount = getDb()
      .prepare(`SELECT COUNT(*) as c FROM research_runs WHERE workspace_id=?`)
      .get(workspaceId) as { c: number }
    assert.ok(researchCount.c >= 2)

    const events = getDb()
      .prepare(`SELECT event_type FROM domain_events WHERE workspace_id=?`)
      .all(workspaceId) as Array<{ event_type: string }>
    const types = new Set(events.map((e) => e.event_type))
    assert.ok(types.has('publication.published'))
    assert.ok(types.has('metrics.snapshot_created'))
    assert.ok(types.has('content.winner_detected'))
    assert.ok(types.has('strategy.recommended'))
  })

  it('daily engine regression remains green', async () => {
    const out = await automationService.triggerWorkflow('content_daily_pipeline', workspaceId, {})
    assert.ok(out.executionId)
  })
})
