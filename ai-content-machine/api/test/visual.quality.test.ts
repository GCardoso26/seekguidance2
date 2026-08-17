import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { resetDbForTests, getDb, uid, nowIso } from '../src/db/client.js'
import { bootstrapWorkspace } from '../src/services/pipelines/dailyContentEngine.js'
import { buildVisualPlan } from '../src/production/visual/VisualDirector.js'
import { buildScenePrompt } from '../src/production/visual/VisualPromptBuilder.js'
import { resolveVisualProfileId, loadVisualProfile, listVisualProfileIds } from '../src/production/visual/VisualProfileRegistry.js'
import { reviewGeneratedImage } from '../src/production/visual/VisualQaService.js'
import { buildProductionPlan, buildStoryboard } from '../src/production/ProductionPlanner.js'
import { mediaAssetRepository } from '../src/production/library/MediaAssetRepository.js'
import { reviewVisualPublishability } from '../src/production/PublishingQualityGate.js'

function makePng(width: number, height: number): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cwm-vqa-'))
  const out = path.join(dir, 'x.png')
  const res = spawnSync(
    'ffmpeg',
    ['-y', '-f', 'lavfi', '-i', `color=c=0x445566:s=${width}x${height}`, '-frames:v', '1', out],
    { encoding: 'utf8' },
  )
  assert.equal(res.status, 0, res.stderr)
  return out
}

describe('Visual Quality & Consistency', () => {
  const tmp = path.join(os.tmpdir(), `cwm-vq-${Date.now()}.sqlite`)
  let workspaceId = ''

  before(async () => {
    resetDbForTests(tmp)
    const boot = await bootstrapWorkspace({ name: 'VQ', email: 'vq@cwm.test' })
    workspaceId = boot.workspaceId
  })

  it('ships the curated visual profiles', () => {
    const ids = listVisualProfileIds()
    for (const id of ['documentary', 'finance', 'technology', 'news', 'luxury', 'history', 'mystery', 'gaming']) {
      assert.ok(ids.includes(id), id)
      const p = loadVisualProfile(id)
      assert.ok(p.negative.includes('dark web') || p.negative.includes('horror'))
      assert.ok(p.maxScenes >= 3 && p.maxScenes <= 7)
    }
  })

  it('resolves finance/technology from script text — LLM cannot invent aesthetics', () => {
    assert.equal(resolveVisualProfileId({ scriptText: 'ganhar dinheiro com investimentos' }), 'finance')
    assert.equal(resolveVisualProfileId({ scriptText: 'automação com n8n e IA' }), 'technology')
    assert.equal(resolveVisualProfileId({ scriptText: 'um tema genérico' }), 'documentary')
  })

  it('Visual Director emits structured SUBJECT/CAMERA prompts + character lock', () => {
    const plan = buildVisualPlan({
      scriptBody: {
        hook: 'Você perde 2 horas por dia',
        setup: 'A rotina come o calendário',
        problem: 'Ferramentas sem sistema',
        insight: 'Um fluxo simples muda tudo',
        value: 'Template pronto',
        cta: 'Link na descrição',
      },
      targetDurationSec: 30,
      preferredProfileId: 'finance',
    })
    assert.equal(plan.profileId, 'finance')
    assert.ok(plan.scenes.length >= 3 && plan.scenes.length <= 5)
    assert.equal(plan.character.age, '35 years old')
    for (const sc of plan.scenes) {
      assert.match(sc.prompt, /SUBJECT:/)
      assert.match(sc.prompt, /CAMERA:/)
      assert.match(sc.prompt, /STYLE:/)
      assert.match(sc.prompt, /CHARACTER LOCK:/)
      assert.ok(!/Dark content scene/i.test(sc.prompt))
      assert.match(sc.negativePrompt, /dark web|horror/i)
    }
  })

  it('storyboard no longer uses the legacy dark-content prompt', () => {
    const visualPlan = buildVisualPlan({
      scriptBody: { hook: 'h', setup: 's', problem: 'p', insight: 'i', cta: 'c' },
      preferredProfileId: 'documentary',
      targetDurationSec: 20,
    })
    const plan = buildProductionPlan({
      platform: 'YOUTUBE_SHORT',
      targetDurationOverride: 20,
      visualPlan,
    })
    const scenes = buildStoryboard({
      plan,
      scriptBody: { hook: 'h', setup: 's', problem: 'p', insight: 'i', cta: 'c' },
      visualPlan,
    })
    assert.ok(scenes.every((s) => /SUBJECT:/.test(s.visualPrompt)))
    assert.ok(scenes.every((s) => s.negativePrompt && s.negativePrompt.length > 10))
    assert.equal(plan.visual.profileId, 'documentary')
  })

  it('prompt builder keeps WHAT vs HOW separated', () => {
    const prompt = buildScenePrompt({
      subject: 'A 35-year-old man at a laptop',
      action: 'realizes the investment failed',
      environment: 'modern home office',
      camera: 'medium close-up',
      lighting: 'soft daylight',
      style: 'documentary',
      mood: 'concerned',
      quality: 'photorealistic',
      characterLock: 'same man every scene',
      palette: 'neutral',
    })
    assert.match(prompt, /SUBJECT:.*laptop/)
    assert.match(prompt, /LIGHTING:.*daylight/)
    assert.match(prompt, /QUALITY:.*photorealistic/)
  })

  it('Visual QA APPROVES solid Comfy frames and REJECTS mock', () => {
    const png = makePng(512, 768)
    const ok = reviewGeneratedImage({
      path: png,
      provider: 'comfyui',
      sourceType: 'GENERATED',
      width: 512,
      height: 768,
      prompt: 'SUBJECT: man\nCAMERA: medium\nSTYLE: documentary',
    })
    assert.equal(ok.passed, true)
    assert.equal(ok.status, 'APPROVED')
    assert.ok(ok.score >= 0.7)

    const mock = reviewGeneratedImage({
      path: png,
      provider: 'mock_visual',
      sourceType: 'MOCK',
      width: 512,
      height: 768,
      prompt: 'bars',
    })
    assert.equal(mock.passed, false)
    assert.equal(mock.status, 'REJECTED')
  })

  it('Asset Library searchBest ignores REJECTED and low-score assets', () => {
    const goodDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cwm-vqa-good-'))
    const badDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cwm-vqa-bad-'))
    const good = path.join(goodDir, 'g.png')
    const bad = path.join(badDir, 'b.png')
    assert.equal(
      spawnSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'color=c=0x112233:s=512x768', '-frames:v', '1', good], {
        encoding: 'utf8',
      }).status,
      0,
    )
    assert.equal(
      spawnSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'color=c=0x99aabb:s=512x768', '-frames:v', '1', bad], {
        encoding: 'utf8',
      }).status,
      0,
    )
    mediaAssetRepository.catalog({
      workspaceId,
      path: bad,
      type: 'image',
      source: 'generated',
      tags: ['laptop', 'office', 'finance'],
      qualityStatus: 'REJECTED',
      qualityScore: 0.2,
      qualityFindings: ['visual_qa_score_below_threshold'],
    })
    const approved = mediaAssetRepository.catalog({
      workspaceId,
      path: good,
      type: 'image',
      source: 'generated',
      tags: ['laptop', 'office', 'finance'],
      qualityStatus: 'APPROVED',
      qualityScore: 0.91,
      qualityFindings: [],
    })
    const hit = mediaAssetRepository.searchBest({
      workspaceId,
      type: 'image',
      tags: ['laptop', 'office'],
    })
    assert.ok(hit)
    assert.equal(hit!.asset.id, approved.id)
    assert.equal(hit!.asset.qualityStatus, 'APPROVED')
  })

  it('publish gate HOLDs when visualQa rejected a GENERATED frame', () => {
    const review = reviewVisualPublishability([
      {
        type: 'IMAGE',
        is_current: 1,
        source_type: 'GENERATED',
        provider: 'comfyui',
        license: 'GENERATED',
        asset_key: 'visual:scene:1',
        metadata: JSON.stringify({
          visualQa: { passed: false, status: 'REJECTED', score: 0.4, findings: ['visual_qa_score_below_threshold'] },
        }),
      },
    ])
    assert.equal(review.authorized, false)
    assert.equal(review.qaRejectedCount, 1)
    assert.ok(review.findings.some((f) => f.startsWith('visuals_qa_rejected')))
  })
})
