import { config } from '../config.js'
import { credentialVault } from '../credentials/CredentialVault.js'
import { youtubeOAuthService } from '../publishing/youtube/YouTubeOAuthService.js'
import { normalizePlatformMetrics } from './MetricNormalizer.js'
import type { AnalyticsFetchInput, AnalyticsFetchResult, AnalyticsProvider } from './AnalyticsProvider.js'

export class YouTubeAnalyticsProvider implements AnalyticsProvider {
  name = 'youtube_analytics'

  status() {
    if (!config.youtubeClientId || !config.youtubeClientSecret) return 'NOT_CONFIGURED' as const
    return 'READY' as const
  }

  async fetch(input: AnalyticsFetchInput): Promise<AnalyticsFetchResult> {
    if (this.status() === 'NOT_CONFIGURED') {
      throw Object.assign(new Error('provider_not_configured:youtube_analytics'), {
        code: 'NOT_CONFIGURED',
      })
    }

    const refresh = await youtubeOAuthService.refreshIfNeeded(input.workspaceId)
    if (refresh === 'REQUIRES_REAUTH') {
      return {
        metrics: emptyMetrics(),
        raw: { error: 'requires_reauth' },
        source: 'YOUTUBE',
        status: 'FAILED',
      }
    }

    const creds = await credentialVault.get('YOUTUBE', input.workspaceId)
    const token = input.accessToken || creds?.accessToken
    if (!token) {
      throw Object.assign(new Error('provider_not_configured:youtube_analytics'), {
        code: 'NOT_CONFIGURED',
      })
    }

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${encodeURIComponent(input.externalId)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )

    if (res.status === 429) {
      throw new Error('RATE_LIMITED:youtube_analytics')
    }
    if (!res.ok) {
      throw new Error(`youtube_analytics_failed:${res.status}`)
    }

    const json = (await res.json()) as {
      items?: Array<{
        id: string
        statistics?: Record<string, string>
        contentDetails?: { duration?: string }
      }>
    }
    const item = json.items?.[0]
    if (!item) {
      return {
        metrics: emptyMetrics(),
        raw: { waiting: true, externalId: input.externalId },
        source: 'YOUTUBE',
        status: 'WAITING_FOR_METRICS',
      }
    }

    const stats = item.statistics || {}
    const raw = {
      viewCount: Number(stats.viewCount || 0),
      likeCount: Number(stats.likeCount || 0),
      commentCount: Number(stats.commentCount || 0),
      favoriteCount: Number(stats.favoriteCount || 0),
      duration: item.contentDetails?.duration,
      provider: this.name,
    }
    const metrics = normalizePlatformMetrics('YOUTUBE', {
      views: raw.viewCount,
      likes: raw.likeCount,
      comments: raw.commentCount,
      shares: 0,
      saves: raw.favoriteCount,
      ...raw,
    })

    const status = metrics.views > 0 ? 'TRACKING' : 'WAITING_FOR_METRICS'
    return { metrics, raw, source: 'YOUTUBE', status }
  }
}

function emptyMetrics() {
  return {
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    watchTime: 0,
    averageViewDuration: 0,
    completionRate: 0,
    followersGained: 0,
    clicks: 0,
    conversions: 0,
  }
}

export const youtubeAnalyticsProvider = new YouTubeAnalyticsProvider()
