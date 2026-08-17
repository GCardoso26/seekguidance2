export async function mockFetchMetrics(platformPostId: string) {
  // Deterministic-ish pseudo metrics from id hash
  let hash = 0
  for (let i = 0; i < platformPostId.length; i++) hash = (hash + platformPostId.charCodeAt(i) * (i + 1)) % 997
  const views = 800 + (hash % 12000)
  const retention = 25 + (hash % 55)
  return {
    reality: 'MOCK' as const,
    views,
    likes: Math.floor(views * 0.04),
    comments: Math.floor(views * 0.005),
    shares: Math.floor(views * 0.003),
    saves: Math.floor(views * 0.008),
    watch_time_sec: views * 18,
    retention_pct: retention,
    ctr: Number((1.2 + (hash % 40) / 10).toFixed(2)),
    clicks: Math.floor(views * 0.015),
    followers_gained: Math.floor(views * 0.001),
  }
}

export function classifyPerformance(views: number, retention: number, baselineViews: number) {
  const score = views / Math.max(baselineViews, 1) * 0.6 + retention / 100 * 0.4
  if (score >= 1.4 && retention >= 45) return { class: 'WINNER' as const, score }
  if (score >= 1.1) return { class: 'PROMISING' as const, score }
  if (score <= 0.45) return { class: 'LOSER' as const, score }
  return { class: 'NORMAL' as const, score }
}
