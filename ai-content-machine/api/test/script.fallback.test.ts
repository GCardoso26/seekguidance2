import { describe, it, after } from 'node:test'
import assert from 'node:assert/strict'
import { FallbackScriptProvider } from '../src/scriptFactory/providers/FallbackScriptProvider.js'
import { MockScriptProvider } from '../src/scriptFactory/providers/MockScriptProvider.js'
import { OllamaScriptProvider } from '../src/scriptFactory/providers/OllamaScriptProvider.js'
import { ApiScriptProvider } from '../src/scriptFactory/providers/ApiScriptProvider.js'
import { parseAndValidateScriptPack } from '../src/scriptFactory/providers/scriptSchema.js'
import type { ScriptGenerationContext } from '../src/scriptFactory/types.js'
import type { ScriptProvider, ScriptProviderResult } from '../src/scriptFactory/providers/ScriptProvider.js'

process.env.AUTOMATION_MODE = 'mock'

const sampleCtx: ScriptGenerationContext = {
  niche: { id: 'n1', name: 'IA + produtividade' },
  targetAudience: 'criadores',
  topic: { id: 't1', title: 'Automação' },
  contentIdea: {
    id: 'i1',
    title: 'Como usar IA para criar 30 conteúdos',
    angles: ['lista'],
    hooks: [],
  },
  angle: 'lista',
  brandVoice: {},
  platform: 'YOUTUBE_SHORT',
  targetDuration: 35,
  winningHooks: [],
  winningTopics: [],
  previousPerformance: [],
  offer: null,
  ctaStrategy: 'link na bio',
}

const validPack = {
  hooks: [
    {
      text: 'Ninguém te mostrou isso sobre IA para criar 30 conteúdos.',
      type: 'CURIOSITY',
      score: 88,
      reason: 'curiosidade',
    },
  ],
  script: {
    hook: 'Ninguém te mostrou isso sobre IA para criar 30 conteúdos.',
    setup: 'Em 35s: sistema simples para criadores.',
    problem: 'A maioria improvisa e perde consistência.',
    insight: 'A unidade é o roteiro, não o vídeo.',
    value: 'Um fluxo com hooks, CTA e variantes.',
    proof: 'Processo testável em 7 dias.',
    cta: 'Peguei os prompts e deixei no link da bio.',
  },
}

class FakeScript implements ScriptProvider {
  constructor(
    public name: string,
    private ready: boolean,
    private impl: () => Promise<ScriptProviderResult>,
  ) {}
  status() {
    return this.ready ? ('READY' as const) : ('NOT_CONFIGURED' as const)
  }
  generate() {
    return this.impl()
  }
}

describe('Script fallback (Ollama → API → Mock)', () => {
  after(() => {
    delete process.env.OLLAMA_BASE_URL
    delete process.env.OPENAI_API_KEY
    delete process.env.SCRIPT_LLM_API_KEY
  })

  it('schema rejects invalid payload (HTTP 200 ≠ válido)', () => {
    assert.throws(() => parseAndValidateScriptPack({ hooks: [], script: { hook: 'x' } }), /script_payload_schema/)
    assert.throws(() => parseAndValidateScriptPack('not-json'), /invalid_json|no_json/)
  })

  it('schema accepts structured ScriptFactory contract', () => {
    const ok = parseAndValidateScriptPack(validPack)
    assert.equal(ok.hooks.length, 1)
    assert.ok(ok.script.setup.length >= 8)
    assert.equal(ok.bestHook.type, 'CURIOSITY')
  })

  it('Ollama unavailable → API unavailable → Mock wins', async () => {
    delete process.env.OLLAMA_BASE_URL
    delete process.env.OPENAI_API_KEY
    delete process.env.SCRIPT_LLM_API_KEY
    const resolver = new FallbackScriptProvider(
      new OllamaScriptProvider(),
      new ApiScriptProvider(),
      new MockScriptProvider(),
    )
    const result = await resolver.generate(sampleCtx)
    assert.equal(result.provider, 'mock')
    assert.ok(result.script.cta.length >= 8)
    assert.ok(result.fallbackTrail.some((t) => t.provider === 'ollama' && t.status === 'NOT_CONFIGURED'))
    assert.ok(result.fallbackTrail.some((t) => t.provider === 'mock' && t.status === 'READY'))
  })

  it('Ollama available → Ollama wins', async () => {
    const ollama = new FakeScript('ollama', true, async () => ({
      ...parseAndValidateScriptPack(validPack),
      provider: 'ollama',
      model: 'llama3.2',
      tokensIn: 10,
      tokensOut: 20,
      durationMs: 12,
      fallbackTrail: [],
    }))
    const api = new FakeScript('openai_compatible', true, async () => {
      throw new Error('should_not_call_api')
    })
    const mock = new FakeScript('mock', true, async () => {
      throw new Error('should_not_call_mock')
    })
    const result = await new FallbackScriptProvider(ollama, api, mock).generate(sampleCtx)
    assert.equal(result.provider, 'ollama')
    assert.equal(result.model, 'llama3.2')
    assert.equal(result.fallbackTrail.length, 1)
  })

  it('Ollama down → API wins', async () => {
    const ollama = new FakeScript('ollama', true, async () => {
      throw new Error('ollama_down')
    })
    const api = new FakeScript('openai_compatible', true, async () => ({
      ...parseAndValidateScriptPack(validPack),
      provider: 'openai_compatible',
      model: 'gpt-4o-mini',
      tokensIn: 11,
      tokensOut: 22,
      durationMs: 9,
      fallbackTrail: [],
    }))
    const mock = new FakeScript('mock', true, async () => {
      throw new Error('should_not_call_mock')
    })
    const result = await new FallbackScriptProvider(ollama, api, mock).generate(sampleCtx)
    assert.equal(result.provider, 'openai_compatible')
    assert.ok(result.fallbackTrail.some((t) => t.provider === 'ollama' && t.status === 'ERROR'))
  })

  it('invalid Ollama response → fallback to Mock', async () => {
    const ollama = new FakeScript('ollama', true, async () => {
      parseAndValidateScriptPack({ bad: true })
      throw new Error('unreachable')
    })
    const api = new FakeScript('openai_compatible', false, async () => {
      throw new Error('no_api')
    })
    const result = await new FallbackScriptProvider(ollama, api, new MockScriptProvider()).generate(
      sampleCtx,
    )
    assert.equal(result.provider, 'mock')
    assert.ok(result.fallbackTrail.some((t) => t.provider === 'ollama' && t.status === 'INVALID'))
  })

  it('timeout → fallback', async () => {
    const ollama = new FakeScript('ollama', true, async () => {
      throw Object.assign(new Error('llm_timeout:1'), { code: 'TIMEOUT' })
    })
    const api = new FakeScript('openai_compatible', false, async () => {
      throw new Error('no_api')
    })
    const result = await new FallbackScriptProvider(ollama, api, new MockScriptProvider()).generate(
      sampleCtx,
    )
    assert.equal(result.provider, 'mock')
    assert.ok(result.fallbackTrail.some((t) => t.provider === 'ollama' && t.status === 'TIMEOUT'))
  })

  it('OllamaScriptProvider posts chat completions and validates schema', async () => {
    process.env.OLLAMA_BASE_URL = 'http://127.0.0.1:11434'
    process.env.OLLAMA_MODEL = 'llama3.2'
    const originalFetch = globalThis.fetch
    let sawUrl = ''
    let sawBody: Record<string, unknown> = {}
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      sawUrl = String(url)
      sawBody = JSON.parse(String(init?.body || '{}')) as Record<string, unknown>
      return new Response(
        JSON.stringify({
          model: 'llama3.2',
          choices: [{ message: { content: JSON.stringify(validPack) } }],
          usage: { prompt_tokens: 5, completion_tokens: 7 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      )
    }) as typeof fetch
    try {
      const provider = new OllamaScriptProvider()
      assert.equal(provider.status(), 'READY')
      const result = await provider.generate(sampleCtx)
      assert.equal(result.provider, 'ollama')
      assert.ok(sawUrl.includes('/v1/chat/completions'))
      assert.equal(sawBody.format, 'json')
      assert.equal(sawBody.max_tokens, 4096)
      assert.ok(result.script.insight.length >= 8)
      assert.ok(result.durationMs >= 0)
    } finally {
      globalThis.fetch = originalFetch
      delete process.env.OLLAMA_BASE_URL
      delete process.env.OLLAMA_MODEL
    }
  })
})
