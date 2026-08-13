import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { resetDbForTests, getDb, uid, nowIso } from '../src/db/client.js'
import { bootstrapWorkspace } from '../src/services/pipelines/dailyContentEngine.js'
import { buildProductionPlan, buildStoryboard } from '../src/production/ProductionPlanner.js'
import { getProductionProfile } from '../src/production/PlatformProductionProfiles.js'
import { assetRegistry } from '../src/production/AssetRegistry.js'
import { validateSubtitles, cuesFromStoryboard, toSrt, toVtt } from '../src/production/SubtitleService.js'
import { mediaQaService } from '../src/production/MediaQAService.js'
import { LocalFilesystemStorage, assetRelPath } from '../src/production/storage/LocalFilesystemStorage.js'
import { productionService } from '../src/production/ProductionService.js'
import { ffmpegService } from '../src/production/FFmpegService.js'

process.env.AUTOMATION_MODE = 'mock'
process.env.CWM_FAST_RETRY = '1'

/** 1×1 PNG — smallest valid image ffmpeg/kenburns can decode. */
const TINY_PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex',
)

function seedApprovedScript(workspaceId: string, platform = 'YOUTUBE_SHORT') {
  const db = getDb()
  const topicId = uid()
  const ideaId = uid()
  const scriptId = uid()
  const niche = db.prepare(`SELECT id FROM niches WHERE workspace_id=? LIMIT 1`).get(workspaceId) as {
    id: string
  }
  db.prepare(
    `INSERT INTO topics (id, workspace_id, niche_id, title, source_trace, opportunity_score, trend_score, gap_score, reality, created_at, fingerprint, score, score_breakdown)
     VALUES (?, ?, ?, 'Topic Prod', '[]', 0.8, 0.7, 0.6, 'MOCK', ?, 'fp-prod-${topicId}', 80, '{}')`,
  ).run(topicId, workspaceId, niche.id, nowIso())
  db.prepare(
    `INSERT INTO content_ideas
     (id, workspace_id, topic_id, title, hooks, angles, formats, opportunity_score, status, reality, created_at)
     VALUES (?, ?, ?, 'Idea Prod', '[]', '[]', '[]', 0.9, 'selected', 'MOCK', ?)`,
  ).run(ideaId, workspaceId, topicId, nowIso())
  const body = {
    hook: 'Pare de perder 2h por dia',
    setup: 'A maioria usa IA errado',
    problem: 'Ferramentas sem sistema',
    insight: 'Um fluxo simples muda tudo',
    value: 'Template pronto',
    proof: 'Resultado em 7 dias',
    cta: 'Link na bio',
  }
  db.prepare(
    `INSERT INTO scripts
     (id, workspace_id, idea_id, hook, body, cta, caption, hashtags, visual_brief,
      qa_status, qa_notes, reality, created_at, platform, status, quality_score, quality_breakdown, selected_hooks)
     VALUES (?, ?, ?, ?, ?, ?, 'cap', '[]', ?, 'passed', '[]', 'MOCK', ?, ?, 'approved', 90, '{}', '[]')`,
  ).run(
    scriptId,
    workspaceId,
    ideaId,
    body.hook,
    JSON.stringify(body),
    body.cta,
    JSON.stringify({ durationSec: 3, shots: [{}, {}, {}] }),
    nowIso(),
    platform,
  )
  return { scriptId, ideaId, body }
}

describe('Production unit + service', () => {
  const tmp = path.join(os.tmpdir(), `cwm-prod-${Date.now()}.sqlite`)
  let workspaceId = ''

  before(async () => {
    resetDbForTests(tmp)
    const boot = await bootstrapWorkspace({ name: 'Prod Unit', email: 'prod@cwm.test' })
    workspaceId = boot.workspaceId
    assert.equal(ffmpegService.available(), true)
  })

  it('PlatformProductionProfile centralizes short-form rules', () => {
    const yt = getProductionProfile('YOUTUBE_SHORT')
    assert.equal(yt.resolution, '1080x1920')
    assert.equal(yt.fps, 30)
    assert.equal(yt.aspectRatio, '9:16')
    assert.ok(yt.subtitle.formats.includes('srt'))
    const pin = getProductionProfile('PINTEREST')
    assert.equal(pin.thumbnail.width, 1000)
  })

  it('ProductionPlanner builds plan + storyboard', () => {
    const plan = buildProductionPlan({ platform: 'TIKTOK', targetDurationOverride: 12 })
    assert.equal(plan.platform, 'TIKTOK')
    assert.equal(plan.targetDuration, 12)
    const scenes = buildStoryboard({
      plan,
      scriptBody: {
        hook: 'h',
        setup: 's',
        problem: 'p',
        insight: 'i',
        value: 'v',
        proof: 'pr',
        cta: 'c',
      },
    })
    assert.ok(scenes.length >= 3)
    assert.ok(scenes[0].endTime > scenes[0].startTime)
    // textOverlay is a truncated narration slice (burn-in caption fallback), not a section label
    assert.equal(scenes[0].textOverlay, scenes[0].narrationSegment.slice(0, 60))
    assert.equal(scenes[0].narrationSegment, 'h')
  })

  it('AssetRegistry versions without overwrite', () => {
    const productionId = uid()
    getDb()
      .prepare(
        `INSERT INTO production_runs
         (id, workspace_id, content_id, script_id, status, plan, reality, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'QUEUED', '{}', 'MOCK', ?, ?)`,
      )
      .run(productionId, workspaceId, uid(), uid(), nowIso(), nowIso())
    const dir = path.join(os.tmpdir(), `asset-${Date.now()}`)
    fs.mkdirSync(dir, { recursive: true })
    const f1 = path.join(dir, 'a1.bin')
    const f2 = path.join(dir, 'a2.bin')
    fs.writeFileSync(f1, 'v1')
    fs.writeFileSync(f2, 'v2-data')
    const r1 = assetRegistry.register({
      workspaceId,
      productionId,
      type: 'AUDIO',
      sourceType: 'MOCK',
      provider: 't',
      uri: f1,
      assetKey: 'voice',
      stage: 'VOICE',
    })
    const r2 = assetRegistry.register({
      workspaceId,
      productionId,
      type: 'AUDIO',
      sourceType: 'MOCK',
      provider: 't',
      uri: f2,
      assetKey: 'voice',
      stage: 'VOICE',
      parentAssetId: r1.id,
    })
    assert.equal(r1.version, 1)
    assert.equal(r2.version, 2)
    const cur = assetRegistry.getCurrent(productionId, 'voice') as { id: string; version: number }
    assert.equal(cur.version, 2)
    const all = assetRegistry.listByProduction(productionId) as Array<{ is_current: number }>
    assert.equal(all.filter((a) => a.is_current).length, 1)
  })

  it('SubtitleQA rejects overlaps and invalid ranges', () => {
    const bad = validateSubtitles(
      [
        { index: 1, start: 2, end: 1, text: 'x' },
        { index: 2, start: 0.5, end: 3, text: 'y' },
      ],
      10,
    )
    assert.equal(bad.status, 'FAIL')
    assert.ok(bad.issues.some((i) => i.includes('start_gte_end') || i.includes('overlap')))

    const plan = buildProductionPlan({ platform: 'TIKTOK', targetDurationOverride: 6 })
    const scenes = buildStoryboard({
      plan,
      scriptBody: { hook: 'a', setup: 'b', problem: 'c', insight: 'd', cta: 'e' },
    })
    const cues = cuesFromStoryboard(scenes)
    const ok = validateSubtitles(cues, plan.targetDuration)
    assert.equal(ok.status, 'PASS')
    assert.ok(toSrt(cues).includes('-->'))
    assert.ok(toVtt(cues).startsWith('WEBVTT'))
  })

  it('cuesFromStoryboard captions narration, not textOverlay labels like "Hook"/"SETUP"', () => {
    const plan = buildProductionPlan({ platform: 'YOUTUBE_SHORT', targetDurationOverride: 8 })
    const scenes = buildStoryboard({
      plan,
      scriptBody: {
        hook: 'Pare de perder duas horas por dia com ferramentas de IA sem sistema nenhum',
        setup: 'A maioria configura tudo errado e perde tempo com prompts genéricos',
        problem: 'Sem um fluxo claro, cada tarefa nova vira um recomeço do zero',
        insight: 'Um fluxo simples de prompts muda completamente o resultado final',
        cta: 'Link na descrição',
      },
    })
    const cues = cuesFromStoryboard(scenes)
    assert.ok(cues.length >= 3)
    for (const cue of cues) {
      // Must never be the bare editorial label ("Hook", "SETUP", "PROBLEM", ...)
      assert.notEqual(cue.text.trim().toUpperCase(), 'HOOK')
      assert.ok(!/^(SETUP|PROBLEM|INSIGHT|VALUE|PROOF|CTA)$/i.test(cue.text.trim()))
      // Cue text budget: <=100 chars pre-wrap, wrapped to at most 2 lines
      assert.ok(cue.text.length <= 101)
      assert.ok(cue.text.split('\n').length <= 2)
    }
    // First cue must actually contain narration words from the hook
    assert.ok(cues[0].text.toLowerCase().includes('perder'))
    assert.ok(validateSubtitles(cues, plan.targetDuration).status === 'PASS')
  })

  it('cuesFromStoryboard truncates long narration with an ellipsis and word-wraps to 2 lines', () => {
    const longNarration =
      'Esse é um segredo que ninguém te conta sobre produtividade com inteligência artificial ' +
      'e vai completamente transformar a forma como você trabalha todos os dias'
    const cues = cuesFromStoryboard([
      {
        scene: 1,
        startTime: 0,
        endTime: 5,
        duration: 5,
        narrationSegment: longNarration,
        visualPrompt: 'x',
        assetType: 'IMAGE',
        textOverlay: 'Hook',
        transition: 'cut',
      },
    ])
    assert.equal(cues.length, 1)
    const lines = cues[0].text.split('\n')
    assert.ok(lines.length <= 2)
    assert.ok(cues[0].text.length <= 101)
    assert.ok(cues[0].text.includes('…') || cues[0].text.length < longNarration.length)
  })

  it('Storage blocks path injection and writes checksummed files', async () => {
    const root = path.join(os.tmpdir(), `cwm-storage-${Date.now()}`)
    const storage = new LocalFilesystemStorage(root)
    await assert.rejects(() => storage.put('../etc/passwd', 'x'), /path_injection|path_escape/)
    await assert.rejects(() => storage.put('/tmp/abs', 'x'), /path_injection|path_escape/)
    const rel = assetRelPath({
      workspaceId: 'ws',
      contentId: 'c',
      productionId: 'p',
      folder: 'voice',
      filename: 'a.wav',
    })
    const put = await storage.put(rel, Buffer.from('hello-audio'))
    assert.equal(put.fileSize, 11)
    assert.equal(put.checksum.length, 64)
    assert.equal(await storage.exists(rel), true)
  })

  it('MediaQA fails on missing video', () => {
    const plan = buildProductionPlan({ platform: 'YOUTUBE_SHORT', targetDurationOverride: 3 })
    const qa = mediaQaService.validateFinalVideo({
      videoPath: '/tmp/does-not-exist-cwm.mp4',
      plan,
      hasSubtitles: false,
      licensesKnown: false,
      assetsComplete: false,
    })
    assert.equal(qa.status, 'FAIL')
    assert.ok(qa.qualityScore >= 0)
  })

  it('E2E service: approved script → READY_FOR_PUBLISH with verifiable artifacts', async () => {
    const { scriptId } = seedApprovedScript(workspaceId, 'YOUTUBE_SHORT')
    const out = await productionService.run({
      workspaceId,
      scriptId,
      platform: 'YOUTUBE_SHORT',
      targetDurationOverride: 2,
    })
    assert.equal(out.skipped, false)
    assert.ok(out.productionRunId)
    assert.equal(out.status, 'COMPLETED')
    assert.equal(out.packageStatus, 'READY_FOR_PUBLISH')

    const detail = productionService.getRun(out.productionRunId!)!
    const assets = detail.assets as Array<{
      uri: string
      checksum: string
      source_type: string
      provider: string
      version: number
      type: string
      file_size: number
    }>
    assert.ok(assets.length >= 5)
    for (const a of assets.filter((x) => (x as { is_current?: number }).is_current)) {
      assert.ok(fs.existsSync(a.uri), `missing ${a.type}`)
      assert.ok(a.file_size > 0)
      assert.equal(a.checksum.length, 64)
      assert.equal(a.source_type, 'MOCK')
      assert.ok(a.provider)
      assert.ok(a.version >= 1)
    }
    const final = assets.find((a) => a.type === 'FINAL_VIDEO')!
    const probe = ffmpegService.probe(final.uri)
    assert.ok(probe.duration > 0)
    assert.ok(probe.hasAudio && probe.hasVideo)

    const events = getDb()
      .prepare(`SELECT event_type FROM domain_events WHERE workspace_id=? AND event_type LIKE 'production.%' OR event_type LIKE 'voice.%' OR event_type LIKE 'visuals.%' OR event_type LIKE 'video.%' OR event_type LIKE 'thumbnail.%' OR event_type LIKE 'subtitles.%'`)
      .all(workspaceId) as Array<{ event_type: string }>
    // looser query
    const ev = getDb()
      .prepare(`SELECT event_type FROM domain_events WHERE workspace_id=?`)
      .all(workspaceId) as Array<{ event_type: string }>
    const types = new Set(ev.map((e) => e.event_type))
    assert.ok(types.has('production.started'))
    assert.ok(types.has('production.completed'))
    assert.ok(types.has('voice.generated'))
    void events

    const costs = getDb()
      .prepare(`SELECT operation, estimated_cost_cents FROM ai_cost_events WHERE production_run_id=?`)
      .all(out.productionRunId) as Array<{ operation: string; estimated_cost_cents: number }>
    assert.ok(costs.some((c) => c.operation === 'VOICE_GENERATION'))
    assert.ok(costs.every((c) => c.estimated_cost_cents === 0))
  })

  it('idempotency: same production key yields one run', async () => {
    const { scriptId } = seedApprovedScript(workspaceId, 'TIKTOK')
    const a = await productionService.run({
      workspaceId,
      scriptId,
      platform: 'TIKTOK',
      targetDurationOverride: 2,
    })
    const b = await productionService.run({
      workspaceId,
      scriptId,
      platform: 'TIKTOK',
      targetDurationOverride: 2,
    })
    assert.equal(b.skipped, true)
    assert.equal(a.productionRunId, b.productionRunId)
    const count = getDb()
      .prepare(`SELECT COUNT(*) as c FROM production_runs WHERE script_id=? AND idempotency_key LIKE ?`)
      .get(scriptId, `production:${scriptId}:TIKTOK%`) as { c: number }
    assert.equal(count.c, 1)
  })

  it('failure VOICE → retry → DLQ after max attempts', async () => {
    const { scriptId } = seedApprovedScript(workspaceId, 'INSTAGRAM_REEL')
    const out = await productionService.run({
      workspaceId,
      scriptId,
      platform: 'INSTAGRAM_REEL',
      targetDurationOverride: 2,
      forceFailStage: 'VOICE',
      forceFailTimes: 99,
    })
    assert.ok(out.status === 'FAILED' || out.status === 'PARTIAL')
    const dlq = getDb()
      .prepare(
        `SELECT * FROM automation_failures WHERE workflow='content_production' AND entity_id=?`,
      )
      .all(out.productionRunId) as Array<{ attempts: number; payload: string }>
    assert.ok(dlq.length >= 1)
    assert.ok(dlq[0].attempts >= 3)
    assert.ok(String(dlq[0].payload).includes('VOICE'))
  })

  it('SUBTITLES fail → retry only subtitles (voice/visuals preserved)', async () => {
    const { scriptId } = seedApprovedScript(workspaceId, 'YOUTUBE_SHORT')
    const failed = await productionService.run({
      workspaceId,
      scriptId,
      platform: 'YOUTUBE_SHORT',
      targetDurationOverride: 2,
      forceFailStage: 'SUBTITLES',
      forceFailTimes: 99,
    })
    assert.equal(failed.status, 'PARTIAL')
    const before = productionService.getRun(failed.productionRunId!)!
    const resultBefore = JSON.parse(String(before.result))
    assert.equal(resultBefore.stages.VOICE.ok, true)
    assert.equal(resultBefore.stages.VISUALS.ok, true)
    assert.equal(resultBefore.stages.SUBTITLES.ok, false)
    const voiceUri = (before.assets as Array<{ asset_key: string; uri: string }>).find(
      (a) => a.asset_key === 'voice',
    )!.uri

    const retried = await productionService.retryStage(failed.productionRunId!, 'SUBTITLES')
    assert.ok(['COMPLETED', 'REQUIRES_REVIEW'].includes(String(retried.status)))
    const after = productionService.getRun(failed.productionRunId!)!
    const resultAfter = JSON.parse(String(after.result))
    assert.equal(resultAfter.stages.VOICE.ok, true)
    assert.equal(resultAfter.stages.VISUALS.ok, true)
    assert.equal(resultAfter.stages.SUBTITLES.ok, true)
    const voiceAfter = (after.assets as Array<{ asset_key: string; uri: string; version: number }>).find(
      (a) => a.asset_key === 'voice' && (a as { is_current?: number }).is_current !== 0,
    )
    // same voice file path (not regenerated)
    assert.equal(voiceAfter?.uri, voiceUri)
  })

  it('regenerate thumbnail creates new version', async () => {
    const { scriptId } = seedApprovedScript(workspaceId, 'YOUTUBE_SHORT')
    const out = await productionService.run({
      workspaceId,
      scriptId,
      platform: 'YOUTUBE_SHORT',
      targetDurationOverride: 2,
    })
    const regen = await productionService.regenerate(out.productionRunId!, 'thumbnail')
    assert.ok(regen.productionRunId)
    const thumbs = (
      productionService.getRun(out.productionRunId!)!.assets as Array<{
        asset_key: string
        version: number
        is_current: number
      }>
    ).filter((a) => a.asset_key === 'thumbnail')
    assert.ok(thumbs.some((t) => t.version >= 2 && t.is_current === 1))
  })

  it('THUMBNAIL stage extracts a real frame from the composed final video (not a blank mock card)', async () => {
    const { scriptId } = seedApprovedScript(workspaceId, 'YOUTUBE_SHORT')
    const out = await productionService.run({
      workspaceId,
      scriptId,
      platform: 'YOUTUBE_SHORT',
      targetDurationOverride: 2,
    })
    assert.equal(out.status, 'COMPLETED')
    const detail = productionService.getRun(out.productionRunId!)!
    const thumb = (
      detail.assets as Array<{
        type: string
        is_current: number
        provider: string
        width: number
        height: number
        uri: string
        metadata: string
      }>
    ).find((a) => a.type === 'THUMBNAIL' && a.is_current === 1)!
    assert.ok(thumb)
    assert.equal(thumb.provider, 'ffmpeg_frame')
    assert.equal(JSON.parse(thumb.metadata).source, 'final_video_frame')
    const probe = ffmpegService.probe(thumb.uri)
    assert.equal(probe.width, thumb.width)
    assert.equal(probe.height, thumb.height)

    const result = JSON.parse(String(detail.result))
    assert.equal(result.stages.THUMBNAIL.provider, 'ffmpeg_frame')
  })

  it('resolveThumbnailAsset falls back to mock_thumbnail when there is no final video', async () => {
    const runId = uid()
    getDb()
      .prepare(
        `INSERT INTO production_runs
         (id, workspace_id, content_id, script_id, status, plan, reality, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'QUEUED', '{}', 'MOCK', ?, ?)`,
      )
      .run(runId, workspaceId, uid(), uid(), nowIso(), nowIso())
    const plan = buildProductionPlan({ platform: 'YOUTUBE_SHORT', targetDurationOverride: 2 })
    const abs = path.join(os.tmpdir(), `cwm-thumb-fallback-${Date.now()}.png`)

    const service = productionService as unknown as {
      resolveThumbnailAsset: (input: {
        runId: string
        plan: typeof plan
        ctx: { script: { hook: string } }
        body: Record<string, string>
        abs: string
      }) => Promise<{ provider: string; fromVideoFrame: boolean; path: string }>
    }
    const result = await service.resolveThumbnailAsset({
      runId,
      plan,
      ctx: { script: { hook: 'Hook de fallback sem vídeo final' } },
      body: { hook: 'Hook de fallback sem vídeo final' },
      abs,
    })
    assert.equal(result.fromVideoFrame, false)
    assert.equal(result.provider, 'mock_thumbnail')
    assert.ok(fs.existsSync(result.path))
    assert.ok(fs.statSync(result.path).size > 0)
  })

  it('Asset Library: MISS catalogs then regenerate HIT reuses + usage_count++', async () => {
    const { mediaAssetRepository } = await import('../src/production/library/MediaAssetRepository.js')
    const boot = await bootstrapWorkspace({ name: 'Asset Lib', email: 'lib@cwm.test' })
    const ws = boot.workspaceId
    const { scriptId } = seedApprovedScript(ws, 'YOUTUBE_SHORT')

    const first = await productionService.run({
      workspaceId: ws,
      scriptId,
      platform: 'YOUTUBE_SHORT',
      targetDurationOverride: 2,
    })
    assert.equal(first.status, 'COMPLETED')
    const resultA = JSON.parse(String(productionService.getRun(first.productionRunId!)!.result))
    assert.ok(resultA.stages.VISUALS.library.misses >= 1)
    assert.equal(resultA.stages.VISUALS.library.hits, 0)

    const libRows = mediaAssetRepository.listByWorkspace(ws)
    assert.ok(libRows.length >= 1)
    const usageBefore = libRows.reduce((s, a) => s + a.usageCount, 0)

    const second = await productionService.run({
      workspaceId: ws,
      scriptId,
      platform: 'YOUTUBE_SHORT',
      targetDurationOverride: 2,
      regenerate: true,
    })
    assert.equal(second.status, 'COMPLETED')
    assert.notEqual(first.productionRunId, second.productionRunId)

    const resultB = JSON.parse(String(productionService.getRun(second.productionRunId!)!.result))
    assert.ok(resultB.stages.VISUALS.library.hits >= 1)
    assert.ok(resultB.stages.VISUALS.library.reuses.length >= 1)
    assert.equal(resultB.stages.VISUALS.library.reuses[0].reuse_reason, 'tag_match')
    assert.ok(Array.isArray(resultB.stages.VISUALS.library.reuses[0].matched_tags))
    assert.ok(resultB.stages.VISUALS.library.reuses[0].match_score > 0)

    const usageAfter = mediaAssetRepository
      .listByWorkspace(ws)
      .reduce((s, a) => s + a.usageCount, 0)
    assert.ok(usageAfter > usageBefore)

    const reused = (
      productionService.getRun(second.productionRunId!)!.assets as Array<{
        type: string
        provider: string
        is_current: number
        metadata: string
      }>
    ).find((a) => a.type === 'IMAGE' && a.is_current === 1 && a.provider === 'asset_library')
    assert.ok(reused)
    const meta = JSON.parse(reused!.metadata)
    assert.equal(meta.library.reuse_reason, 'tag_match')
    assert.ok(meta.library.asset_id)
  })

  it('Asset Library HIT never demotes license to UNKNOWN for generated/stock sources', async () => {
    const { mediaAssetRepository } = await import('../src/production/library/MediaAssetRepository.js')
    const boot = await bootstrapWorkspace({ name: 'Lib License', email: 'liblicense@cwm.test' })
    const ws = boot.workspaceId
    const { scriptId } = seedApprovedScript(ws, 'YOUTUBE_SHORT')

    const dir = path.join(os.tmpdir(), `cwm-lib-license-${Date.now()}`)
    fs.mkdirSync(dir, { recursive: true })
    const fakeAssetPath = path.join(dir, 'stub.png')
    fs.writeFileSync(fakeAssetPath, TINY_PNG)

    const fixedAsset = {
      id: uid(),
      workspaceId: ws,
      contentId: null,
      productionId: null,
      path: fakeAssetPath,
      sha256: 'a'.repeat(64),
      type: 'image' as const,
      source: 'generated' as const,
      tags: ['fake'],
      usageCount: 1,
      metadata: {},
      createdAt: nowIso(),
      lastUsedAt: null,
    }

    const originalSearchBest = mediaAssetRepository.searchBest.bind(mediaAssetRepository)
    const originalRecordReuse = mediaAssetRepository.recordReuse.bind(mediaAssetRepository)
    mediaAssetRepository.searchBest = () => ({
      asset: fixedAsset,
      matchedTags: ['fake'],
      matchScore: 1,
      reuseReason: 'tag_match',
    })
    mediaAssetRepository.recordReuse = () => ({ ...fixedAsset, usageCount: fixedAsset.usageCount + 1 })

    try {
      const out = await productionService.run({
        workspaceId: ws,
        scriptId,
        platform: 'YOUTUBE_SHORT',
        targetDurationOverride: 2,
      })
      assert.equal(out.status, 'COMPLETED')
      assert.equal(out.packageStatus, 'READY_FOR_PUBLISH')

      const detail = productionService.getRun(out.productionRunId!)!
      const images = (
        detail.assets as Array<{
          type: string
          is_current: number
          license: string
          source_type: string
          provider: string
        }>
      ).filter((a) => a.type === 'IMAGE' && a.is_current === 1)
      assert.ok(images.length > 0)
      for (const img of images) {
        assert.equal(img.provider, 'asset_library')
        assert.notEqual(img.license, 'UNKNOWN')
        assert.equal(img.license, 'GENERATED')
        assert.equal(img.source_type, 'GENERATED')
      }
    } finally {
      mediaAssetRepository.searchBest = originalSearchBest
      mediaAssetRepository.recordReuse = originalRecordReuse
    }
  })

  it('Asset Library search failure falls back to visual provider', async () => {
    const { mediaAssetRepository } = await import('../src/production/library/MediaAssetRepository.js')
    const boot = await bootstrapWorkspace({ name: 'Lib Fail', email: 'libfail@cwm.test' })
    const ws = boot.workspaceId
    const { scriptId } = seedApprovedScript(ws, 'YOUTUBE_SHORT')

    const original = mediaAssetRepository.searchBest.bind(mediaAssetRepository)
    mediaAssetRepository.searchBest = () => {
      throw new Error('library_forced_fail')
    }
    try {
      const out = await productionService.run({
        workspaceId: ws,
        scriptId,
        platform: 'YOUTUBE_SHORT',
        targetDurationOverride: 2,
      })
      assert.equal(out.status, 'COMPLETED')
      const result = JSON.parse(String(productionService.getRun(out.productionRunId!)!.result))
      assert.equal(result.stages.VISUALS.ok, true)
      assert.equal(result.stages.VISUALS.library.hits, 0)
      assert.ok(result.stages.VISUALS.library.misses >= 1)
    } finally {
      mediaAssetRepository.searchBest = original
    }
  })
})
