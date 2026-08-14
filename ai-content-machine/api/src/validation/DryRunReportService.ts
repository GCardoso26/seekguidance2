import fs from 'node:fs'
import { getDb } from '../db/client.js'
import { publishingService } from '../publishing/PublishingService.js'
import { buildPublicationMetadata } from '../publishing/PublicationMetadataBuilder.js'
import { resolvePlatform } from '../scriptFactory/PlatformProfiles.js'
import { youtubePublisher } from '../publishing/youtube/YouTubePublisher.js'
import { liveSafetyFlags } from '../publishing/PublishingSafety.js'

export type YouTubePrePublishReport = {
  reportType: 'YouTube Pre-Publish Report'
  wouldUpload: false
  contentId: string
  workspaceId: string
  productionRunId: string | null
  platform: string
  publicationVersion: number
  title: string
  description: string
  thumbnail: string | null
  video: string | null
  durationSec: number | null
  format: string
  metadata: Record<string, unknown>
  visibility: string
  scheduledTime: string | null
  validation: { ok: boolean; issues: string[] }
  packageOk: boolean
  safetyFlags: ReturnType<typeof liveSafetyFlags>
  generatedAt: string
}

/**
 * Mandatory dry-run report before first real publish. Never uploads.
 */
export class DryRunReportService {
  async build(input: {
    workspaceId: string
    contentId: string
    platform?: string
    scheduledAt?: string | null
    publicationVersion?: number
  }): Promise<YouTubePrePublishReport> {
    const platform = resolvePlatform(input.platform || 'YOUTUBE_SHORT')
    const validation = publishingService.validateContentPackage(input.contentId, input.workspaceId)
    const metadata = buildPublicationMetadata(input.contentId, input.scheduledAt, platform)

    let durationSec: number | null = null
    const content = getDb()
      .prepare(`SELECT script_id FROM contents WHERE id=? AND workspace_id=?`)
      .get(input.contentId, input.workspaceId) as { script_id: string | null } | undefined
    if (content?.script_id) {
      const script = getDb()
        .prepare(`SELECT visual_brief FROM scripts WHERE id=?`)
        .get(content.script_id) as { visual_brief: string } | undefined
      try {
        const brief = JSON.parse(script?.visual_brief || '{}') as { durationSec?: number }
        durationSec = brief.durationSec ?? null
      } catch {
        durationSec = null
      }
    }

    const videoUri = validation.videoUri || metadata.video || ''
    const thumbnailUri = validation.thumbnailUri || metadata.thumbnail || ''

    const prepared = await youtubePublisher.prepareDryRun({
      workspaceId: input.workspaceId,
      contentId: input.contentId,
      publicationId: 'dry-run-report',
      platform,
      metadata,
      videoUri,
      thumbnailUri,
      scheduledAt: input.scheduledAt,
    })

    const videoExists = Boolean(videoUri && fs.existsSync(videoUri))

    return {
      reportType: 'YouTube Pre-Publish Report',
      wouldUpload: false,
      contentId: input.contentId,
      workspaceId: input.workspaceId,
      productionRunId: validation.productionRunId ?? null,
      platform,
      publicationVersion: input.publicationVersion ?? 1,
      title: String(metadata.title || ''),
      description: String(metadata.description || ''),
      thumbnail: thumbnailUri || null,
      video: videoUri || null,
      durationSec,
      format: platform,
      metadata: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        language: metadata.language,
        caption: metadata.caption,
        fileSize: prepared.fileSize,
        videoExists,
      },
      visibility: 'private_or_unlisted_first_experiment',
      scheduledTime: input.scheduledAt || null,
      validation: {
        ok: validation.ok && prepared.validation.ok,
        issues: [...validation.issues, ...(prepared.validation.issues || [])],
      },
      packageOk: validation.ok,
      safetyFlags: liveSafetyFlags(),
      generatedAt: new Date().toISOString(),
    }
  }
}

export const dryRunReportService = new DryRunReportService()
