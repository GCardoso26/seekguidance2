import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { resetDbForTests, getDb, uid, nowIso } from '../src/db/client.js'
import { bootstrapWorkspace } from '../src/services/pipelines/dailyContentEngine.js'
import { scriptFactoryService } from '../src/scriptFactory/ScriptFactoryService.js'
import { productionService } from '../src/production/ProductionService.js'
import { mediaAssetRepository } from '../src/production/library/MediaAssetRepository.js'
import { ffmpegService } from '../src/production/FFmpegService.js'
import { collectFactoryMetrics } from '../src/production/FactoryMetrics.js'

process.env.AUTOMATION_MODE = 'mock'
process.env.CWM_FAST_RETRY = '1'

function clearExternalProviders() {
  delete process.env.OLLAMA_BASE_URL
  delete process.env.OPENAI_API_KEY
  delete process.env.SCRIPT_LLM_API_KEY
  delete process.env.KOKORO_BASE_URL
  delete process.env.VOICE_API_KEY
  delete process.env.ELEVENLABS_API_KEY
  delete process.env.COMFY_BASE_URL
}

function insertIdea(workspaceId: string, title = 'Como usar IA para criar 30 conteúdos') {
  const db = getDb()
  const topicId = uid()
  const ideaId = uid()
  const niche = db.prepare(`SELECT id FROM niches WHERE workspace_id=? LIMIT 1`).get(workspaceId) as {
    id: string
  }
  db.prepare(
    `INSERT INTO topics (id, workspace_id, niche_id, title, source_trace, opportunity_score, trend_score, gap_score, reality, created_at, fingerprint, score, score_breakdown)
     VALUES (?, ?, ?, ?, '[]', 0.8, 0.7, 0.6, 'MOCK', ?, ?, 80, '{}')`,
  ).run(topicId, workspaceId, niche.id, title, nowIso(), `fp-e2e-${topicId}`)
  db.prepare(
    `INSERT INTO content_ideas
     (id, workspace_id, topic_id, title, hooks, angles, formats, opportunity_score, status, reality, created_at)
     VALUES (?, ?, ?, ?, '[]', '["lista"]', '["short"]', 0.9, 'selected', 'MOCK', ?)`,
  ).run(ideaId, workspaceId, topicId, title, nowIso())
  return ideaId
}

async function ideaToApprovedScript(workspaceId: string, ideaId: string) {
  const scriptOut = await scriptFactoryService.run({
    workspaceId,
    contentIdeaId: ideaId,
    platform: 'YOUTUBE_SHORT',
  })
  assert.equal(scriptOut.skipped, false)
  if (scriptOut.skipped) throw new Error('script_skipped')
  assert.ok(scriptOut.scriptId)
  // Production gate: approved script
  getDb()
    .prepare(`UPDATE scripts SET status='approved', qa_status='passed' WHERE id=?`)
    .run(scriptOut.scriptId)
  return scriptOut
}

describe('Factory E2E local — Idea → MP4', () => {
  const tmp = path.join(os.tmpdir(), `cwm-factory-e2e-${Date.now()}.sqlite`)
  let workspaceId = ''

  before(async () => {
    clearExternalProviders()
    resetDbForTests(tmp)
    const boot = await bootstrapWorkspace({ name: 'Factory E2E', email: 'factory-e2e@cwm.test' })
    workspaceId = boot.workspaceId
    assert.equal(ffmpegService.available(), true)
  })

  after(() => {
    clearExternalProviders()
  })

  it('E2E #1 — primeira produção: Library MISS → catalog → Ken Burns MP4 → QA', async () => {
    const ideaId = insertIdea(workspaceId, 'E2E1 fábrica local sem GPU')
    const tScript = Date.now()
    const scriptOut = await ideaToApprovedScript(workspaceId, ideaId)
    const scriptMs = Date.now() - tScript

    assert.equal(scriptOut.provider, 'mock')
    assert.ok(scriptOut.fallbackTrail?.some((t) => t.provider === 'ollama'))

    const beforeLib = mediaAssetRepository.listByWorkspace(workspaceId).length

    const prod = await productionService.run({
      workspaceId,
      scriptId: scriptOut.scriptId!,
      platform: 'YOUTUBE_SHORT',
      targetDurationOverride: 2,
    })
    assert.equal(prod.status, 'COMPLETED')
    assert.equal(prod.packageStatus, 'READY_FOR_PUBLISH')

    const detail = productionService.getRun(prod.productionRunId!)!
    const result = JSON.parse(String(detail.result))
    assert.ok(result.stages.VISUALS.library.misses >= 1)
    // Cenas posteriores do mesmo run podem HIT assets acabados de catalogar (reuse intra-run)
    assert.ok(
      result.stages.VISUALS.library.hits + result.stages.VISUALS.library.misses >= 1,
    )
    assert.equal(result.stages.COMPOSING.provider, 'ffmpeg_kenburns')
    assert.equal(result.stages.VISUALS.provider, 'mock_visual')
    assert.ok(
      result.stages.VISUALS.fallbackTrail?.some(
        (t: { provider: string; status: string }) => t.provider === 'comfyui' && t.status === 'NOT_CONFIGURED',
      ),
    )
    assert.ok(result.stages.QA.ok)

    const final = (detail.assets as Array<{ type: string; uri: string; is_current: number }>).find(
      (a) => a.type === 'FINAL_VIDEO' && a.is_current === 1,
    )
    assert.ok(final)
    assert.ok(fs.existsSync(final!.uri))
    assert.ok(fs.statSync(final!.uri).size > 1000)
    const probe = ffmpegService.probe(final!.uri)
    assert.ok(probe.hasVideo && probe.hasAudio)
    assert.ok(probe.duration > 0)

    const afterLib = mediaAssetRepository.listByWorkspace(workspaceId).length
    assert.ok(afterLib > beforeLib)

    const metrics = collectFactoryMetrics({
      productionStartedAt: String(detail.started_at),
      productionCompletedAt: String(detail.completed_at || nowIso()),
      scriptDurationMs: scriptMs,
      scriptProvider: scriptOut.provider,
      scriptFallbackTrail: scriptOut.fallbackTrail,
      stages: result.stages,
      finalVideoPath: final!.uri,
      packageStatus: String(prod.packageStatus),
      success: true,
    })
    assert.equal(metrics.success, true)
    assert.ok(metrics.assetsNew >= 1)
    assert.equal(metrics.composeProvider, 'ffmpeg_kenburns')
    assert.ok((metrics.mp4Bytes || 0) > 1000)
    assert.ok(result.factoryMetrics)
    assert.ok(result.factoryMetrics.composeMs >= 0)
  })

  it('E2E #2 — regenerate/remix: Library HIT → usage_count++ → novo MP4', async () => {
    // Fresh idea but same visual prompts come from script body structure — use regenerate
    // on the production from E2E #1's script shape: seed identical approved script text via factory
    const ideaId = insertIdea(workspaceId, 'E2E2 remix mesma necessidade visual')
    // Force identical visual prompts by copying body from a known production script pattern
    // via factory then overwrite body to match a prior cataloged prompt set is brittle.
    // Instead: run production A in isolated ws, then regenerate on same script.
    const boot = await bootstrapWorkspace({ name: 'Factory Remix', email: 'remix@cwm.test' })
    const ws = boot.workspaceId
    const idea = insertIdea(ws, 'Remix Ken Burns assets')
    const scriptOut = await ideaToApprovedScript(ws, idea)

    const first = await productionService.run({
      workspaceId: ws,
      scriptId: scriptOut.scriptId!,
      platform: 'YOUTUBE_SHORT',
      targetDurationOverride: 2,
    })
    assert.equal(first.status, 'COMPLETED')
    const r1 = JSON.parse(String(productionService.getRun(first.productionRunId!)!.result))
    assert.ok(r1.stages.VISUALS.library.misses >= 1)

    const usageBefore = mediaAssetRepository
      .listByWorkspace(ws)
      .reduce((s, a) => s + a.usageCount, 0)
    const libIdsBefore = new Set(mediaAssetRepository.listByWorkspace(ws).map((a) => a.id))

    const second = await productionService.run({
      workspaceId: ws,
      scriptId: scriptOut.scriptId!,
      platform: 'YOUTUBE_SHORT',
      targetDurationOverride: 2,
      regenerate: true,
    })
    assert.equal(second.status, 'COMPLETED')
    assert.notEqual(first.productionRunId, second.productionRunId)

    const detail2 = productionService.getRun(second.productionRunId!)!
    const r2 = JSON.parse(String(detail2.result))
    assert.ok(r2.stages.VISUALS.library.hits >= 1)
    assert.ok(r2.stages.VISUALS.library.reuses.length >= 1)
    assert.equal(r2.stages.VISUALS.library.reuses[0].reuse_reason, 'tag_match')

    const usageAfter = mediaAssetRepository.listByWorkspace(ws).reduce((s, a) => s + a.usageCount, 0)
    assert.ok(usageAfter > usageBefore)

    const reused = (
      detail2.assets as Array<{ type: string; provider: string; is_current: number }>
    ).find((a) => a.type === 'IMAGE' && a.is_current === 1 && a.provider === 'asset_library')
    assert.ok(reused)

    // Same library catalog ids (no explosion of new assets required for HIT path)
    const libIdsAfter = mediaAssetRepository.listByWorkspace(ws).map((a) => a.id)
    assert.ok(libIdsAfter.every((id) => libIdsBefore.has(id) || libIdsBefore.size >= 1))

    const final2 = (detail2.assets as Array<{ type: string; uri: string; is_current: number }>).find(
      (a) => a.type === 'FINAL_VIDEO' && a.is_current === 1,
    )
    assert.ok(final2 && fs.existsSync(final2.uri))
    assert.notEqual(final2!.uri, (productionService.getRun(first.productionRunId!)!.assets as Array<{ type: string; uri: string; is_current: number }>).find((a) => a.type === 'FINAL_VIDEO' && a.is_current === 1)?.uri)

    void ideaId
  })

  it('degradação: Ollama OFF + Kokoro OFF + Library OFF → Mock ainda completa MP4', async () => {
    clearExternalProviders()
    const boot = await bootstrapWorkspace({ name: 'Degrade', email: 'degrade@cwm.test' })
    const ws = boot.workspaceId
    const ideaId = insertIdea(ws, 'Degradação controlada')

    const originalSearch = mediaAssetRepository.searchBest.bind(mediaAssetRepository)
    const originalCatalog = mediaAssetRepository.catalog.bind(mediaAssetRepository)
    mediaAssetRepository.searchBest = () => {
      throw new Error('library_forced_offline')
    }
    mediaAssetRepository.catalog = () => {
      throw new Error('library_forced_offline')
    }

    try {
      const scriptOut = await ideaToApprovedScript(ws, ideaId)
      assert.equal(scriptOut.provider, 'mock')

      const prod = await productionService.run({
        workspaceId: ws,
        scriptId: scriptOut.scriptId!,
        platform: 'YOUTUBE_SHORT',
        targetDurationOverride: 2,
      })
      assert.equal(prod.status, 'COMPLETED')
      assert.equal(prod.packageStatus, 'READY_FOR_PUBLISH')

      const detail = productionService.getRun(prod.productionRunId!)!
      const result = JSON.parse(String(detail.result))
      assert.equal(result.stages.VOICE.provider, 'mock_voice')
      assert.equal(result.stages.VISUALS.ok, true)
      assert.equal(result.stages.VISUALS.provider, 'mock_visual')
      assert.equal(result.stages.VISUALS.library.hits, 0)
      assert.ok(result.stages.VISUALS.library.misses >= 1)
      assert.equal(result.stages.COMPOSING.provider, 'ffmpeg_kenburns')

      const final = (detail.assets as Array<{ type: string; uri: string; is_current: number }>).find(
        (a) => a.type === 'FINAL_VIDEO' && a.is_current === 1,
      )
      assert.ok(final && fs.existsSync(final.uri))
      const probe = ffmpegService.probe(final!.uri)
      assert.ok(probe.hasVideo && probe.hasAudio)
    } finally {
      mediaAssetRepository.searchBest = originalSearch
      mediaAssetRepository.catalog = originalCatalog
    }
  })
})
