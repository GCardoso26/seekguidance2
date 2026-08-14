/**
 * Perfectionist publishing authorizer.
 *
 * Factory may complete an MP4 with Mock visuals so the pipeline never stalls.
 * This gate is the only path that may stamp READY_FOR_PUBLISH / authorize YouTube.
 *
 * Authorize only when every current IMAGE is real provenance:
 *   GENERATED (ComfyUI or library HIT of a previously generated frame)
 *   STOCK / UPLOADED
 * AND Visual QA did not REJECT the frame (when metadata.visualQa is present).
 *
 * Mock color-bars (`mock_visual`, source MOCK, license MOCK) → HOLD_FOR_REVIEW.
 * Never authorize "it looks like a Short" if the pixels were a fallback.
 */

import { parseAssetVisualQa } from './visual/VisualQaService.js'

export type PublishingVerdict = 'AUTHORIZE_PUBLISH' | 'HOLD_FOR_REVIEW' | 'REJECT'

export type VisualPublishReview = {
  authorized: boolean
  verdict: PublishingVerdict
  findings: string[]
  mockVisualCount: number
  generatedVisualCount: number
  sceneCount: number
  qaRejectedCount: number
}

const PUBLISHABLE_SOURCES = new Set(['GENERATED', 'STOCK', 'UPLOADED'])
const MOCK_PROVIDERS = new Set(['mock_visual'])

export function isCurrentAsset(asset: Record<string, unknown>): boolean {
  const flag = asset.is_current
  return flag === 1 || flag === true || flag === '1'
}

export function reviewVisualPublishability(
  assets: Array<Record<string, unknown>>,
): VisualPublishReview {
  const images = assets.filter((a) => String(a.type || '').toUpperCase() === 'IMAGE' && isCurrentAsset(a))
  const findings: string[] = []
  let mockVisualCount = 0
  let generatedVisualCount = 0
  let qaRejectedCount = 0

  if (!images.length) {
    findings.push('visuals_missing')
  }

  for (const img of images) {
    const source = String(img.source_type || img.sourceType || '').toUpperCase()
    const provider = String(img.provider || '')
    const license = String(img.license || '').toUpperCase()
    const key = String(img.asset_key || img.assetKey || provider || 'image')

    const isMock =
      MOCK_PROVIDERS.has(provider) || source === 'MOCK' || license === 'MOCK'

    if (isMock) {
      mockVisualCount += 1
      findings.push(`visuals_mock_not_publishable:${key}`)
      continue
    }

    if (!PUBLISHABLE_SOURCES.has(source)) {
      findings.push(`visuals_source_not_publishable:${source || 'unknown'}:${key}`)
      continue
    }

    const qa = parseAssetVisualQa(img.metadata)
    if (qa && (!qa.passed || qa.status === 'REJECTED')) {
      qaRejectedCount += 1
      findings.push(`visuals_qa_rejected:${key}:${qa.findings[0] || 'score'}`)
      continue
    }

    generatedVisualCount += 1
  }

  if (images.length && mockVisualCount === images.length) {
    // Entire board is fallback — still a hold, never a hard REJECT (MP4 is valid).
    findings.push('visuals_all_mock_hold_publish')
  }

  const unique = [...new Set(findings)]
  if (unique.length) {
    return {
      authorized: false,
      verdict: 'HOLD_FOR_REVIEW',
      findings: unique,
      mockVisualCount,
      generatedVisualCount,
      sceneCount: images.length,
      qaRejectedCount,
    }
  }

  return {
    authorized: true,
    verdict: 'AUTHORIZE_PUBLISH',
    findings: [],
    mockVisualCount: 0,
    generatedVisualCount,
    sceneCount: images.length,
    qaRejectedCount: 0,
  }
}
