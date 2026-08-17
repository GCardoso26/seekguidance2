import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { ComfyUIProvider, validateImageBuffer } from '../src/production/visual/ComfyUIProvider.js'
import { FallbackVisualProvider } from '../src/production/visual/FallbackVisualProvider.js'
import { MockVisualProvider } from '../src/production/visual/MockVisualProvider.js'
import { workflowRegistry } from '../src/production/visual/WorkflowRegistry.js'
import { createVisualResolver } from '../src/production/visual/createVisualResolver.js'
import { ffmpegService } from '../src/production/FFmpegService.js'
import { startFakeComfyServer } from './helpers/fakeComfyServer.js'
import type { VisualAsset, VisualGenerateInput, VisualProvider } from '../src/production/visual/VisualProvider.js'

process.env.AUTOMATION_MODE = 'mock'

/** 1×1 PNG */
const TINY_PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex',
)

class FakeVisual implements VisualProvider {
  constructor(
    public name: string,
    private ready: boolean,
    private impl: (input: VisualGenerateInput) => Promise<VisualAsset>,
  ) {}
  status() {
    return this.ready ? ('READY' as const) : ('NOT_CONFIGURED' as const)
  }
  generate(input: VisualGenerateInput) {
    return this.impl(input)
  }
}

describe('Visual fallback (ComfyUI → Mock) + WorkflowRegistry', () => {
  const tmpDir = path.join(os.tmpdir(), `cwm-visual-${Date.now()}`)
  let validPng: Buffer

  before(() => {
    fs.mkdirSync(tmpDir, { recursive: true })
    assert.equal(ffmpegService.available(), true)
    delete process.env.COMFY_BASE_URL
    const out = path.join(tmpDir, 'valid-64.png')
    const res = spawnSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'color=c=0x0B6E6E:s=64x64', '-frames:v', '1', out], {
      encoding: 'utf8',
    })
    assert.equal(res.status, 0, String(res.stderr || ''))
    validPng = fs.readFileSync(out)
  })

  after(() => {
    delete process.env.COMFY_BASE_URL
    delete process.env.COMFY_WORKFLOW
    delete process.env.COMFY_TIMEOUT_MS
    delete process.env.COMFY_POLL_MS
  })

  it('WorkflowRegistry lists image graphs and materializes placeholders', () => {
    const names = workflowRegistry.list()
    assert.ok(names.includes('image_default'))
    assert.ok(names.includes('image_cinematic'))
    assert.ok(names.includes('image_a1_cpu'))
    const graph = workflowRegistry.materialize('image_default', {
      prompt: 'ganhar tempo',
      negative_prompt: 'blurry',
      width: 720,
      height: 1280,
      seed: 42,
      filename_prefix: 'cwm_scene_1',
      checkpoint: 'demo.safetensors',
      steps: 8,
      cfg: 4,
    })
    const encode = graph['6'] as { inputs: { text: string } }
    const latent = graph['5'] as { inputs: { width: number; height: number } }
    const ckpt = graph['4'] as { inputs: { ckpt_name: string } }
    const sampler = graph['3'] as { inputs: { steps: number; cfg: number } }
    assert.equal(encode.inputs.text, 'ganhar tempo')
    assert.equal(latent.inputs.width, 720)
    assert.equal(latent.inputs.height, 1280)
    assert.equal(ckpt.inputs.ckpt_name, 'demo.safetensors')
    assert.equal(sampler.inputs.steps, 8)
    assert.equal(sampler.inputs.cfg, 4)
    assert.equal(workflowRegistry.findSaveImageNodeId(graph), '9')
  })

  it('rejects path traversal workflow names', () => {
    assert.throws(() => workflowRegistry.load('../secret'), /comfy_workflow_invalid_name/)
  })

  it('ComfyUI is NOT_CONFIGURED without COMFY_BASE_URL', () => {
    delete process.env.COMFY_BASE_URL
    const c = new ComfyUIProvider()
    assert.equal(c.status(), 'NOT_CONFIGURED')
  })

  it('validateImageBuffer accepts a real PNG and rejects garbage / 1×1', () => {
    validateImageBuffer(validPng)
    assert.throws(() => validateImageBuffer(Buffer.alloc(64, 0x41)), /comfy_image_invalid_magic/)
    assert.throws(() => validateImageBuffer(Buffer.from('x')), /comfy_image_too_small/)
    assert.throws(() => validateImageBuffer(TINY_PNG), /comfy_image_too_small_edge/)
  })

  it('Fallback uses Mock when ComfyUI is unavailable', async () => {
    delete process.env.COMFY_BASE_URL
    const resolver = createVisualResolver()
    const outPath = path.join(tmpDir, 'fallback-mock.png')
    const asset = await resolver.generate({
      prompt: 'cena de hook',
      outPath,
      width: 320,
      height: 560,
      scene: 1,
    })
    assert.equal(asset.provider, 'mock_visual')
    assert.equal(asset.sourceType, 'MOCK')
    assert.ok(fs.existsSync(outPath))
    assert.ok(asset.fallbackTrail?.some((t) => t.provider === 'comfyui' && t.status === 'NOT_CONFIGURED'))
    assert.ok(asset.fallbackTrail?.some((t) => t.provider === 'mock_visual' && t.status === 'READY'))
    assert.ok(asset.fallbackTrail?.some((t) => t.provider === 'pexels'))
  })

  it('Fallback prefers ComfyUI when it succeeds', async () => {
    const outPath = path.join(tmpDir, 'fallback-comfy.png')
    const comfy = new FakeVisual('comfyui', true, async (input) => {
      fs.writeFileSync(input.outPath, TINY_PNG)
      return {
        path: input.outPath,
        width: input.width,
        height: input.height,
        sourceType: 'GENERATED',
        provider: 'comfyui',
        mimeType: 'image/png',
        license: 'GENERATED',
        prompt: input.prompt,
        costCents: 0,
        metadata: { workflow: 'image_default', sha256: 'abc' },
      }
    })
    const resolver = new FallbackVisualProvider(comfy, new MockVisualProvider())
    const asset = await resolver.generate({
      prompt: 'cinematic street',
      outPath,
      width: 320,
      height: 560,
      scene: 1,
    })
    assert.equal(asset.provider, 'comfyui')
    assert.equal(asset.sourceType, 'GENERATED')
    assert.ok(asset.fallbackTrail.some((t) => t.provider === 'comfyui' && t.status === 'READY'))
    assert.ok(!asset.fallbackTrail.some((t) => t.provider === 'mock_visual'))
  })

  it('Fallback skips failed ComfyUI (timeout) and uses Mock', async () => {
    const outPath = path.join(tmpDir, 'fallback-timeout.png')
    const comfy = new FakeVisual('comfyui', true, async () => {
      throw Object.assign(new Error('comfy_timeout:50'), { code: 'TIMEOUT' })
    })
    const resolver = new FallbackVisualProvider(comfy, new MockVisualProvider())
    const asset = await resolver.generate({
      prompt: 'timeout scene',
      outPath,
      width: 320,
      height: 560,
      scene: 2,
    })
    assert.equal(asset.provider, 'mock_visual')
    assert.ok(asset.fallbackTrail.some((t) => t.provider === 'comfyui' && t.status === 'TIMEOUT'))
    assert.ok(asset.fallbackTrail.some((t) => t.provider === 'mock_visual' && t.status === 'READY'))
    assert.ok(fs.existsSync(outPath))
  })

  it('ComfyUIProvider posts prompt, polls history and writes PNG', async () => {
    process.env.COMFY_BASE_URL = 'http://127.0.0.1:18188'
    process.env.COMFY_WORKFLOW = 'image_default'
    const originalFetch = globalThis.fetch
    const calls: string[] = []
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      const u = String(url)
      calls.push(`${init?.method || 'GET'} ${u}`)
      if (u.endsWith('/system_stats')) {
        return new Response(JSON.stringify({ system: { os: 'linux' } }), { status: 200 })
      }
      if (u.endsWith('/prompt') && init?.method === 'POST') {
        const body = JSON.parse(String(init.body || '{}')) as { prompt?: Record<string, unknown> }
        assert.equal((body.prompt?.['6'] as { inputs: { text: string } }).inputs.text, 'Olá cena')
        assert.equal((body.prompt?.['3'] as { inputs: { steps: number } }).inputs.steps, 8)
        return new Response(JSON.stringify({ prompt_id: 'p1' }), { status: 200 })
      }
      if (u.includes('/history/p1')) {
        return new Response(
          JSON.stringify({
            p1: {
              status: { completed: true, status_str: 'success' },
              outputs: { '9': { images: [{ filename: 'out.png', subfolder: '', type: 'output' }] } },
            },
          }),
          { status: 200 },
        )
      }
      if (u.includes('/view?')) {
        return new Response(validPng, { status: 200, headers: { 'content-type': 'image/png' } })
      }
      return new Response('nope', { status: 404 })
    }) as typeof fetch
    try {
      const provider = new ComfyUIProvider()
      const outPath = path.join(tmpDir, 'comfy-http.png')
      const asset = await provider.generate({
        prompt: 'Olá cena',
        outPath,
        width: 512,
        height: 768,
        scene: 1,
      })
      assert.equal(asset.provider, 'comfyui')
      assert.equal(asset.sourceType, 'GENERATED')
      assert.equal(asset.metadata.workflow, 'image_default')
      assert.equal(typeof asset.metadata.sha256, 'string')
      assert.ok(fs.existsSync(outPath))
      assert.ok(calls.some((c) => c.includes('/system_stats')))
      assert.ok(calls.some((c) => c.includes('/prompt')))
      assert.ok(calls.some((c) => c.includes('/history/p1')))
      assert.ok(calls.some((c) => c.includes('/view?')))
    } finally {
      globalThis.fetch = originalFetch
      delete process.env.COMFY_BASE_URL
      delete process.env.COMFY_WORKFLOW
    }
  })

  it('probe reports NOT_CONFIGURED without URL and READY against a live fake Comfy', async () => {
    delete process.env.COMFY_BASE_URL
    assert.equal((await new ComfyUIProvider().probe()).status, 'NOT_CONFIGURED')
    const fake = await startFakeComfyServer()
    process.env.COMFY_BASE_URL = fake.url
    try {
      const probe = await new ComfyUIProvider().probe()
      assert.equal(probe.status, 'READY')
      assert.ok(probe.latencyMs >= 0)
      assert.equal(probe.endpoint, '/system_stats')
    } finally {
      delete process.env.COMFY_BASE_URL
      await fake.close()
    }
  })

  it('unreachable Comfy fail-fasts (ERROR) and Fallback uses Mock', async () => {
    process.env.COMFY_BASE_URL = 'http://127.0.0.1:1'
    process.env.COMFY_HEALTH_TIMEOUT_MS = '400'
    try {
      const resolver = createVisualResolver()
      const outPath = path.join(tmpDir, 'comfy-down.png')
      const t0 = Date.now()
      const asset = await resolver.generate({
        prompt: 'cena com Comfy morto',
        outPath,
        width: 320,
        height: 560,
        scene: 1,
      })
      assert.ok(Date.now() - t0 < 8000, 'must not wait the 15min job timeout')
      assert.equal(asset.provider, 'mock_visual')
      assert.ok(asset.fallbackTrail?.some((t) => t.provider === 'comfyui' && t.status === 'ERROR'))
    } finally {
      delete process.env.COMFY_BASE_URL
      delete process.env.COMFY_HEALTH_TIMEOUT_MS
    }
  })

  it('TIMEOUT trips the circuit so later scenes skip Comfy immediately', async () => {
    process.env.COMFY_BASE_URL = 'http://127.0.0.1:18189'
    process.env.COMFY_TIMEOUT_MS = '150'
    process.env.COMFY_POLL_MS = '40'
    const originalFetch = globalThis.fetch
    let historyCalls = 0
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      const u = String(url)
      if (u.endsWith('/system_stats')) {
        return new Response(JSON.stringify({ system: { os: 'linux' } }), { status: 200 })
      }
      if (u.endsWith('/prompt') && init?.method === 'POST') {
        return new Response(JSON.stringify({ prompt_id: 'slow' }), { status: 200 })
      }
      if (u.includes('/history/')) {
        historyCalls += 1
        return new Response(JSON.stringify({}), { status: 200 })
      }
      return new Response('nope', { status: 404 })
    }) as typeof fetch
    try {
      const comfy = new ComfyUIProvider()
      const resolver = new FallbackVisualProvider(comfy, new MockVisualProvider())
      const a = await resolver.generate({
        prompt: 'slow 1',
        outPath: path.join(tmpDir, 'circuit-1.png'),
        width: 64,
        height: 64,
        scene: 1,
      })
      assert.equal(a.provider, 'mock_visual')
      assert.ok(a.fallbackTrail.some((t) => t.status === 'TIMEOUT'))
      const before = historyCalls
      const t0 = Date.now()
      const b = await resolver.generate({
        prompt: 'slow 2',
        outPath: path.join(tmpDir, 'circuit-2.png'),
        width: 64,
        height: 64,
        scene: 2,
      })
      assert.ok(Date.now() - t0 < 800, 'second scene must not poll Comfy')
      assert.equal(b.provider, 'mock_visual')
      assert.equal(historyCalls, before)
      assert.ok(b.fallbackTrail.some((t) => t.provider === 'comfyui' && t.status === 'ERROR'))
    } finally {
      globalThis.fetch = originalFetch
      delete process.env.COMFY_BASE_URL
      delete process.env.COMFY_TIMEOUT_MS
      delete process.env.COMFY_POLL_MS
    }
  })

  it('live fake Comfy produces GENERATED PNG', async () => {
    const fake = await startFakeComfyServer()
    process.env.COMFY_BASE_URL = fake.url
    try {
      const provider = new ComfyUIProvider()
      const outPath = path.join(tmpDir, 'comfy-live.png')
      const asset = await provider.generate({
        prompt: 'live fake',
        outPath,
        width: 256,
        height: 448,
        scene: 3,
      })
      assert.equal(asset.provider, 'comfyui')
      assert.equal(asset.sourceType, 'GENERATED')
      assert.ok(fs.existsSync(outPath))
      validateImageBuffer(fs.readFileSync(outPath))
    } finally {
      delete process.env.COMFY_BASE_URL
      await fake.close()
    }
  })
})
