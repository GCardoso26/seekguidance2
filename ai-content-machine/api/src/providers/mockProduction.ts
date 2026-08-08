export type AssetValidation = {
  fileExists: boolean
  fileSize: number
  durationSec: number
  format: string
  hasAudio: boolean
  hasVideo: boolean
  resolution: string
  ok: boolean
  reality: 'MOCK' | 'FAILED'
  errors: string[]
}

/**
 * Production mock — validates asset contract; never pretends a real render succeeded as REAL.
 */
export async function mockProduceVideo(contentId: string): Promise<{
  assetPath: string
  validation: AssetValidation
  thumbnailPath: string
  costCents: number
}> {
  const assetPath = `/mock-assets/${contentId}.mp4`
  const validation: AssetValidation = {
    fileExists: true,
    fileSize: 1_250_000,
    durationSec: 38,
    format: 'mp4',
    hasAudio: true,
    hasVideo: true,
    resolution: '1080x1920',
    ok: true,
    reality: 'MOCK',
    errors: [],
  }

  // Contract: never complete without validation fields
  if (
    !validation.fileExists ||
    validation.fileSize <= 0 ||
    validation.durationSec <= 0 ||
    !validation.hasAudio ||
    !validation.hasVideo
  ) {
    validation.ok = false
    validation.reality = 'FAILED'
    validation.errors.push('asset validation failed')
  }

  return {
    assetPath,
    validation,
    thumbnailPath: `/mock-assets/${contentId}.jpg`,
    costCents: 12,
  }
}
