import type { ProviderStatus } from '../types.js'

export type ThumbnailInput = {
  hook: string
  topic: string
  brand: string
  visualStyle: string
  outPath: string
  width: number
  height: number
}

export type ThumbnailAsset = {
  path: string
  concept: string
  text: string
  sourceType: 'MOCK' | 'GENERATED'
  provider: string
  mimeType: string
  costCents: number
}

export interface ThumbnailProvider {
  name: string
  status(): ProviderStatus
  generate(input: ThumbnailInput): Promise<ThumbnailAsset>
}
