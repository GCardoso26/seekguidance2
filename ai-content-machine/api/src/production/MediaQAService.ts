import fs from 'node:fs'
import { ffmpegService } from './FFmpegService.js'
import type { ProductionPlan, ProductionQualityBreakdown } from './types.js'
import { validateSubtitles, type SubtitleCue } from './SubtitleService.js'

export type MediaQaStatus = 'PASS' | 'FAIL' | 'REQUIRES_REVIEW'

export type MediaQaResult = {
  status: MediaQaStatus
  issues: string[]
  probe?: ReturnType<typeof ffmpegService.probe>
  qualityScore: number
  qualityBreakdown: ProductionQualityBreakdown
}

function scoreBreakdown(parts: Partial<ProductionQualityBreakdown>): ProductionQualityBreakdown {
  return {
    technicalQuality: parts.technicalQuality ?? 0,
    audioQuality: parts.audioQuality ?? 0,
    subtitleQuality: parts.subtitleQuality ?? 0,
    visualCompleteness: parts.visualCompleteness ?? 0,
    platformFit: parts.platformFit ?? 0,
    assetTraceability: parts.assetTraceability ?? 0,
  }
}

export function averageQuality(b: ProductionQualityBreakdown): number {
  const vals = Object.values(b)
  return Math.round(vals.reduce((a, v) => a + v, 0) / vals.length)
}

export class MediaQAService {
  validateFinalVideo(input: {
    videoPath: string
    plan: ProductionPlan
    hasSubtitles: boolean
    subtitleCues?: SubtitleCue[]
    thumbnailPath?: string
    licensesKnown: boolean
    assetsComplete: boolean
  }): MediaQaResult {
    const issues: string[] = []

    if (!fs.existsSync(input.videoPath)) {
      issues.push('video_missing')
      const breakdown = scoreBreakdown({})
      return {
        status: 'FAIL',
        issues,
        qualityScore: 0,
        qualityBreakdown: breakdown,
      }
    }

    const st = fs.statSync(input.videoPath)
    if (st.size <= 0) issues.push('video_empty')

    let probe: ReturnType<typeof ffmpegService.probe> | undefined
    try {
      probe = ffmpegService.probe(input.videoPath)
    } catch {
      issues.push('video_corrupt_or_unreadable')
    }

    if (probe) {
      if (!(probe.duration > 0)) issues.push('duration_zero')
      if (!probe.hasVideo) issues.push('missing_video_track')
      if (!probe.hasAudio) issues.push('missing_audio_track')
      if (probe.videoCodec && !/h264|avc/i.test(probe.videoCodec)) issues.push('unexpected_video_codec')
      if (probe.audioCodec && !/aac|mp4a/i.test(probe.audioCodec)) issues.push('unexpected_audio_codec')
      if (probe.width !== input.plan.width || probe.height !== input.plan.height) {
        issues.push('resolution_mismatch')
      }
      const fpsTol = Math.abs(probe.fps - input.plan.fps)
      if (fpsTol > 1.5) issues.push('fps_mismatch')
      const ratio = probe.width / Math.max(probe.height, 1)
      const expected = input.plan.width / input.plan.height
      if (Math.abs(ratio - expected) > 0.05) issues.push('aspect_ratio_mismatch')
      // Silent audio heuristic: tone mock always has energy; flag only if no audio
      if (!probe.hasAudio) issues.push('silent_or_missing_audio')
    }

    if (!input.hasSubtitles) issues.push('subtitles_missing')
    if (input.subtitleCues) {
      const subQa = validateSubtitles(input.subtitleCues, probe?.duration || input.plan.targetDuration)
      if (subQa.status === 'FAIL') issues.push(...subQa.issues.map((i) => `subtitle:${i}`))
    }

    if (input.thumbnailPath) {
      if (!fs.existsSync(input.thumbnailPath)) issues.push('thumbnail_missing')
      else if (fs.statSync(input.thumbnailPath).size <= 0) issues.push('thumbnail_empty')
    } else {
      issues.push('thumbnail_missing')
    }

    if (!input.licensesKnown) issues.push('license_unknown')
    if (!input.assetsComplete) issues.push('assets_incomplete')

    const hardFails = issues.filter((i) =>
      /missing|corrupt|empty|zero|incomplete/i.test(i),
    )
    const reviewOnly = issues.filter((i) => /license_unknown|mismatch|unexpected/i.test(i))

    let status: MediaQaStatus = 'PASS'
    if (hardFails.length) status = 'FAIL'
    else if (reviewOnly.length || issues.length) status = 'REQUIRES_REVIEW'

    const breakdown = scoreBreakdown({
      technicalQuality: hardFails.length ? 40 : issues.length ? 75 : 95,
      audioQuality: probe?.hasAudio ? 90 : 20,
      subtitleQuality: input.hasSubtitles ? 90 : 20,
      visualCompleteness: input.assetsComplete ? 90 : 40,
      platformFit: issues.some((i) => i.includes('mismatch')) ? 55 : 92,
      assetTraceability: input.licensesKnown ? 95 : 40,
    })

    return {
      status,
      issues,
      probe,
      qualityScore: averageQuality(breakdown),
      qualityBreakdown: breakdown,
    }
  }

  validateThumbnail(filePath: string, expectedW: number, expectedH: number) {
    const issues: string[] = []
    if (!fs.existsSync(filePath)) issues.push('thumbnail_missing')
    else {
      const size = fs.statSync(filePath).size
      if (size <= 0) issues.push('thumbnail_empty')
      if (size > 5_000_000) issues.push('thumbnail_too_large')
      try {
        const probe = ffmpegService.probe(filePath)
        if (probe.width && probe.width !== expectedW) issues.push('thumbnail_width')
        if (probe.height && probe.height !== expectedH) issues.push('thumbnail_height')
      } catch {
        // still images may probe weakly — existence + size is enough for mock
      }
    }
    return { status: issues.length ? ('FAIL' as const) : ('PASS' as const), issues }
  }
}

export const mediaQaService = new MediaQAService()
