import { config } from '../config.js'
import { getDb } from '../db/client.js'

export type SafetyDecision = {
  allowReal: boolean
  dryRun: boolean
  reason?: string
  code?:
    | 'KILL_SWITCH'
    | 'PUBLISHING_DISABLED'
    | 'YOUTUBE_DISABLED'
    | 'DAILY_LIMIT'
    | 'NOT_APPROVED'
    | 'DRY_RUN'
    | 'MOCK_MODE'
    | 'OK'
}

function envBool(name: string, fallback: boolean): boolean {
  const v = process.env[name]
  if (v === undefined || v === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())
}

/** Live safety flags (env wins over boot-time config for testability). */
export function liveSafetyFlags() {
  return {
    automationMode: (process.env.AUTOMATION_MODE || config.automationMode) as 'mock' | 'production',
    dryRun: envBool('DRY_RUN', config.dryRun),
    publishingEnabled: envBool('PUBLISHING_ENABLED', config.publishingEnabled),
    youtubePublishingEnabled: envBool('YOUTUBE_PUBLISHING_ENABLED', config.youtubePublishingEnabled),
    globalPublishingKillSwitch: envBool(
      'GLOBAL_PUBLISHING_KILL_SWITCH',
      config.globalPublishingKillSwitch,
    ),
    maxPublicationsPerDay: Number(
      process.env.MAX_PUBLICATIONS_PER_DAY || config.maxPublicationsPerDay || 1,
    ),
  }
}

export function evaluatePublishingSafety(input: {
  workspaceId: string
  contentId: string
  platform: string
  forceReal?: boolean
}): SafetyDecision {
  const flags = liveSafetyFlags()

  // Mock automation mode always stays on mock path unless explicitly forcing real E2E
  if (flags.automationMode === 'mock' && !input.forceReal) {
    return { allowReal: false, dryRun: false, code: 'MOCK_MODE', reason: 'automation_mode_mock' }
  }

  if (flags.globalPublishingKillSwitch) {
    return {
      allowReal: false,
      dryRun: true,
      code: 'KILL_SWITCH',
      reason: 'GLOBAL_PUBLISHING_KILL_SWITCH',
    }
  }
  if (!flags.publishingEnabled) {
    return {
      allowReal: false,
      dryRun: true,
      code: 'PUBLISHING_DISABLED',
      reason: 'PUBLISHING_ENABLED=false',
    }
  }

  const platform = input.platform.toUpperCase()
  if (platform.includes('YOUTUBE') && !flags.youtubePublishingEnabled) {
    return {
      allowReal: false,
      dryRun: true,
      code: 'YOUTUBE_DISABLED',
      reason: 'YOUTUBE_PUBLISHING_ENABLED=false',
    }
  }

  const content = getDb()
    .prepare(`SELECT approved_for_publishing, status FROM contents WHERE id=? AND workspace_id=?`)
    .get(input.contentId, input.workspaceId) as
    | { approved_for_publishing: number; status: string }
    | undefined

  if (!content?.approved_for_publishing) {
    return {
      allowReal: false,
      dryRun: true,
      code: 'NOT_APPROVED',
      reason: 'approvedForPublishing=false',
    }
  }

  const day = new Date().toISOString().slice(0, 10)
  const publishedToday = getDb()
    .prepare(
      `SELECT COUNT(*) as c FROM publication_runs
       WHERE workspace_id=? AND publication_source='REAL' AND status='PUBLISHED'
         AND substr(published_at,1,10)=?`,
    )
    .get(input.workspaceId, day) as { c: number }

  if (publishedToday.c >= flags.maxPublicationsPerDay) {
    return {
      allowReal: false,
      dryRun: true,
      code: 'DAILY_LIMIT',
      reason: `maxPublicationsPerDay=${flags.maxPublicationsPerDay}`,
    }
  }

  if (flags.dryRun) {
    return { allowReal: false, dryRun: true, code: 'DRY_RUN', reason: 'DRY_RUN=true' }
  }

  return { allowReal: true, dryRun: false, code: 'OK' }
}

export function safetySnapshot() {
  const flags = liveSafetyFlags()
  return {
    ...flags,
    youtubeOAuthConfigured: Boolean(config.youtubeClientId && config.youtubeClientSecret),
  }
}
