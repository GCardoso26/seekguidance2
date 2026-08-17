import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { KokoroVoiceProvider } from '../src/production/voice/KokoroVoiceProvider.js'
import { FallbackVoiceProvider } from '../src/production/voice/FallbackVoiceProvider.js'
import { MockVoiceProvider } from '../src/production/voice/MockVoiceProvider.js'
import { RealVoiceProvider } from '../src/production/voice/RealVoiceProvider.js'
import { ffmpegService } from '../src/production/FFmpegService.js'
import type { VoiceAsset, VoiceGenerateInput, VoiceProvider } from '../src/production/voice/VoiceProvider.js'

process.env.AUTOMATION_MODE = 'mock'

function makeWavStub(outPath: string): Buffer {
  // Minimal valid-ish RIFF header + silence payload (ffmpeg will accept tone better for probe tests)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  ffmpegService.generateToneWav(outPath, 0.6, 22050)
  return fs.readFileSync(outPath)
}

class FakeVoice implements VoiceProvider {
  constructor(
    public name: string,
    private ready: boolean,
    private impl: (input: VoiceGenerateInput) => Promise<VoiceAsset>,
  ) {}
  status() {
    return this.ready ? ('READY' as const) : ('NOT_CONFIGURED' as const)
  }
  generate(input: VoiceGenerateInput) {
    return this.impl(input)
  }
}

describe('Voice fallback (Kokoro → API → Mock)', () => {
  const tmpDir = path.join(os.tmpdir(), `cwm-voice-${Date.now()}`)

  before(() => {
    fs.mkdirSync(tmpDir, { recursive: true })
    assert.equal(ffmpegService.available(), true)
  })

  after(() => {
    delete process.env.KOKORO_BASE_URL
  })

  it('Kokoro is NOT_CONFIGURED without KOKORO_BASE_URL', () => {
    delete process.env.KOKORO_BASE_URL
    const k = new KokoroVoiceProvider()
    assert.equal(k.status(), 'NOT_CONFIGURED')
  })

  it('Fallback uses Mock when Kokoro and API are unavailable', async () => {
    delete process.env.KOKORO_BASE_URL
    delete process.env.VOICE_API_KEY
    delete process.env.ELEVENLABS_API_KEY
    const resolver = new FallbackVoiceProvider(
      new KokoroVoiceProvider(),
      new RealVoiceProvider(),
      new MockVoiceProvider(),
    )
    const outPath = path.join(tmpDir, 'fallback-mock.wav')
    const asset = await resolver.generate({
      text: 'teste de voz',
      outPath,
      durationSec: 1,
      sampleRate: 22050,
    })
    assert.equal(asset.provider, 'mock_voice')
    assert.equal(asset.sourceType, 'MOCK')
    assert.ok(fs.existsSync(outPath))
    assert.ok(asset.fallbackTrail.some((t) => t.provider === 'kokoro' && t.status === 'NOT_CONFIGURED'))
    assert.ok(asset.fallbackTrail.some((t) => t.provider === 'mock_voice' && t.status === 'READY'))
  })

  it('Fallback prefers Kokoro when it succeeds', async () => {
    const outPath = path.join(tmpDir, 'fallback-kokoro.wav')
    const kokoro = new FakeVoice('kokoro', true, async (input) => {
      makeWavStub(input.outPath)
      return {
        path: input.outPath,
        duration: 0.6,
        sampleRate: input.sampleRate,
        sourceType: 'GENERATED',
        provider: 'kokoro',
        mimeType: 'audio/wav',
        costCents: 0,
      }
    })
    const api = new FakeVoice('real_voice', true, async () => {
      throw new Error('should_not_call_api')
    })
    const mock = new FakeVoice('mock_voice', true, async () => {
      throw new Error('should_not_call_mock')
    })
    const resolver = new FallbackVoiceProvider(kokoro, api, mock)
    const asset = await resolver.generate({
      text: 'hook de teste',
      outPath,
      durationSec: 1,
      sampleRate: 22050,
    })
    assert.equal(asset.provider, 'kokoro')
    assert.equal(asset.sourceType, 'GENERATED')
    assert.equal(asset.fallbackTrail.length, 1)
  })

  it('Fallback skips failed Kokoro and uses API, then Mock if API fails', async () => {
    const outPath = path.join(tmpDir, 'fallback-chain.wav')
    const kokoro = new FakeVoice('kokoro', true, async () => {
      throw new Error('kokoro_down')
    })
    const api = new FakeVoice('real_voice', true, async () => {
      throw new Error('api_down')
    })
    const mock = new MockVoiceProvider()
    const resolver = new FallbackVoiceProvider(kokoro, api, mock)
    const asset = await resolver.generate({
      text: 'cai no mock',
      outPath,
      durationSec: 1,
      sampleRate: 22050,
    })
    assert.equal(asset.provider, 'mock_voice')
    assert.ok(asset.fallbackTrail.some((t) => t.provider === 'kokoro' && t.status === 'ERROR'))
    assert.ok(asset.fallbackTrail.some((t) => t.provider === 'real_voice' && t.status === 'ERROR'))
    assert.ok(asset.fallbackTrail.some((t) => t.provider === 'mock_voice' && t.status === 'READY'))
  })

  it('KokoroVoiceProvider posts to OpenAI-compatible speech endpoint', async () => {
    process.env.KOKORO_BASE_URL = 'http://127.0.0.1:18880'
    const outPath = path.join(tmpDir, 'kokoro-http.wav')
    const wav = makeWavStub(path.join(tmpDir, 'seed.wav'))
    const originalFetch = globalThis.fetch
    let sawUrl = ''
    let sawBody: Record<string, unknown> | null = null
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      sawUrl = String(url)
      sawBody = JSON.parse(String(init?.body || '{}'))
      return new Response(wav, {
        status: 200,
        headers: { 'content-type': 'audio/wav' },
      })
    }) as typeof fetch
    try {
      const k = new KokoroVoiceProvider()
      assert.equal(k.status(), 'READY')
      const asset = await k.generate({
        text: 'Olá mundo',
        outPath,
        durationSec: 1,
        sampleRate: 22050,
      })
      assert.equal(asset.provider, 'kokoro')
      assert.equal(asset.sourceType, 'GENERATED')
      assert.ok(sawUrl.includes('/v1/audio/speech'))
      assert.equal(sawBody?.response_format, 'wav')
      assert.equal(sawBody?.input, 'Olá mundo')
      assert.ok(fs.existsSync(outPath))
    } finally {
      globalThis.fetch = originalFetch
      delete process.env.KOKORO_BASE_URL
    }
  })
})
