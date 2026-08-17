import type { PackageStatus } from './types.js'
import { reviewVisualPublishability, type VisualPublishReview } from './PublishingQualityGate.js'

export type ContentPackageManifest = {
  scriptId: string
  productionId: string
  platform: string
  voice?: Record<string, unknown>
  visuals?: Array<Record<string, unknown>>
  subtitles?: Record<string, unknown>
  thumbnail?: Record<string, unknown>
  finalVideo?: Record<string, unknown>
  metadata: Record<string, unknown>
  qualityGate: {
    voiceValid: boolean
    visualsValid: boolean
    subtitlesValid: boolean
    finalVideoValid: boolean
    thumbnailValid: boolean
    storageValid: boolean
    checksumsValid: boolean
    licensesKnown: boolean
    noUnresolvedFailure: boolean
    visualsPublishable: boolean
  }
  visualReview?: VisualPublishReview
}

export function evaluateQualityGate(gate: ContentPackageManifest['qualityGate']): PackageStatus {
  const ok = Object.values(gate).every(Boolean)
  return ok ? 'READY_FOR_PUBLISH' : 'READY_FOR_REVIEW'
}

export function buildContentPackageManifest(input: {
  scriptId: string
  productionId: string
  platform: string
  assets: Array<Record<string, unknown>>
  qaStatus: string
  licensesKnown: boolean
  noUnresolvedFailure: boolean
}): { status: PackageStatus; manifest: ContentPackageManifest } {
  const byType = (t: string) => input.assets.filter((a) => a.type === t && a.is_current)
  const voice = byType('AUDIO')[0]
  const visuals = byType('IMAGE')
  const subs = byType('SUBTITLE')
  const thumb = byType('THUMBNAIL')[0]
  const final = byType('FINAL_VIDEO')[0]
  const visualReview = reviewVisualPublishability(input.assets)

  const checksumsValid = input.assets
    .filter((a) => a.is_current)
    .every((a) => typeof a.checksum === 'string' && String(a.checksum).length === 64)

  const gate = {
    voiceValid: Boolean(voice && Number(voice.file_size) > 0),
    visualsValid: visuals.length > 0 && visuals.every((v) => Number(v.file_size) > 0),
    subtitlesValid: subs.length > 0,
    finalVideoValid: Boolean(final && Number(final.file_size) > 0) && input.qaStatus !== 'FAIL',
    thumbnailValid: Boolean(thumb && Number(thumb.file_size) > 0),
    storageValid: Boolean(final?.uri && voice?.uri),
    checksumsValid,
    licensesKnown: input.licensesKnown,
    noUnresolvedFailure: input.noUnresolvedFailure && input.qaStatus !== 'FAIL',
    visualsPublishable: visualReview.authorized,
  }

  let status = evaluateQualityGate(gate)
  if (input.qaStatus === 'REQUIRES_REVIEW') status = 'READY_FOR_REVIEW'
  if (input.qaStatus === 'FAIL') status = 'FAILED'
  if (status === 'READY_FOR_PUBLISH' && !gate.noUnresolvedFailure) status = 'READY_FOR_REVIEW'
  if (status === 'READY_FOR_PUBLISH' && !visualReview.authorized) status = 'READY_FOR_REVIEW'

  return {
    status,
    manifest: {
      scriptId: input.scriptId,
      productionId: input.productionId,
      platform: input.platform,
      voice: voice as Record<string, unknown> | undefined,
      visuals: visuals as Array<Record<string, unknown>>,
      subtitles: {
        files: subs,
      },
      thumbnail: thumb as Record<string, unknown> | undefined,
      finalVideo: final as Record<string, unknown> | undefined,
      metadata: {
        assetCount: input.assets.length,
        qaStatus: input.qaStatus,
        visualReview,
      },
      qualityGate: gate,
      visualReview,
    },
  }
}
