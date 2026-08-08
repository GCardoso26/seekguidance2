import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import { resetDbForTests, getDb, uid, nowIso } from '../src/db/client.js'
import { bootstrapWorkspace } from '../src/services/pipelines/dailyContentEngine.js'
import { scriptFactoryService } from '../src/scriptFactory/ScriptFactoryService.js'
import { routeAi, resolveRouteForMode } from '../src/services/AiRouter.js'
import { sumAiCost } from '../src/services/AiCostService.js'

process.env.AUTOMATION_MODE = 'mock'
process.env.CWM_FAST_RETRY = '1'

function insertIdea(workspaceId: string, topicId?: string) {
  const id = uid()
  getDb()
    .prepare(
      `INSERT INTO content_ideas
       (id, workspace_id, topic_id, title, hooks, angles, formats, opportunity_score, status, reality, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0.8, 'selected', 'MOCK', ?)`,
    )
    .run(
      id,
      workspaceId,
      topicId ?? null,
      'Como usar IA para criar 30 conteúdos',
      JSON.stringify(['Hook base']),
      JSON.stringify(['lista']),
      JSON.stringify(['short']),
      nowIso(),
    )
  return id
}

describe('Script Factory', () => {
  const tmp = path.join(os.tmpdir(), `cwm-script-${Date.now()}.sqlite`)
  let workspaceId = ''

  before(async () => {
    resetDbForTests(tmp)
    const boot = await bootstrapWorkspace({ name: 'Script Lab', email: 'script@cwm.test' })
    workspaceId = boot.workspaceId
  })

  it('generates hooks, script, cta, caption, visual brief', async () => {
    const ideaId = insertIdea(workspaceId)
    const result = await scriptFactoryService.run({
      workspaceId,
      contentIdeaId: ideaId,
      platform: 'TIKTOK',
    })
    assert.equal(result.skipped, false)
    if (result.skipped) return
    assert.equal(result.hooks?.length, 5)
    assert.ok(result.script?.hook)
    assert.ok(result.script?.cta)
    assert.ok(result.caption)
    assert.ok(result.visualBrief)
    assert.equal(result.scriptStatus, 'ready')
    assert.ok((result.costCents ?? 0) > 0)
    assert.ok(sumAiCost(workspaceId) > 0)
  })

  it('retries AI failures then succeeds', async () => {
    const ideaId = insertIdea(workspaceId)
    const result = await scriptFactoryService.run({
      workspaceId,
      contentIdeaId: ideaId,
      forceAiFailTimes: 2,
    })
    assert.equal(result.status, 'COMPLETED')
  })

  it('DLQ after 3 AI failures', async () => {
    const ideaId = insertIdea(workspaceId)
    const result = await scriptFactoryService.run({
      workspaceId,
      contentIdeaId: ideaId,
      forceAiFailTimes: 5,
    })
    assert.equal(result.status, 'FAILED')
    const dlq = getDb()
      .prepare(
        `SELECT * FROM automation_failures WHERE workflow='script_factory' ORDER BY created_at DESC LIMIT 1`,
      )
      .get() as { attempts: number }
    assert.equal(dlq.attempts, 3)
  })

  it('QA fail yields REQUIRES_REVIEW and never approved', async () => {
    const ideaId = insertIdea(workspaceId)
    const result = await scriptFactoryService.run({
      workspaceId,
      contentIdeaId: ideaId,
      forceQaFail: true,
    })
    assert.equal(result.skipped, false)
    if (result.skipped) return
    assert.equal(result.qaStatus, 'requires_review')
    assert.equal(result.scriptStatus, 'requires_review')
    const row = getDb().prepare(`SELECT status, qa_status FROM scripts WHERE id = ?`).get(result.scriptId) as {
      status: string
      qa_status: string
    }
    assert.equal(row.status, 'requires_review')
    assert.notEqual(row.status, 'approved')
  })

  it('is idempotent for same idea+prompt+platform', async () => {
    const ideaId = insertIdea(workspaceId)
    const first = await scriptFactoryService.run({
      workspaceId,
      contentIdeaId: ideaId,
      platform: 'YOUTUBE_SHORT',
    })
    const second = await scriptFactoryService.run({
      workspaceId,
      contentIdeaId: ideaId,
      platform: 'YOUTUBE_SHORT',
    })
    assert.equal(first.skipped, false)
    assert.equal(second.skipped, true)
  })

  it('AI Router selects model for script/hook/qa and records mock provider in mock mode', () => {
    const scriptRoute = resolveRouteForMode('script_generation', 'mock')
    const hookRoute = resolveRouteForMode('hook_generation', 'mock')
    const qaRoute = resolveRouteForMode('qa', 'mock')
    assert.equal(scriptRoute.provider, 'mock')
    assert.equal(hookRoute.provider, 'mock')
    assert.equal(qaRoute.provider, 'mock')
    assert.ok(routeAi('script_generation').model)
  })
})
