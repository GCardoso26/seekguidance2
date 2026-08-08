import fs from 'node:fs'
import type { PlatformPublisher, PublishInput } from '../PlatformPublisher.js'
import type { PublicationResult, ValidationResult } from '../types.js'
import { credentialVault } from '../../credentials/CredentialVault.js'
import { youtubeOAuthService } from './YouTubeOAuthService.js'
import { config } from '../../config.js'

export type UploadOutcome = 'SUCCESS' | 'FAILED' | 'UNKNOWN' | 'DRY_RUN' | 'RATE_LIMITED'

/**
 * Real YouTube publisher. Never claims SUCCESS without API confirmation.
 * When credentials/flags missing → NOT_CONFIGURED (does not fake success).
 */
export class YouTubePublisher implements PlatformPublisher {
  name = 'youtube'

  status() {
    if (!config.youtubeClientId || !config.youtubeClientSecret) return 'NOT_CONFIGURED' as const
    return 'READY' as const
  }

  async validate(input: PublishInput): Promise<ValidationResult> {
    const issues: string[] = []
    if (!input.metadata.title?.trim()) issues.push('missing_title')
    if (!input.videoUri || !fs.existsSync(input.videoUri)) issues.push('missing_video')
    if (!input.thumbnailUri || !fs.existsSync(input.thumbnailUri)) issues.push('missing_thumbnail')
    const creds = await credentialVault.get('YOUTUBE', input.workspaceId)
    if (!creds) issues.push('youtube_not_connected')
    else if (creds.status === 'REQUIRES_REAUTH' || creds.status === 'EXPIRED') {
      issues.push('youtube_requires_reauth')
    }
    return { ok: issues.length === 0, issues, requiresReview: issues.length > 0 }
  }

  /**
   * Dry-run: validate + authenticate + prepare, no upload.
   */
  async prepareDryRun(input: PublishInput) {
    const validation = await this.validate(input)
    const st = fs.existsSync(input.videoUri || '') ? fs.statSync(input.videoUri!) : null
    return {
      wouldPublish: validation.ok,
      wouldUpload: false as const,
      contentId: input.contentId,
      platform: 'YOUTUBE',
      title: input.metadata.title,
      description: input.metadata.description,
      durationHint: input.metadata.description?.slice(0, 40),
      file: input.videoUri,
      fileSize: st?.size ?? 0,
      thumbnail: input.thumbnailUri,
      visibility: 'private_or_unlisted_first_experiment',
      scheduledTime: input.scheduledAt ?? null,
      metadata: {
        title: input.metadata.title,
        description: input.metadata.description,
        tags: input.metadata.tags,
        language: input.metadata.language,
        caption: input.metadata.caption,
      },
      validation,
    }
  }

  async publish(input: PublishInput): Promise<PublicationResult & { uploadOutcome?: UploadOutcome }> {
    const validation = await this.validate(input)
    if (!validation.ok) {
      return {
        ok: false,
        reality: 'FAILED',
        error: `validation_failed:${validation.issues.join(',')}`,
        uploadOutcome: 'FAILED',
      }
    }

    const refresh = await youtubeOAuthService.refreshIfNeeded(input.workspaceId)
    if (refresh === 'REQUIRES_REAUTH') {
      return {
        ok: false,
        reality: 'FAILED',
        error: 'youtube_requires_reauth',
        uploadOutcome: 'FAILED',
      }
    }

    const creds = await credentialVault.get('YOUTUBE', input.workspaceId)
    if (!creds?.accessToken) {
      return {
        ok: false,
        reality: 'FAILED',
        error: 'provider_not_configured:youtube',
        uploadOutcome: 'FAILED',
      }
    }

    // Prefer resumable upload; treat ambiguous network outcomes as UNKNOWN
    try {
      const uploaded = await this.resumableUpload(input, creds.accessToken)
      return uploaded
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.startsWith('RATE_LIMITED')) {
        return { ok: false, reality: 'FAILED', error: message, uploadOutcome: 'RATE_LIMITED' }
      }
      if (
        /timeout|network|ECONNRESET|ETIMEDOUT|fetch failed|5\d\d|UNKNOWN/i.test(message)
      ) {
        return {
          ok: false,
          reality: 'FAILED',
          error: message,
          uploadOutcome: 'UNKNOWN',
        }
      }
      return { ok: false, reality: 'FAILED', error: message, uploadOutcome: 'FAILED' }
    }
  }

  async schedule(input: PublishInput): Promise<PublicationResult & { uploadOutcome?: UploadOutcome }> {
    // YouTube schedule via status=private + publishAt — same upload path for MVP
    return this.publish(input)
  }

  async getPublication(externalId: string, workspaceId: string): Promise<{
    found: boolean
    externalId?: string
    externalUrl?: string
    status?: string
  }> {
    const refresh = await youtubeOAuthService.refreshIfNeeded(workspaceId)
    if (refresh !== 'ok') return { found: false }
    const creds = await credentialVault.get('YOUTUBE', workspaceId)
    if (!creds?.accessToken) return { found: false }
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=status,snippet&id=${encodeURIComponent(externalId)}`,
        { headers: { Authorization: `Bearer ${creds.accessToken}` } },
      )
      if (!res.ok) return { found: false }
      const json = (await res.json()) as { items?: Array<{ id: string; status?: { uploadStatus?: string } }> }
      const item = json.items?.[0]
      if (!item) return { found: false }
      return {
        found: true,
        externalId: item.id,
        externalUrl: `https://www.youtube.com/watch?v=${item.id}`,
        status: item.status?.uploadStatus || 'unknown',
      }
    } catch {
      return { found: false }
    }
  }

  private async resumableUpload(
    input: PublishInput,
    accessToken: string,
  ): Promise<PublicationResult & { uploadOutcome: UploadOutcome }> {
    const meta = {
      snippet: {
        title: input.metadata.title.slice(0, 100),
        description: input.metadata.description,
        tags: input.metadata.tags?.slice(0, 15),
        categoryId: '27',
        defaultLanguage: input.metadata.language || 'pt-BR',
      },
      status: {
        privacyStatus: 'unlisted',
        selfDeclaredMadeForKids: false,
      },
    }

    const init = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': 'video/mp4',
        },
        body: JSON.stringify(meta),
      },
    )

    if (init.status === 429) {
      throw new Error('RATE_LIMITED:youtube_quota')
    }
    if (init.status >= 500) {
      throw new Error(`UNKNOWN:init_${init.status}`)
    }
    if (!init.ok) {
      const text = await init.text()
      throw new Error(`youtube_init_failed:${init.status}:${text.slice(0, 120)}`)
    }

    const sessionUrl = init.headers.get('location')
    if (!sessionUrl) throw new Error('UNKNOWN:missing_upload_session')

    const fileBuf = fs.readFileSync(input.videoUri!)
    const upload = await fetch(sessionUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'video/mp4',
        'Content-Length': String(fileBuf.length),
      },
      body: fileBuf,
    })

    if (upload.status === 429) throw new Error('RATE_LIMITED:youtube_quota')
    if (upload.status >= 500 || upload.status === 0) {
      throw new Error(`UNKNOWN:upload_${upload.status}`)
    }
    if (!upload.ok) {
      const text = await upload.text()
      throw new Error(`youtube_upload_failed:${upload.status}:${text.slice(0, 120)}`)
    }

    const json = (await upload.json()) as { id?: string }
    if (!json.id) throw new Error('UNKNOWN:missing_video_id')

    return {
      ok: true,
      reality: 'PENDING', // confirmed by YouTube id — marked REAL by PublishingService
      externalId: json.id,
      externalUrl: `https://www.youtube.com/watch?v=${json.id}`,
      publishedAt: new Date().toISOString(),
      confirmation: 'youtube_upload_confirmed',
      uploadOutcome: 'SUCCESS',
    }
  }
}

export const youtubePublisher = new YouTubePublisher()
