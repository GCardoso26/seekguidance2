import type { ProviderStatus } from '../types.js'
import type { VisualAsset, VisualGenerateInput, VisualProvider } from './VisualProvider.js'

export type VisualFallbackAttempt = {
  provider: string
  status: ProviderStatus | 'ERROR' | 'TIMEOUT' | 'INVALID'
  error?: string
}

/**
 * ComfyUI → Mock.
 * ProductionService only talks to this resolver — ComfyUI must not leak there.
 * Library HIT/MISS stays in ProductionService; this chain runs only on MISS.
 */
export class FallbackVisualProvider implements VisualProvider {
  name = 'visual_fallback'

  constructor(
    private readonly comfy: VisualProvider,
    private readonly mock: VisualProvider,
  ) {}

  status(): ProviderStatus {
    for (const p of this.chain()) {
      if (p.status() === 'READY') return 'READY'
    }
    return 'NOT_CONFIGURED'
  }

  chain(): VisualProvider[] {
    return [this.comfy, this.mock]
  }

  async generate(input: VisualGenerateInput): Promise<VisualAsset & { fallbackTrail: VisualFallbackAttempt[] }> {
    const trail: VisualFallbackAttempt[] = []
    for (const provider of this.chain()) {
      const st = provider.status()
      if (st !== 'READY') {
        trail.push({ provider: provider.name, status: st })
        continue
      }
      try {
        const result = await provider.generate(input)
        trail.push({ provider: provider.name, status: 'READY' })
        return { ...result, fallbackTrail: trail }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        const code = err && typeof err === 'object' && 'code' in err ? String((err as { code?: string }).code) : ''
        const status =
          code === 'TIMEOUT' || msg.startsWith('comfy_timeout:')
            ? ('TIMEOUT' as const)
            : code === 'INVALID' || msg.startsWith('comfy_image_')
              ? ('INVALID' as const)
              : ('ERROR' as const)
        trail.push({ provider: provider.name, status, error: msg })
      }
    }
    throw Object.assign(
      new Error(`visual_fallback_exhausted:${trail.map((t) => `${t.provider}:${t.status}`).join(',')}`),
      { code: 'VISUAL_FALLBACK_EXHAUSTED', trail },
    )
  }
}
