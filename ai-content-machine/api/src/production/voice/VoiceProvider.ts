import type { ProviderStatus } from '../types.js'

export type VoiceGenerateInput = {
  text: string
  outPath: string
  durationSec: number
  sampleRate: number
}

export type VoiceAsset = {
  path: string
  duration: number
  sampleRate: number
  sourceType: 'MOCK' | 'GENERATED'
  provider: string
  mimeType: string
  costCents: number
}

export interface VoiceProvider {
  name: string
  status(): ProviderStatus
  generate(input: VoiceGenerateInput): Promise<VoiceAsset>
}
