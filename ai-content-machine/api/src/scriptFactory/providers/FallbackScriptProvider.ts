import type { ScriptGenerationContext } from '../types.js'
import type {
  ScriptFallbackAttempt,
  ScriptProvider,
  ScriptProviderResult,
  ScriptProviderStatus,
} from './ScriptProvider.js'

/**
 * Ollama → OpenAI-compatible API → Mock.
 * ScriptFactoryService only talks to this resolver.
 */
export class FallbackScriptProvider implements ScriptProvider {
  name = 'script_fallback'

  constructor(
    private readonly ollama: ScriptProvider,
    private readonly api: ScriptProvider,
    private readonly mock: ScriptProvider,
  ) {}

  status(): ScriptProviderStatus {
    for (const p of this.chain()) {
      if (p.status() === 'READY') return 'READY'
    }
    return 'NOT_CONFIGURED'
  }

  chain(): ScriptProvider[] {
    return [this.ollama, this.api, this.mock]
  }

  async generate(ctx: ScriptGenerationContext): Promise<ScriptProviderResult> {
    const trail: ScriptFallbackAttempt[] = []
    for (const provider of this.chain()) {
      const st = provider.status()
      if (st !== 'READY') {
        trail.push({ provider: provider.name, status: st })
        continue
      }
      const started = Date.now()
      try {
        const result = await provider.generate(ctx)
        trail.push({
          provider: provider.name,
          model: result.model,
          status: 'READY',
          durationMs: result.durationMs || Date.now() - started,
        })
        return { ...result, fallbackTrail: trail }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        const code = err && typeof err === 'object' && 'code' in err ? String((err as { code?: string }).code) : ''
        const status =
          code === 'TIMEOUT' || msg.startsWith('llm_timeout:')
            ? ('TIMEOUT' as const)
            : code === 'INVALID_SCRIPT' || msg.startsWith('script_payload_')
              ? ('INVALID' as const)
              : ('ERROR' as const)
        trail.push({
          provider: provider.name,
          status,
          durationMs: Date.now() - started,
          error: msg,
        })
      }
    }
    throw Object.assign(
      new Error(`script_fallback_exhausted:${trail.map((t) => `${t.provider}:${t.status}`).join(',')}`),
      { code: 'SCRIPT_FALLBACK_EXHAUSTED', trail },
    )
  }
}
