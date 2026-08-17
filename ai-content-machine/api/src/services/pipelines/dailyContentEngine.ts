import { getDb, uid, nowIso, parseJson } from '../../db/client.js'
import { emitEvent } from '../EventService.js'
import { planDailyContent } from '../AdaptiveContentPlanner.js'
import { mockResearch } from '../../providers/mockResearch.js'
import { mockGenerateIdeas, mockGenerateScript, mockRecycle } from '../../providers/mockAi.js'
import { mockProduceVideo } from '../../providers/mockProduction.js'
import { mockPublish } from '../../providers/mockPublish.js'
import { mockFetchMetrics, classifyPerformance } from '../../providers/mockAnalytics.js'
import { alreadyProcessed, markProcessed } from '../../lib/idempotency.js'

type Workspace = {
  id: string
  name: string
  approval_mode: string
  publishing_mode: string
  daily_content_qty: number
  ai_budget_cents_per_day: number
  paused: number
  brand_voice: string
}

function safetyCheck(script: { hook: string; cta: string; caption?: string | null }) {
  const notes: string[] = []
  let status: 'pass' | 'requires_review' | 'fail' = 'pass'
  if (!script.cta || script.cta.length < 8) {
    notes.push('missing CTA')
    status = 'requires_review'
  }
  if (/fique rico|ganhe milhões/i.test(`${script.hook} ${script.caption ?? ''}`)) {
    notes.push('forbidden claim')
    status = 'fail'
  }
  if (!script.hook) {
    notes.push('missing hook')
    status = 'fail'
  }
  return { status, notes }
}

function needsHumanApproval(approvalMode: string, safety: string, opportunityScore: number): boolean {
  if (approvalMode === 'MANUAL') return true
  if (approvalMode === 'FULL_AUTO') return safety !== 'pass'
  // SEMI_AUTO: low risk auto
  if (safety !== 'pass') return true
  return opportunityScore < 0.5
}

export async function runDailyContentEngine(workspaceId: string, executionId: string) {
  const db = getDb()
  const eventId = `daily:${workspaceId}:${new Date().toISOString().slice(0, 10)}`
  if (alreadyProcessed(eventId)) {
    return { skipped: true, reason: 'idempotent_skip', eventId }
  }

  const workspace = db.prepare(`SELECT * FROM workspaces WHERE id = ?`).get(workspaceId) as
    | Workspace
    | undefined
  if (!workspace) throw new Error('workspace_not_found')
  if (workspace.paused) throw new Error('workspace_paused')

  const channels = db
    .prepare(`SELECT * FROM channels WHERE workspace_id = ? AND active = 1`)
    .all(workspaceId) as Array<{ id: string; platform: string; face: string; name: string }>
  const niches = db
    .prepare(`SELECT * FROM niches WHERE workspace_id = ? AND active = 1`)
    .all(workspaceId) as Array<{ id: string; name: string; promise: string | null }>

  if (!channels.length || !niches.length) {
    throw new Error('workspace_missing_channels_or_niches')
  }

  // Historical performance for adaptive planner
  const hist = db
    .prepare(
      `SELECT title, performance_class as class, COALESCE(performance_score,0) as score
       FROM contents WHERE workspace_id = ? AND performance_class IS NOT NULL`,
    )
    .all(workspaceId) as Array<{ title: string; class: string; score: number }>

  const plan = planDailyContent(
    hist.map((h) => ({
      topicKey: h.title.split('—')[0]?.trim() || h.title,
      class: (h.class as 'WINNER' | 'PROMISING' | 'NORMAL' | 'LOSER') || 'NORMAL',
      score: h.score,
    })),
    workspace.daily_content_qty,
    workspace.ai_budget_cents_per_day,
  )

  let tokens = 0
  let costCents = 0
  const created = {
    topics: [] as string[],
    ideas: [] as string[],
    scripts: [] as string[],
    contents: [] as string[],
    published: [] as string[],
    winners: [] as string[],
    derivatives: [] as string[],
  }

  // RESEARCH + TOPICS
  for (const niche of niches) {
    const research = await mockResearch(niche.name)
    for (const hit of research.hits) {
      const topicId = uid()
      const opportunity = Number(((hit.trendScore + hit.gapScore) / 2).toFixed(3))
      db.prepare(
        `INSERT INTO topics
         (id, workspace_id, niche_id, title, source_trace, opportunity_score, trend_score, gap_score, reality, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'MOCK', ?)`,
      ).run(
        topicId,
        workspaceId,
        niche.id,
        hit.title,
        JSON.stringify([{ source: hit.source, questions: hit.questions }]),
        opportunity,
        hit.trendScore,
        hit.gapScore,
        nowIso(),
      )
      created.topics.push(topicId)
      emitEvent({
        workspaceId,
        eventType: 'topic.created',
        entityType: 'topic',
        entityId: topicId,
        payload: { title: hit.title, opportunity },
        reality: 'MOCK',
      })
    }
  }

  // Select top topics
  const topTopics = db
    .prepare(
      `SELECT * FROM topics WHERE workspace_id = ? ORDER BY opportunity_score DESC LIMIT ?`,
    )
    .all(workspaceId, Math.max(1, plan.allocations[0]?.quantity ?? workspace.daily_content_qty)) as Array<{
    id: string
    title: string
    opportunity_score: number
  }>

  const offer = db
    .prepare(`SELECT * FROM offers WHERE workspace_id = ? AND active = 1 LIMIT 1`)
    .get(workspaceId) as { id: string } | undefined

  // IDEAS → SCRIPTS → CONTENT → QA → APPROVAL → SCHEDULE → PUBLISH MOCK → ANALYTICS → WINNER → RECYCLE
  for (const topic of topTopics) {
    const ideaPack = await mockGenerateIdeas(topic.title)
    tokens += ideaPack.tokens
    costCents += ideaPack.costCents

    const ranked = [...ideaPack.ideas].sort((a, b) => b.opportunityScore - a.opportunityScore)
    const selected = ranked.slice(0, 1)

    for (const idea of selected) {
      // Dedup by title
      const exists = db
        .prepare(`SELECT id FROM content_ideas WHERE workspace_id = ? AND title = ?`)
        .get(workspaceId, idea.title) as { id: string } | undefined
      if (exists) continue

      const ideaId = uid()
      db.prepare(
        `INSERT INTO content_ideas
         (id, workspace_id, topic_id, title, hooks, angles, formats, opportunity_score, status, reality, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'selected', 'MOCK', ?)`,
      ).run(
        ideaId,
        workspaceId,
        topic.id,
        idea.title,
        JSON.stringify(idea.hooks),
        JSON.stringify(idea.angles),
        JSON.stringify(idea.formats),
        idea.opportunityScore,
        nowIso(),
      )
      created.ideas.push(ideaId)
      emitEvent({
        workspaceId,
        eventType: 'idea.created',
        entityType: 'idea',
        entityId: ideaId,
        reality: 'MOCK',
      })

      const hook = idea.hooks[0]
      const gen = await mockGenerateScript(idea.title, hook)
      tokens += gen.tokens
      costCents += gen.costCents

      const scriptId = uid()
      const body = {
        problem: gen.script.problem,
        insight: gen.script.insight,
        solution: gen.script.solution,
      }
      const safety = safetyCheck(gen.script)
      db.prepare(
        `INSERT INTO scripts
         (id, workspace_id, idea_id, hook, body, cta, caption, hashtags, visual_brief, qa_status, qa_notes, reality, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'MOCK', ?)`,
      ).run(
        scriptId,
        workspaceId,
        ideaId,
        gen.script.hook,
        JSON.stringify(body),
        gen.script.cta,
        gen.script.caption,
        JSON.stringify(gen.script.hashtags),
        JSON.stringify(gen.script.visualBrief),
        safety.status === 'pass' ? 'passed' : safety.status,
        JSON.stringify(safety.notes),
        nowIso(),
      )
      created.scripts.push(scriptId)
      emitEvent({
        workspaceId,
        eventType: 'script.created',
        entityType: 'script',
        entityId: scriptId,
        reality: 'MOCK',
      })

      // Variants: one content per active channel (capped by daily qty remaining)
      for (const channel of channels.slice(0, 3)) {
        if (created.contents.length >= workspace.daily_content_qty) break

        const contentId = uid()
        const approvalRequired = needsHumanApproval(
          workspace.approval_mode,
          safety.status,
          idea.opportunityScore,
        )
          ? 1
          : 0

        let status = 'pending_approval'
        if (!approvalRequired && safety.status === 'pass') status = 'approved'
        if (safety.status === 'fail') status = 'rejected'

        db.prepare(
          `INSERT INTO contents
           (id, workspace_id, idea_id, script_id, channel_id, title, status, approval_required,
            safety_status, safety_notes, offer_id, cost_cents, reality, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'MOCK', ?, ?)`,
        ).run(
          contentId,
          workspaceId,
          ideaId,
          scriptId,
          channel.id,
          `${idea.title} [${channel.platform}]`,
          status,
          approvalRequired,
          safety.status,
          JSON.stringify(safety.notes),
          offer?.id ?? null,
          15,
          nowIso(),
          nowIso(),
        )
        created.contents.push(contentId)
        emitEvent({
          workspaceId,
          eventType: 'content.created',
          entityType: 'content',
          entityId: contentId,
          reality: 'MOCK',
        })

        if (status === 'rejected') continue

        // Auto-approve path for SEMI/FULL
        if (status === 'approved') {
          emitEvent({
            workspaceId,
            eventType: 'content.approved',
            entityType: 'content',
            entityId: contentId,
            reality: 'MOCK',
          })

          // Production with validation
          const produced = await mockProduceVideo(contentId)
          costCents += produced.costCents
          if (!produced.validation.ok) {
            db.prepare(
              `UPDATE contents SET status='failed', asset_meta=?, updated_at=? WHERE id=?`,
            ).run(JSON.stringify(produced), nowIso(), contentId)
            emitEvent({
              workspaceId,
              eventType: 'content.failed',
              entityType: 'content',
              entityId: contentId,
              payload: { stage: 'production', validation: produced.validation },
              reality: 'FAILED',
            })
            continue
          }

          const scheduledAt = nowIso()
          db.prepare(
            `UPDATE contents SET status='scheduled', scheduled_at=?, asset_meta=?, updated_at=? WHERE id=?`,
          ).run(scheduledAt, JSON.stringify(produced), nowIso(), contentId)
          emitEvent({
            workspaceId,
            eventType: 'content.scheduled',
            entityType: 'content',
            entityId: contentId,
            reality: 'MOCK',
          })

          if (workspace.publishing_mode === 'AUTO') {
            const pub = await mockPublish(contentId, channel.platform)
            if (!pub.ok) {
              db.prepare(`UPDATE contents SET status='failed', updated_at=? WHERE id=?`).run(
                nowIso(),
                contentId,
              )
              emitEvent({
                workspaceId,
                eventType: 'content.failed',
                entityType: 'content',
                entityId: contentId,
                payload: { stage: 'publish', error: pub.error },
                reality: 'FAILED',
              })
              continue
            }

            // Only mark published with platform confirmation (mock ack)
            db.prepare(
              `UPDATE contents SET status='published', platform_post_id=?, published_at=?, updated_at=? WHERE id=?`,
            ).run(pub.platformPostId, pub.publishedAt, nowIso(), contentId)
            created.published.push(contentId)
            emitEvent({
              workspaceId,
              eventType: 'content.published',
              entityType: 'content',
              entityId: contentId,
              payload: { platformPostId: pub.platformPostId, confirmation: pub.confirmation },
              reality: 'MOCK',
            })

            // Analytics mock
            const metrics = await mockFetchMetrics(pub.platformPostId)
            const metricId = uid()
            db.prepare(
              `INSERT INTO content_metrics
               (id, content_id, views, likes, comments, shares, saves, watch_time_sec, retention_pct, ctr, clicks, followers_gained, reality, fetched_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'MOCK', ?)`,
            ).run(
              metricId,
              contentId,
              metrics.views,
              metrics.likes,
              metrics.comments,
              metrics.shares,
              metrics.saves,
              metrics.watch_time_sec,
              metrics.retention_pct,
              metrics.ctr,
              metrics.clicks,
              metrics.followers_gained,
              nowIso(),
            )
            emitEvent({
              workspaceId,
              eventType: 'metrics.updated',
              entityType: 'content',
              entityId: contentId,
              reality: 'MOCK',
            })

            let classified = classifyPerformance(metrics.views, metrics.retention_pct, 2000)
            // Guarantee feedback-loop demo: first published item of the run is treated as WINNER seed
            if (created.winners.length === 0 && created.published.length === 1) {
              classified = { class: 'WINNER', score: Math.max(classified.score, 1.5) }
            }
            db.prepare(
              `UPDATE contents SET performance_class=?, performance_score=?, updated_at=? WHERE id=?`,
            ).run(classified.class, classified.score, nowIso(), contentId)

            if (classified.class === 'WINNER') {
              created.winners.push(contentId)
              emitEvent({
                workspaceId,
                eventType: 'content.winner_detected',
                entityType: 'content',
                entityId: contentId,
                payload: { score: classified.score },
                reality: 'MOCK',
              })

              const recycled = await mockRecycle(idea.title)
              tokens += recycled.tokens
              costCents += recycled.costCents
              for (const d of recycled.derivatives) {
                const derivIdeaId = uid()
                db.prepare(
                  `INSERT INTO content_ideas
                   (id, workspace_id, topic_id, title, hooks, angles, formats, opportunity_score,
                    parent_content_id, derivation_type, new_angle, status, reality, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'derived', 'MOCK', ?)`,
                ).run(
                  derivIdeaId,
                  workspaceId,
                  topic.id,
                  `${d.newAngle}`,
                  JSON.stringify([d.newHook]),
                  JSON.stringify([d.derivationType]),
                  JSON.stringify(['short']),
                  0.9,
                  contentId,
                  d.derivationType,
                  d.newAngle,
                  nowIso(),
                )
                created.derivatives.push(derivIdeaId)
                emitEvent({
                  workspaceId,
                  eventType: 'idea.created',
                  entityType: 'idea',
                  entityId: derivIdeaId,
                  payload: { derivationType: d.derivationType, parentContentId: contentId },
                  reality: 'MOCK',
                })
              }
            }
          }
        }
      }
    }
  }

  // War campaign progress
  const war = db
    .prepare(`SELECT * FROM war_campaigns WHERE workspace_id = ? AND status='active' ORDER BY started_at DESC LIMIT 1`)
    .get(workspaceId) as
    | {
        id: string
        day: number
        posts: number
        views: number
        leads: number
        sales: number
        revenue_cents: number
      }
    | undefined

  if (war) {
    const viewsSum = (
      db
        .prepare(
          `SELECT COALESCE(SUM(m.views),0) as v FROM content_metrics m
           JOIN contents c ON c.id = m.content_id WHERE c.workspace_id = ?`,
        )
        .get(workspaceId) as { v: number }
    ).v
    db.prepare(
      `UPDATE war_campaigns SET day = ?, posts = ?, views = ?, updated_at = ? WHERE id = ?`,
    ).run(Math.min(30, war.day + 1), war.posts + created.published.length, viewsSum, nowIso(), war.id)
  }

  markProcessed({
    eventId,
    workflow: 'content_daily_pipeline',
    executionId,
    entityType: 'workspace',
    entityId: workspaceId,
  })

  return {
    skipped: false,
    eventId,
    plan,
    tokens,
    costCents,
    created,
    reality: 'MOCK' as const,
  }
}

/** Delegates to independent ResearchService (Phase 2) — Daily Engine not rewritten. */
export async function runResearchEngine(workspaceId: string, executionId?: string) {
  const { researchService } = await import('../../research/ResearchService.js')
  const db = getDb()
  const niches = db
    .prepare(`SELECT id FROM niches WHERE workspace_id = ? AND active = 1`)
    .all(workspaceId) as Array<{ id: string }>
  const topicIds: string[] = []
  const runs: unknown[] = []
  for (const niche of niches) {
    const result = await researchService.run({
      workspaceId,
      nicheId: niche.id,
      executionId,
    })
    runs.push(result)
    if (!result.skipped && 'topicsCreated' in result) {
      topicIds.push(...(result.topicsCreated as string[]))
    }
  }
  return { topicIds, runs, reality: 'MOCK' as const }
}

export async function bootstrapWorkspace(input: {
  name: string
  email?: string
}) {
  const db = getDb()
  const userId = uid()
  const workspaceId = uid()
  db.prepare(`INSERT INTO users (id, email, name, created_at) VALUES (?, ?, ?, ?)`).run(
    userId,
    input.email ?? `${workspaceId.slice(0, 8)}@cwm.local`,
    input.name,
    nowIso(),
  )
  db.prepare(
    `INSERT INTO workspaces
     (id, name, owner_user_id, brand_voice, automation_mode, approval_mode, publishing_mode,
      daily_content_qty, ai_budget_cents_per_day, created_at)
     VALUES (?, ?, ?, ?, 'mock', 'SEMI_AUTO', 'AUTO', 5, 2000, ?)`,
  ).run(
    workspaceId,
    input.name,
    userId,
    JSON.stringify({ tone: 'direto', cta: 'kit no link da bio' }),
    nowIso(),
  )

  const channelDefs = [
    { name: 'Canal A — IA + dinheiro', platform: 'tiktok', face: 'A' },
    { name: 'Canal B — IA + produtividade', platform: 'youtube', face: 'B' },
    { name: 'Canal C — IA + ferramentas', platform: 'instagram', face: 'C' },
  ]
  const channelIds = channelDefs.map((c) => {
    const id = uid()
    db.prepare(
      `INSERT INTO channels (id, workspace_id, name, platform, face, active, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
    ).run(id, workspaceId, c.name, c.platform, c.face, nowIso())
    return id
  })

  const nicheId = uid()
  db.prepare(
    `INSERT INTO niches (id, workspace_id, name, promise, keywords, active, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?)`,
  ).run(
    nicheId,
    workspaceId,
    'IA + produtividade + dinheiro digital',
    'Como usar IA para economizar tempo e ganhar dinheiro',
    JSON.stringify(['chatgpt', 'n8n', 'dark content', 'renda extra']),
    nowIso(),
  )

  const offerId = uid()
  db.prepare(
    `INSERT INTO offers (id, workspace_id, name, price_cents, type, landing_url, active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
  ).run(
    offerId,
    workspaceId,
    'AI Income Starter Kit',
    6700,
    'digital',
    '/oferta',
    nowIso(),
  )

  return { workspaceId, userId, channelIds, nicheId, offerId }
}

export async function startWar(workspaceId: string) {
  const id = uid()
  getDb()
    .prepare(
      `INSERT INTO war_campaigns
       (id, workspace_id, day, goal_revenue_cents, revenue_cents, posts, views, leads, sales, status, started_at, updated_at)
       VALUES (?, ?, 1, 1000000, 0, 0, 0, 0, 0, 'active', ?, ?)`,
    )
    .run(id, workspaceId, nowIso(), nowIso())
  return { warId: id }
}

export function getWorkspaceSnapshot(workspaceId: string) {
  const db = getDb()
  const workspace = db.prepare(`SELECT * FROM workspaces WHERE id = ?`).get(workspaceId)
  const channels = db.prepare(`SELECT * FROM channels WHERE workspace_id = ?`).all(workspaceId)
  const niches = db.prepare(`SELECT * FROM niches WHERE workspace_id = ?`).all(workspaceId)
  const topics = db.prepare(`SELECT * FROM topics WHERE workspace_id = ?`).all(workspaceId)
  const ideas = db.prepare(`SELECT * FROM content_ideas WHERE workspace_id = ?`).all(workspaceId)
  // status/platform live on scripts already; provider comes from the linked script_run (if any)
  const scripts = db
    .prepare(
      `SELECT s.*, sr.provider as provider, sr.model as model
       FROM scripts s
       LEFT JOIN script_runs sr ON sr.id = s.script_run_id
       WHERE s.workspace_id = ?`,
    )
    .all(workspaceId)
  const contents = db.prepare(`SELECT * FROM contents WHERE workspace_id = ?`).all(workspaceId)
  const metrics = db
    .prepare(
      `SELECT m.* FROM content_metrics m JOIN contents c ON c.id = m.content_id WHERE c.workspace_id = ?`,
    )
    .all(workspaceId)
  const events = db
    .prepare(`SELECT * FROM domain_events WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 200`)
    .all(workspaceId)
  const war = db
    .prepare(
      `SELECT * FROM war_campaigns WHERE workspace_id = ? ORDER BY started_at DESC LIMIT 1`,
    )
    .get(workspaceId)
  const runs = db
    .prepare(`SELECT * FROM automation_runs WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 50`)
    .all(workspaceId)
  return {
    workspace,
    channels,
    niches,
    topics,
    ideas,
    scripts,
    contents,
    metrics,
    events,
    war,
    runs,
  }
}

// silence unused import warning helper usage
void parseJson
