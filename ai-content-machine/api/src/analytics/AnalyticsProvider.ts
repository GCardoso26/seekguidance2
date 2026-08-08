import type { CanonicalMetrics } from '../publishing/types.js'

export type AnalyticsFetchInput = {
  externalId: string
  platform: string
  workspaceId: string
  accessToken?: string
}

export type AnalyticsFetchResult = {
  metrics: CanonicalMetrics
  raw: Record<string, unknown>
  source: 'MOCK' | 'YOUTUBE' | 'TIKTOK' | 'INSTAGRAM' | 'PINTEREST'
  status: 'WAITING_FOR_METRICS' | 'TRACKING' | 'COMPLETE' | 'FAILED'
}

export interface AnalyticsProvider {
  name: string
  status(): 'READY' | 'NOT_CONFIGURED' | 'ERROR'
  fetch(input: AnalyticsFetchInput): Promise<AnalyticsFetchResult>
}
