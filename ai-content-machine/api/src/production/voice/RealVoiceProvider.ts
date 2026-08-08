import type { VoiceAsset, VoiceGenerateInput, VoiceProvider } from './VoiceProvider.js'

/** Adapter prepared for ElevenLabs/etc. Never reports SUCCESS without credentials. */
export class RealVoiceProvider implements VoiceProvider {
  name = 'real_voice'

  status() {
    const key = process.env.VOICE_API_KEY || process.env.ELEVENLABS_API_KEY
    return key ? ('READY' as const) : ('NOT_CONFIGURED' as const)
  }

  async generate(_input: VoiceGenerateInput): Promise<VoiceAsset> {
    if (this.status() === 'NOT_CONFIGURED') {
      throw Object.assign(new Error('provider_not_configured:real_voice'), {
        code: 'NOT_CONFIGURED',
      })
    }
    throw Object.assign(new Error('provider_not_configured:real_voice_runtime'), {
      code: 'NOT_CONFIGURED',
    })
  }
}
