import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import { resetDbForTests, getDb, uid, nowIso } from '../src/db/client.js'
import { bootstrapWorkspace } from '../src/services/pipelines/dailyContentEngine.js'
import { buildPublicationMetadata } from '../src/publishing/PublicationMetadataBuilder.js'

process.env.AUTOMATION_MODE = 'mock'

function seedContentWithScript(
  workspaceId: string,
  input: { cta: string; hashtags: string[]; caption?: string },
) {
  const db = getDb()
  const ideaId = uid()
  const scriptId = uid()
  const contentId = uid()
  const topicId = uid()
  const niche = db.prepare(`SELECT id FROM niches WHERE workspace_id=? LIMIT 1`).get(workspaceId) as {
    id: string
  }
  db.prepare(
    `INSERT INTO topics (id, workspace_id, niche_id, title, source_trace, opportunity_score, trend_score, gap_score, reality, created_at, fingerprint, score, score_breakdown)
     VALUES (?, ?, ?, 'PubMeta Topic', '[]', 0.8, 0.7, 0.6, 'MOCK', ?, ?, 80, '{}')`,
  ).run(topicId, workspaceId, niche.id, nowIso(), `fp-pubmeta-${topicId}`)
  db.prepare(
    `INSERT INTO content_ideas
     (id, workspace_id, topic_id, title, hooks, angles, formats, opportunity_score, status, reality, created_at)
     VALUES (?, ?, ?, 'PubMeta Idea', '[]', '[]', '[]', 0.9, 'selected', 'MOCK', ?)`,
  ).run(ideaId, workspaceId, topicId, nowIso())
  db.prepare(
    `INSERT INTO scripts
     (id, workspace_id, idea_id, hook, body, cta, caption, hashtags, visual_brief,
      qa_status, qa_notes, reality, created_at, platform, status)
     VALUES (?, ?, ?, 'Hook do vídeo', '{}', ?, ?, ?, '{}', 'passed', '[]', 'MOCK', ?, 'YOUTUBE_SHORT', 'approved')`,
  ).run(
    scriptId,
    workspaceId,
    ideaId,
    input.cta,
    input.caption ?? 'Legenda cativante para o Short',
    JSON.stringify(input.hashtags),
    nowIso(),
  )
  db.prepare(
    `INSERT INTO contents
     (id, workspace_id, idea_id, script_id, title, status, approval_required, reality, created_at)
     VALUES (?, ?, ?, ?, 'Hook do vídeo', 'queued_production', 0, 'MOCK', ?)`,
  ).run(contentId, workspaceId, ideaId, scriptId, nowIso())
  return contentId
}

describe('PublicationMetadataBuilder', () => {
  const tmp = path.join(os.tmpdir(), `cwm-pubmeta-${Date.now()}.sqlite`)
  let workspaceId = ''

  before(async () => {
    resetDbForTests(tmp)
    const boot = await bootstrapWorkspace({ name: 'PubMeta', email: 'pubmeta@cwm.test' })
    workspaceId = boot.workspaceId
  })

  it('sanitizes "link na bio" to "link na descrição" for YouTube Shorts', () => {
    const contentId = seedContentWithScript(workspaceId, {
      cta: 'Corre! Link na bio agora.',
      hashtags: ['#ia', '#produtividade'],
    })
    const metadata = buildPublicationMetadata(contentId, null, 'YOUTUBE_SHORT')
    assert.ok(!/link\s+na\s+bio/i.test(metadata.description))
    assert.ok(/link na descrição/i.test(metadata.description))
    assert.ok(metadata.description.includes('Legenda cativante para o Short'))
    assert.ok(metadata.description.includes('#ia'))
    assert.ok(metadata.description.includes('#produtividade'))
  })

  it('preserves capitalization when sanitizing ("Link na Bio" → "Link na descrição")', () => {
    const contentId = seedContentWithScript(workspaceId, { cta: 'Link na Bio!', hashtags: [] })
    const metadata = buildPublicationMetadata(contentId, null, 'YOUTUBE_SHORT')
    assert.ok(metadata.description.includes('Link na descrição'))
    assert.ok(!/link na bio/i.test(metadata.description))
  })

  it('leaves the CTA untouched for non-YouTube platforms (TikTok bio links are valid there)', () => {
    const contentId = seedContentWithScript(workspaceId, { cta: 'Corre! Link na bio agora.', hashtags: [] })
    const metadata = buildPublicationMetadata(contentId, null, 'TIKTOK')
    assert.ok(/link na bio/i.test(metadata.description))
  })

  it('defaults to YouTube sanitization when platform is omitted (never TikTok)', () => {
    const contentId = seedContentWithScript(workspaceId, { cta: 'Link na Bio!', hashtags: [] })
    const metadata = buildPublicationMetadata(contentId)
    assert.ok(/link na descrição/i.test(metadata.description))
  })

  it('description prefers caption + hashtags over the raw hook', () => {
    const contentId = seedContentWithScript(workspaceId, {
      cta: 'Link na descrição',
      hashtags: ['#nexus'],
      caption: 'Essa legenda é o que deve liderar a descrição',
    })
    const metadata = buildPublicationMetadata(contentId, null, 'YOUTUBE_SHORT')
    assert.ok(metadata.description.startsWith('Essa legenda é o que deve liderar a descrição'))
    assert.ok(metadata.description.includes('#nexus'))
  })
})
