import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import { resetDbForTests, getDb, uid, nowIso } from '../src/db/client.js'
import { buildServer } from '../src/server.js'
import { bootstrapWorkspace } from '../src/services/pipelines/dailyContentEngine.js'

process.env.AUTOMATION_MODE = 'mock'
process.env.CWM_FAST_RETRY = '1'

function insertTopic(workspaceId: string, nicheId: string, title: string, opportunity = 0.7) {
  const id = uid()
  getDb()
    .prepare(
      `INSERT INTO topics
       (id, workspace_id, niche_id, title, source_trace, opportunity_score, trend_score, gap_score, reality, created_at)
       VALUES (?, ?, ?, ?, '[]', ?, 0.5, 0.5, 'MOCK', ?)`,
    )
    .run(id, workspaceId, nicheId, title, opportunity, nowIso())
  return id
}

function insertScript(input: {
  workspaceId: string
  ideaId: string
  qaStatus: string
  status: string
  platform?: string
}) {
  const id = uid()
  getDb()
    .prepare(
      `INSERT INTO scripts
       (id, workspace_id, idea_id, hook, body, cta, caption, hashtags, visual_brief,
        qa_status, qa_notes, reality, created_at, platform, status)
       VALUES (?, ?, ?, 'hook', '{}', 'cta', 'cap', '[]', '{}', ?, '[]', 'MOCK', ?, ?, ?)`,
    )
    .run(
      id,
      input.workspaceId,
      input.ideaId,
      input.qaStatus,
      nowIso(),
      input.platform ?? 'YOUTUBE_SHORT',
      input.status,
    )
  return id
}

function insertIdeaDirect(workspaceId: string, title: string) {
  const id = uid()
  getDb()
    .prepare(
      `INSERT INTO content_ideas
       (id, workspace_id, topic_id, title, hooks, angles, formats, opportunity_score, status, reality, created_at)
       VALUES (?, ?, NULL, ?, '[]', '[]', '[]', 0.7, 'selected', 'MOCK', ?)`,
    )
    .run(id, workspaceId, title, nowIso())
  return id
}

describe('Ideas bridge + Script approve + Factory status API', () => {
  const tmp = path.join(os.tmpdir(), `cwm-ideas-${Date.now()}.sqlite`)
  let app: Awaited<ReturnType<typeof buildServer>>
  let workspaceId = ''
  let nicheId = ''

  before(async () => {
    resetDbForTests(tmp)
    app = await buildServer()
    const boot = await bootstrapWorkspace({ name: 'Ideas Lab', email: 'ideas@cwm.test' })
    workspaceId = boot.workspaceId
    nicheId = boot.nicheId
  })

  it('POST /api/ideas creates a selected idea from an explicit title', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/ideas',
      payload: { workspaceId, title: 'Como economizar tempo com IA' },
    })
    assert.equal(res.statusCode, 201)
    const body = res.json()
    assert.ok(body.id)

    const row = getDb().prepare(`SELECT * FROM content_ideas WHERE id = ?`).get(body.id) as {
      status: string
      title: string
    }
    assert.equal(row.status, 'selected')
    assert.equal(row.title, 'Como economizar tempo com IA')
  })

  it('POST /api/ideas without a title falls back to the latest topic', async () => {
    const topicId = insertTopic(workspaceId, nicheId, 'Topico mais recente sem ideia', 0.81)
    const res = await app.inject({
      method: 'POST',
      url: '/api/ideas',
      payload: { workspaceId },
    })
    assert.equal(res.statusCode, 201)
    const body = res.json()
    assert.equal(body.title, 'Topico mais recente sem ideia')
    assert.equal(body.topicId, topicId)
  })

  it('POST /api/ideas dedupes by title (returns existing id)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/ideas',
      payload: { workspaceId, title: 'Como economizar tempo com IA' },
    })
    assert.equal(res.statusCode, 200)
    assert.equal(res.json().deduped, true)
  })

  it('POST /api/ideas returns 404 for unknown workspace', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/ideas',
      payload: { workspaceId: uid(), title: 'Ideia orfa' },
    })
    assert.equal(res.statusCode, 404)
  })

  it('POST /api/ideas/from-research creates ideas for topics without one, capped at N', async () => {
    insertTopic(workspaceId, nicheId, 'Research Topic A', 0.9)
    insertTopic(workspaceId, nicheId, 'Research Topic B', 0.85)
    insertTopic(workspaceId, nicheId, 'Research Topic C', 0.8)

    const res = await app.inject({
      method: 'POST',
      url: '/api/ideas/from-research',
      payload: { workspaceId, limit: 2 },
    })
    assert.equal(res.statusCode, 201)
    const body = res.json()
    assert.equal(body.count, 2)
    assert.equal(body.created.length, 2)
    for (const c of body.created) {
      const row = getDb().prepare(`SELECT status FROM content_ideas WHERE id = ?`).get(c.id) as {
        status: string
      }
      assert.equal(row.status, 'selected')
    }
  })

  it('GET /api/ideas/workspaces/:workspaceId lists ideas', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/ideas/workspaces/${workspaceId}` })
    assert.equal(res.statusCode, 200)
    const body = res.json()
    assert.ok(Array.isArray(body.ideas))
    assert.ok(body.ideas.length >= 4)
  })

  it('POST /api/scripts/:id/approve sets status=approved and qa_status=passed', async () => {
    const ideaId = insertIdeaDirect(workspaceId, 'Idea for approval')
    const scriptId = insertScript({
      workspaceId,
      ideaId,
      qaStatus: 'requires_review',
      status: 'requires_review',
    })

    const res = await app.inject({
      method: 'POST',
      url: `/api/scripts/${scriptId}/approve`,
      payload: { workspaceId },
    })
    assert.equal(res.statusCode, 200)
    const body = res.json()
    assert.equal(body.status, 'approved')
    assert.equal(body.qaStatus, 'passed')

    const row = getDb().prepare(`SELECT status, qa_status FROM scripts WHERE id = ?`).get(scriptId) as {
      status: string
      qa_status: string
    }
    assert.equal(row.status, 'approved')
    assert.equal(row.qa_status, 'passed')
  })

  it('POST /api/scripts/:id/approve keeps qa_status=failed as failed (never masks failures)', async () => {
    const ideaId = insertIdeaDirect(workspaceId, 'Idea for failed qa')
    const scriptId = insertScript({ workspaceId, ideaId, qaStatus: 'failed', status: 'failed' })

    const res = await app.inject({
      method: 'POST',
      url: `/api/scripts/${scriptId}/approve`,
      payload: { workspaceId },
    })
    assert.equal(res.statusCode, 200)
    assert.equal(res.json().qaStatus, 'failed')

    const row = getDb().prepare(`SELECT status, qa_status FROM scripts WHERE id = ?`).get(scriptId) as {
      status: string
      qa_status: string
    }
    assert.equal(row.status, 'approved')
    assert.equal(row.qa_status, 'failed')
  })

  it('POST /api/scripts/:id/approve returns 404 for unknown script', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/scripts/${uid()}/approve`,
      payload: { workspaceId },
    })
    assert.equal(res.statusCode, 404)
  })

  it('GET /api/factory/status exposes script/voice/visual/composition providers', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/factory/status' })
    assert.equal(res.statusCode, 200)
    const body = res.json()
    assert.ok(body.script)
    assert.ok(body.voice)
    assert.ok(body.visual)
    assert.ok(body.composition)
    assert.ok(['READY', 'NOT_CONFIGURED'].includes(body.composition.ffmpeg_kenburns))
  })

  it('workspace snapshot includes scripts with status/platform', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/workspaces/${workspaceId}` })
    assert.equal(res.statusCode, 200)
    const body = res.json()
    assert.ok(Array.isArray(body.scripts))
    assert.ok(body.scripts.length >= 2)
    assert.ok('status' in body.scripts[0])
    assert.ok('platform' in body.scripts[0])
  })
})
