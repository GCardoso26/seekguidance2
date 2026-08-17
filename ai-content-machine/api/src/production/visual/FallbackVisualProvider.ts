import type { ProviderStatus } from '../types.js'
import type { VisualAsset, VisualGenerateInput, VisualProvider } from './VisualProvider.js'

export type VisualFallbackAttempt = {
  provider: string
  status: ProviderStatus | 'ERROR' | 'TIMEOUT' | 'INVALID' | 'AWAITING_USER' | 'RATE_LIMIT' | 'AUTH_ERROR' | 'NOT_FOUND'
  error?: string
}

/**
 * MISS chain only. Library HIT stays in ProductionService.
 * Default wiring: Pexels → Pixabay → optional Comfy → Mock(dev) | Manual(prod).
 * Legacy constructor `new FallbackVisualProvider(comfy, mock)` still works.
 */
export class FallbackVisualProvider implements VisualProvider {
  name = 'visual_fallback'
  private readonly providers: VisualProvider[]

  constructor(first: VisualProvider | VisualProvider[], second?: VisualProvider) {
    this.providers = Array.isArray(first) ? first : [first, ...(second ? [second] : [])]
  }

  status(): ProviderStatus {
    for (const p of this.chain()) {
      if (p.status() === 'READY') return 'READY'
    }
    return 'NOT_CONFIGURED'
  }

  chain(): VisualProvider[] {
    return this.providers
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
        if (code === 'AWAITING_USER') {
          trail.push({ provider: provider.name, status: 'AWAITING_USER', error: msg })
          throw Object.assign(err instanceof Error ? err : new Error(msg), {
            code: 'AWAITING_USER',
            trail,
            request: err && typeof err === 'object' && 'request' in err ? (err as { request?: unknown }).request : undefined,
          })
        }
        const status =
          code === 'TIMEOUT' || msg.startsWith('comfy_timeout:')
            ? ('TIMEOUT' as const)
            : code === 'INVALID' || msg.startsWith('comfy_image_')
              ? ('INVALID' as const)
              : code === 'RATE_LIMIT'
                ? ('RATE_LIMIT' as const)
                : code === 'AUTH_ERROR'
                  ? ('AUTH_ERROR' as const)
                  : code === 'NOT_FOUND'
                    ? ('NOT_FOUND' as const)
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
