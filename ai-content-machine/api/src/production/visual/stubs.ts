import type { VisualAsset, VisualGenerateInput, VisualProvider } from './VisualProvider.js'

function notConfigured(name: string): VisualProvider {
  return {
    name,
    status: () => 'NOT_CONFIGURED' as const,
    async generate(_input: VisualGenerateInput): Promise<VisualAsset> {
      throw Object.assign(new Error(`provider_not_configured:${name}`), { code: 'NOT_CONFIGURED' })
    },
  }
}

export const imageGenerationProvider = notConfigured('image_generation')
export const stockMediaProvider = notConfigured('stock_media')
export const videoGenerationProvider = notConfigured('video_generation')
