import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { resetDbForTests, getDb, uid, nowIso } from '../src/db/client.js'
import { bootstrapWorkspace } from '../src/services/pipelines/dailyContentEngine.js'
import { publishingService } from '../src/publishing/PublishingService.js'

process.env.AUTOMATION_MODE = 'mock'

const CHECKSUM = 'a'.repeat(64)

function writeDummy(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, Buffer.from('mp4-or-png-bytes'))
}

function insertRun(input: {
  workspaceId: string
  contentId: string
  scriptId: string
  productionId: string
  createdAt: string
  packageStatus: string
  visualProvider: 'mock_visual' | 'comfyui'
  assetDir: string
}) {
  const db = getDb()
  const result = JSON.stringify({
    stages: { VISUALS: { ok: true, provider: input.visualProvider } },
    factoryMetrics: { visualProvider: input.visualProvider },
  })
  db.prepare(
    `INSERT INTO production_runs
     (id, workspace_id, content_id, script_id, status, current_stage, plan, package_status,
      result, reality, created_at, updated_at, completed_at)
     VALUES (?, ?, ?, ?, 'COMPLETED', 'STORAGE', '{}', ?, ?, 'MOCK', ?, ?, ?)`,
  ).run(
    input.productionId,
    input.workspaceId,
    input.contentId,
    input.scriptId,
    input.packageStatus,
    result,
    input.createdAt,
    input.createdAt,
    input.createdAt,
  )
  db.prepare(
    `INSERT INTO content_packages
     (id, workspace_id, content_id, production_id, status, manifest, reality, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, '{}', 'MOCK', ?, ?)`,
  ).run(
    uid(),
    input.workspaceId,
    input.contentId,
    input.productionId,
    input.packageStatus,
    input.createdAt,
    input.createdAt,
  )

  const video = path.join(input.assetDir, 'final.mp4')
  const thumb = path.join(input.assetDir, 'thumb.jpg')
  const image = path.join(input.assetDir, 'scene.png')
  writeDummy(video)
  writeDummy(thumb)
  writeDummy(image)

  const isMock = input.visualProvider === 'mock_visual'
  const assets: Array<{
    type: string
    key: string
    uri: string
    provider: string
    source: string
    license: string
  }> = [
    {
      type: 'FINAL_VIDEO',
      key: 'final_video',
      uri: video,
      provider: 'ffmpeg_kenburns',
      source: 'GENERATED',
      license: 'GENERATED',
    },
    {
      type: 'THUMBNAIL',
      key: 'thumbnail',
      uri: thumb,
      provider: 'ffmpeg_frame',
      source: 'GENERATED',
      license: 'GENERATED',
    },
    {
      type: 'IMAGE',
      key: 'visual:scene:1',
      uri: image,
      provider: input.visualProvider,
      source: isMock ? 'MOCK' : 'GENERATED',
      license: isMock ? 'MOCK' : 'GENERATED',
    },
  ]
  for (const a of assets) {
    db.prepare(
      `INSERT INTO media_assets
       (id, workspace_id, content_id, production_id, type, source_type, provider, uri,
        mime_type, file_size, checksum, license, metadata, version, is_current, stage, asset_key, reality, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'application/octet-stream', 16, ?, ?, '{}', 1, 1, 'VISUALS', ?, 'MOCK', ?)`,
    ).run(
      uid(),
      input.workspaceId,
      input.contentId,
      input.productionId,
      a.type,
      a.source,
      a.provider,
      a.uri,
      CHECKSUM,
      a.license,
      a.key,
      input.createdAt,
    )
  }
}

describe('validateContentPackage prefers Comfy over a newer mock package', () => {
  const tmp = path.join(os.tmpdir(), `cwm-pkg-resolve-${Date.now()}.sqlite`)
  const assetRoot = path.join(os.tmpdir(), `cwm-pkg-resolve-assets-${Date.now()}`)
  let workspaceId = ''
  let contentId = ''
  let mockProd = ''
  let comfyProd = ''

  before(async () => {
    resetDbForTests(tmp)
    const boot = await bootstrapWorkspace({ name: 'Pkg Resolve', email: 'pkg@cwm.test' })
    workspaceId = boot.workspaceId
    const db = getDb()
    const niche = db.prepare(`SELECT id FROM niches WHERE workspace_id=? LIMIT 1`).get(workspaceId) as {
      id: string
    }
    const topicId = uid()
    const ideaId = uid()
    const scriptId = uid()
    contentId = uid()
    mockProd = uid()
    comfyProd = uid()
    const now = nowIso()
    db.prepare(
      `INSERT INTO topics (id, workspace_id, niche_id, title, source_trace, opportunity_score, trend_score, gap_score, reality, created_at, fingerprint, score, score_breakdown)
       VALUES (?, ?, ?, 'T', '[]', 0.8, 0.7, 0.6, 'MOCK', ?, ?, 80, '{}')`,
    ).run(topicId, workspaceId, niche.id, now, `fp-${topicId}`)
    db.prepare(
      `INSERT INTO content_ideas
       (id, workspace_id, topic_id, title, hooks, angles, formats, opportunity_score, status, reality, created_at)
       VALUES (?, ?, ?, 'I', '[]', '[]', '[]', 0.9, 'selected', 'MOCK', ?)`,
    ).run(ideaId, workspaceId, topicId, now)
    db.prepare(
      `INSERT INTO scripts
       (id, workspace_id, idea_id, hook, body, cta, caption, hashtags, visual_brief,
        qa_status, qa_notes, reality, created_at, platform, status, quality_score, quality_breakdown, selected_hooks)
       VALUES (?, ?, ?, 'h', '{}', 'c', 'cap', '[]', '{}', 'passed', '[]', 'MOCK', ?, 'YOUTUBE_SHORT', 'approved', 90, '{}', '[]')`,
    ).run(scriptId, workspaceId, ideaId, now)
    db.prepare(
      `INSERT INTO contents (id, workspace_id, idea_id, script_id, title, status, approval_required, reality, created_at, asset_meta)
       VALUES (?, ?, ?, ?, 'Title', 'qa', 0, 'MOCK', ?, ?)`,
    ).run(
      contentId,
      workspaceId,
      ideaId,
      scriptId,
      now,
      JSON.stringify({ productionId: mockProd, packageStatus: 'READY_FOR_PUBLISH' }),
    )

    insertRun({
      workspaceId,
      contentId,
      scriptId,
      productionId: mockProd,
      createdAt: '2026-08-14T18:00:00.000Z',
      packageStatus: 'READY_FOR_PUBLISH',
      visualProvider: 'mock_visual',
      assetDir: path.join(assetRoot, 'mock'),
    })
    insertRun({
      workspaceId,
      contentId,
      scriptId,
      productionId: comfyProd,
      createdAt: '2026-08-14T04:00:00.000Z',
      packageStatus: 'READY_FOR_PUBLISH',
      visualProvider: 'comfyui',
      assetDir: path.join(assetRoot, 'comfy'),
    })
  })

  it('picks the ComfyUI production even when the latest package is mock', () => {
    const picked = publishingService.resolvePublishableProductionId(contentId, mockProd)
    assert.equal(picked, comfyProd)

    const validation = publishingService.validateContentPackage(contentId, workspaceId)
    assert.equal(validation.productionRunId, comfyProd)
    assert.equal(validation.ok, true, validation.issues.join(','))
    assert.ok(String(validation.videoUri || '').includes(`${path.sep}comfy${path.sep}`))
  })

  it('still HOLDs when the only production is mock', () => {
    const db = getDb()
    const orphanContent = uid()
    const orphanProd = uid()
    const scriptId = (
      db.prepare(`SELECT script_id FROM contents WHERE id=?`).get(contentId) as { script_id: string }
    ).script_id
    db.prepare(
      `INSERT INTO contents (id, workspace_id, title, status, approval_required, reality, created_at, script_id)
       VALUES (?, ?, 'Mock only', 'qa', 0, 'MOCK', ?, ?)`,
    ).run(orphanContent, workspaceId, nowIso(), scriptId)
    insertRun({
      workspaceId,
      contentId: orphanContent,
      scriptId,
      productionId: orphanProd,
      createdAt: nowIso(),
      packageStatus: 'READY_FOR_PUBLISH',
      visualProvider: 'mock_visual',
      assetDir: path.join(assetRoot, 'orphan-mock'),
    })
    const validation = publishingService.validateContentPackage(orphanContent, workspaceId)
    assert.equal(validation.ok, false)
    assert.ok(validation.issues.some((i) => i.startsWith('visuals_mock_not_publishable')))
    assert.equal(validation.productionRunId, orphanProd)
  })
})
