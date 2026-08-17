import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import { PexelsProvider, PixabayProvider } from '../src/production/visual/StockProviders.js'
import { ManualFallbackProvider } from '../src/production/visual/ManualFallbackProvider.js'
import { FallbackVisualProvider } from '../src/production/visual/FallbackVisualProvider.js'
import { expandStockQueries, buildManualAssetRequest } from '../src/production/visual/stockQueries.js'
import { createVisualResolver } from '../src/production/visual/createVisualResolver.js'
import { planScenes } from '../src/production/ScenePlannerService.js'
import { motionForAsset } from '../src/production/composition/KenBurnsPlanner.js'

const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex',
)

function startStockServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    if (url.pathname === '/pexels/search') {
      if (req.headers.authorization === 'bad') {
        res.statusCode = 401
        res.end('{}')
        return
      }
      if (url.searchParams.get('query') === 'empty') {
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify({ photos: [] }))
        return
      }
      res.setHeader('content-type', 'application/json')
      res.end(
        JSON.stringify({
          photos: [
            {
              id: 1,
              width: 1080,
              height: 1920,
              photographer: 'Ada',
              url: 'https://pexels.example/photo',
              src: { large: `http://127.0.0.1:${(server.address() as { port: number }).port}/img.png` },
            },
          ],
        }),
      )
      return
    }
    if (url.pathname === '/pixabay') {
      res.setHeader('content-type', 'application/json')
      res.end(
        JSON.stringify({
          hits: [
            {
              id: 9,
              largeImageURL: `http://127.0.0.1:${(server.address() as { port: number }).port}/img.png`,
              imageWidth: 1080,
              imageHeight: 1920,
              user: 'Bob',
              pageURL: 'https://pixabay.example/x',
            },
          ],
        }),
      )
      return
    }
    if (url.pathname === '/img.png') {
      res.setHeader('content-type', 'image/png')
      res.end(PNG)
      return
    }
    res.statusCode = 404
    res.end()
  })
  return new Promise<http.Server>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

describe('Stock VisualResolver + manual fallback', () => {
  let server: http.Server
  let port = 0
  const tmp = path.join(os.tmpdir(), `cwm-stock-${Date.now()}`)

  before(async () => {
    fs.mkdirSync(tmp, { recursive: true })
    server = await startStockServer()
    port = (server.address() as { port: number }).port
  })

  after(() => {
    server.close()
    delete process.env.PEXELS_API_KEY
    delete process.env.PIXABAY_API_KEY
    process.env.AUTOMATION_MODE = 'mock'
  })

  it('expands multiple English stock queries from scene intent', () => {
    const q = expandStockQueries({
      role: 'problem',
      visualIntent: 'tired person looking at clock',
      subject: 'exhausted worker',
    })
    assert.ok(q.length >= 2)
    assert.ok(q.some((x) => /tired|night|laptop|clock/i.test(x)))
  })

  it('builds MANUAL_ASSET_REQUEST with copyable searches and platform URLs', () => {
    const req = buildManualAssetRequest({
      scene: 3,
      role: 'problem',
      visualIntent: 'Pessoa olhando para o relógio durante a madrugada',
      reason: 'stock_miss',
      durationSec: 5,
    })
    assert.equal(req.scene_number, 3)
    assert.equal(req.required_format, '9:16')
    assert.ok(req.search_queries.length >= 1)
    assert.match(req.pexelsUrl, /pexels\.com/)
    assert.match(req.pixabayUrl, /pixabay\.com/)
  })

  it('Pexels downloads and catalogs STOCK provenance', async () => {
    process.env.PEXELS_API_KEY = 'test-pexels'
    const p = new PexelsProvider()
    const orig = p.search.bind(p)
    ;(p as unknown as { search: typeof orig }).search = async () => {
      const url = `http://127.0.0.1:${port}/pexels/search?query=tired`
      const res = await fetch(url, { headers: { Authorization: 'test-pexels' } })
      const json = (await res.json()) as { photos: Array<{ src: { large: string }; photographer: string; id: number; width: number; height: number; url: string }> }
      const photo = json.photos[0]
      return [
        {
          id: String(photo.id),
          url: photo.src.large,
          width: photo.width,
          height: photo.height,
          author: photo.photographer,
          license: 'PEXELS',
          pageUrl: photo.url,
        },
      ]
    }
    const out = path.join(tmp, 'pexels.png')
    const asset = await p.generate({
      prompt: 'tired night',
      outPath: out,
      width: 1080,
      height: 1920,
      scene: 1,
      searchQueries: ['tired person night'],
    })
    assert.equal(asset.provider, 'pexels')
    assert.equal(asset.sourceType, 'STOCK')
    assert.ok(fs.existsSync(out))
    void orig
  })

  it('Pexels AUTH_ERROR does not silently mock', async () => {
    process.env.PEXELS_API_KEY = 'bad'
    const p = new PexelsProvider()
    ;(p as unknown as { search: () => Promise<unknown> }).search = async () => {
      throw Object.assign(new Error('pexels_http:401'), { code: 'AUTH_ERROR' })
    }
    await assert.rejects(
      () =>
        p.generate({
          prompt: 'x',
          outPath: path.join(tmp, 'auth.png'),
          width: 10,
          height: 10,
          scene: 1,
          searchQueries: ['x'],
        }),
      /AUTH_ERROR|pexels/,
    )
  })

  it('Pixabay is a real fallback provider when Pexels misses', async () => {
    process.env.PIXABAY_API_KEY = 'px'
    const pix = new PixabayProvider()
    ;(pix as unknown as { search: () => Promise<unknown> }).search = async () => [
      {
        id: '9',
        url: `http://127.0.0.1:${port}/img.png`,
        width: 1080,
        height: 1920,
        author: 'Bob',
        license: 'PIXABAY',
        pageUrl: 'https://pixabay.example/x',
      },
    ]
    const out = path.join(tmp, 'pix.png')
    const asset = await pix.generate({
      prompt: 'clock',
      outPath: out,
      width: 1080,
      height: 1920,
      scene: 2,
      searchQueries: ['clock night'],
    })
    assert.equal(asset.provider, 'pixabay')
    assert.equal(asset.sourceType, 'STOCK')
  })

  it('production mode ends on ManualFallback, not mock', async () => {
    process.env.AUTOMATION_MODE = 'production'
    delete process.env.PEXELS_API_KEY
    delete process.env.PIXABAY_API_KEY
    delete process.env.COMFY_BASE_URL
    const resolver = createVisualResolver()
    const names = resolver.chain().map((p) => p.name)
    assert.ok(names.includes('pexels'))
    assert.ok(names.includes('pixabay'))
    assert.ok(names.includes('comfyui'))
    assert.ok(names.includes('manual_fallback'))
    assert.ok(!names.includes('mock_visual'))
    await assert.rejects(
      () =>
        resolver.generate({
          prompt: 'hook',
          outPath: path.join(tmp, 'manual.png'),
          width: 320,
          height: 560,
          scene: 3,
          role: 'problem',
        }),
      (err: unknown) => {
        const e = err as { code?: string; request?: { scene_number: number } }
        assert.equal(e.code, 'AWAITING_USER')
        assert.equal(e.request?.scene_number, 3)
        return true
      },
    )
    process.env.AUTOMATION_MODE = 'mock'
  })

  it('ManualFallbackProvider never writes color bars', async () => {
    const out = path.join(tmp, 'should-not-exist.png')
    await assert.rejects(() =>
      new ManualFallbackProvider().generate({
        prompt: 'x',
        outPath: out,
        width: 10,
        height: 10,
        scene: 4,
      }),
    )
    assert.equal(fs.existsSync(out), false)
  })

  it('ScenePlanner emits 5–7 scenes with search_queries and motion', () => {
    const { scenes } = planScenes({
      scriptBody: {
        hook: 'Você perde duas horas por dia?',
        setup: 'Abrir cinco apps não é sistema.',
        problem: 'Cada tarefa recomeça.',
        insight: 'Um fluxo único corta o loop.',
        value: 'O mesmo personagem em todas as cenas.',
        proof: 'QA trava o publish.',
        cta: 'Link na descrição.',
      },
      targetDurationSec: 40,
      maxScenes: 5,
    })
    assert.ok(scenes.length >= 5 && scenes.length <= 7)
    assert.ok(scenes[0].search_queries.length >= 1)
    assert.ok(scenes[0].motion)
    assert.equal(motionForAsset(1, 'abc'), motionForAsset(1, 'abc'))
  })

  it('FallbackVisualProvider 2-arg constructor still prefers first READY provider', async () => {
    const fake = {
      name: 'comfyui',
      status: () => 'NOT_CONFIGURED' as const,
      generate: async () => {
        throw new Error('no')
      },
    }
    const pix = {
      name: 'pixabay',
      status: () => 'READY' as const,
      generate: async (input: { outPath: string }) => {
        fs.writeFileSync(input.outPath, PNG)
        return {
          path: input.outPath,
          width: 1,
          height: 1,
          sourceType: 'STOCK' as const,
          provider: 'pixabay',
          mimeType: 'image/png',
          license: 'PIXABAY',
          prompt: '',
          costCents: 0,
          metadata: {},
        }
      },
    }
    const resolver = new FallbackVisualProvider([fake, pix])
    const asset = await resolver.generate({
      prompt: 'x',
      outPath: path.join(tmp, 'chain.png'),
      width: 1,
      height: 1,
      scene: 1,
    })
    assert.equal(asset.provider, 'pixabay')
  })

  it('Pexels RATE_LIMIT falls through to Pixabay, never to mock in the chain', async () => {
    const pexels = {
      name: 'pexels',
      status: () => 'READY' as const,
      generate: async () => {
        throw Object.assign(new Error('pexels_http:429'), { code: 'RATE_LIMIT' })
      },
    }
    const pix = {
      name: 'pixabay',
      status: () => 'READY' as const,
      generate: async (input: { outPath: string }) => {
        fs.writeFileSync(input.outPath, PNG)
        return {
          path: input.outPath,
          width: 1,
          height: 1,
          sourceType: 'STOCK' as const,
          provider: 'pixabay',
          mimeType: 'image/png',
          license: 'PIXABAY',
          prompt: '',
          costCents: 0,
          metadata: {},
        }
      },
    }
    const resolver = new FallbackVisualProvider([pexels, pix])
    const asset = await resolver.generate({
      prompt: 'x',
      outPath: path.join(tmp, 'rate.png'),
      width: 1,
      height: 1,
      scene: 1,
    })
    assert.equal(asset.provider, 'pixabay')
    assert.ok(asset.fallbackTrail?.some((t) => t.provider === 'pexels' && t.status === 'RATE_LIMIT'))
  })
})
