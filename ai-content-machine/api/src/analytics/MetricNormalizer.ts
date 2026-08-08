import type { CanonicalMetrics } from '../publishing/types.js'

/** Normalize heterogeneous platform payloads into the CWM canonical model. */
export function normalizePlatformMetrics(
  platform: string,
  raw: Record<string, unknown>,
): CanonicalMetrics {
  const num = (...keys: string[]) => {
    for (const k of keys) {
      const v = raw[k]
      if (typeof v === 'number' && !Number.isNaN(v)) return v
      if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v)
    }
    return 0
  }

  const p = platform.toUpperCase()
  if (p.includes('YOUTUBE')) {
    return {
      views: num('views', 'viewCount'),
      likes: num('likes', 'likeCount'),
      comments: num('comments', 'commentCount'),
      shares: num('shares'),
      saves: num('saves'),
      watchTime: num('watchTime', 'watch_time', 'estimatedMinutesWatched') * (raw.estimatedMinutesWatched ? 60 : 1),
      averageViewDuration: num('averageViewDuration', 'average_view_duration'),
      completionRate: num('completionRate', 'completion_rate', 'averageViewPercentage') / (raw.averageViewPercentage ? 100 : 1),
      followersGained: num('followersGained', 'subscribersGained', 'followers_gained'),
      clicks: num('clicks', 'cardClicks'),
      conversions: num('conversions'),
    }
  }
  if (p.includes('TIKTOK')) {
    return {
      views: num('views', 'play_count', 'video_views'),
      likes: num('likes', 'digg_count'),
      comments: num('comments', 'comment_count'),
      shares: num('shares', 'share_count'),
      saves: num('saves', 'collect_count'),
      watchTime: num('watchTime', 'total_play_time'),
      averageViewDuration: num('averageViewDuration', 'avg_watch_time'),
      completionRate: num('completionRate', 'completion_rate', 'full_video_watched_rate'),
      followersGained: num('followersGained', 'followers_gained'),
      clicks: num('clicks', 'link_clicks'),
      conversions: num('conversions'),
    }
  }
  if (p.includes('INSTAGRAM') || p.includes('REEL')) {
    return {
      views: num('views', 'plays', 'impressions'),
      likes: num('likes'),
      comments: num('comments'),
      shares: num('shares', 'shares_count'),
      saves: num('saves', 'saved'),
      watchTime: num('watchTime', 'total_watch_time'),
      averageViewDuration: num('averageViewDuration', 'avg_watch_time'),
      completionRate: num('completionRate', 'completion_rate'),
      followersGained: num('followersGained', 'follows'),
      clicks: num('clicks', 'profile_visits'),
      conversions: num('conversions'),
    }
  }
  // Pinterest + default
  return {
    views: num('views', 'impressions', 'pin_clicks'),
    likes: num('likes', 'reactions'),
    comments: num('comments'),
    shares: num('shares', 'repins', 'saves'),
    saves: num('saves', 'repins'),
    watchTime: num('watchTime'),
    averageViewDuration: num('averageViewDuration'),
    completionRate: num('completionRate', 'completion_rate'),
    followersGained: num('followersGained'),
    clicks: num('clicks', 'outbound_clicks'),
    conversions: num('conversions'),
  }
}
