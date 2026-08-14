import type { ProviderStatus, ComfyProbeResult } from '../types.js'

export type VisualGenerateInput = {
  prompt: string
  outPath: string
  width: number
  height: number
  scene: number
}

export type VisualAsset = {
  path: string
  width: number
  height: number
  sourceType: 'MOCK' | 'GENERATED' | 'STOCK'
  provider: string
  mimeType: string
  license: string
  prompt: string
  costCents: number
  metadata: Record<string, unknown>
  fallbackTrail?: Array<{ provider: string; status: string; error?: string }>
}

export interface VisualProvider {
  name: string
  status(): ProviderStatus
  generate(input: VisualGenerateInput): Promise<VisualAsset>
  probe?(): Promise<ComfyProbeResult>
}
