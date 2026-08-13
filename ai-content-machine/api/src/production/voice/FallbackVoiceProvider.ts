import type { ProviderStatus } from '../types.js'
import type { VoiceAsset, VoiceGenerateInput, VoiceProvider } from './VoiceProvider.js'

export type VoiceFallbackAttempt = {
  provider: string
  status: ProviderStatus | 'ERROR'
  error?: string
}

/**
 * Kokoro → RealVoice/API → Mock.
 * ProductionService only talks to this resolver — it does not pick the engine.
 */
export class FallbackVoiceProvider implements VoiceProvider {
  name = 'voice_fallback'

  constructor(
    private readonly kokoro: VoiceProvider,
    private readonly api: VoiceProvider,
    private readonly mock: VoiceProvider,
  ) {}

  status(): ProviderStatus {
    for (const p of this.chain()) {
      if (p.status() === 'READY') return 'READY'
    }
    return 'NOT_CONFIGURED'
  }

  chain(): VoiceProvider[] {
    return [this.kokoro, this.api, this.mock]
  }

  async generate(input: VoiceGenerateInput): Promise<VoiceAsset & { fallbackTrail: VoiceFallbackAttempt[] }> {
    const trail: VoiceFallbackAttempt[] = []
    for (const provider of this.chain()) {
      const st = provider.status()
      if (st !== 'READY') {
        trail.push({ provider: provider.name, status: st })
        continue
      }
      try {
        const asset = await provider.generate(input)
        trail.push({ provider: provider.name, status: 'READY' })
        return { ...asset, fallbackTrail: trail }
      } catch (err) {
        trail.push({
          provider: provider.name,
          status: 'ERROR',
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
    throw Object.assign(
      new Error(`voice_fallback_exhausted:${trail.map((t) => `${t.provider}:${t.status}`).join(',')}`),
      { code: 'VOICE_FALLBACK_EXHAUSTED', trail },
    )
  }
}
