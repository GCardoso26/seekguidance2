import { liveSafetyFlags, safetySnapshot } from '../publishing/PublishingSafety.js'

/** Safe defaults after any controlled publish window. */
export const SAFE_PUBLISHING_DEFAULTS = {
  GLOBAL_PUBLISHING_KILL_SWITCH: 'true',
  PUBLISHING_ENABLED: 'false',
  YOUTUBE_PUBLISHING_ENABLED: 'false',
  DRY_RUN: 'true',
  MAX_PUBLICATIONS_PER_DAY: '1',
} as const

export function restoreSafetyDefaults() {
  for (const [key, value] of Object.entries(SAFE_PUBLISHING_DEFAULTS)) {
    process.env[key] = value
  }
  return {
    ok: true,
    restored: { ...SAFE_PUBLISHING_DEFAULTS },
    flags: liveSafetyFlags(),
    snapshot: safetySnapshot(),
  }
}

/**
 * Opens a short controlled publish window. Daily limit stays at 1 by default.
 * Caller must restore defaults immediately after the experiment.
 */
export function openPublishWindow(input?: { maxPublicationsPerDay?: number }) {
  const max = Math.max(1, Number(input?.maxPublicationsPerDay ?? 1))
  process.env.GLOBAL_PUBLISHING_KILL_SWITCH = 'false'
  process.env.PUBLISHING_ENABLED = 'true'
  process.env.YOUTUBE_PUBLISHING_ENABLED = 'true'
  process.env.DRY_RUN = 'false'
  process.env.MAX_PUBLICATIONS_PER_DAY = String(max)
  return {
    ok: true,
    warning: 'PUBLISH_WINDOW_OPEN — restore defaults immediately after publish',
    flags: liveSafetyFlags(),
    snapshot: safetySnapshot(),
  }
}

export function isSafetyDefaultState() {
  const f = liveSafetyFlags()
  return (
    f.globalPublishingKillSwitch === true &&
    f.publishingEnabled === false &&
    f.youtubePublishingEnabled === false &&
    f.dryRun === true &&
    f.maxPublicationsPerDay === 1
  )
}
