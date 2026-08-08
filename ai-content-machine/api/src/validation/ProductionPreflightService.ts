import fs from 'node:fs'
import { config } from '../config.js'
import { getDb } from '../db/client.js'
import { encryptionReady } from '../credentials/crypto.js'
import { youtubeOAuthService } from '../publishing/youtube/YouTubeOAuthService.js'
import { youtubePublisher } from '../publishing/youtube/YouTubePublisher.js'
import { youtubeAnalyticsProvider } from '../analytics/YouTubeAnalyticsProvider.js'
import { publishingService } from '../publishing/PublishingService.js'
import { liveSafetyFlags, safetySnapshot } from '../publishing/PublishingSafety.js'
import { LocalFilesystemStorage } from '../production/storage/LocalFilesystemStorage.js'

export type CheckStatus = 'PASS' | 'FAIL' | 'WARN' | 'INFO'

export type PreflightCheck = {
  id: string
  label: string
  status: CheckStatus
  detail?: string
}

export type PreflightResult = {
  overall: 'READY' | 'NOT_READY'
  /** Infrastructure ready for a controlled experiment */
  infrastructureReady: boolean
  /** Safe posture (kill switch / dry-run) — different from ready-to-publish */
  safe: boolean
  readyToPublish: boolean
  checks: PreflightCheck[]
  safety: ReturnType<typeof safetySnapshot>
  flags: ReturnType<typeof liveSafetyFlags>
}

export class ProductionPreflightService {
  async run(input: { workspaceId: string; contentId?: string }): Promise<PreflightResult> {
    const checks: PreflightCheck[] = []
    const flags = liveSafetyFlags()
    const safety = safetySnapshot()

    // Database
    try {
      getDb().prepare(`SELECT 1 AS ok`).get()
      checks.push({ id: 'database', label: 'Database', status: 'PASS' })
    } catch (err) {
      checks.push({
        id: 'database',
        label: 'Database',
        status: 'FAIL',
        detail: err instanceof Error ? err.message : 'db_error',
      })
    }

    // Encryption (presence only — never echo key)
    checks.push({
      id: 'credential_encryption',
      label: 'Credential encryption',
      status: encryptionReady() ? 'PASS' : 'FAIL',
      detail: encryptionReady() ? 'key_configured' : 'CWM_CREDENTIALS_ENCRYPTION_KEY missing',
    })

    // YouTube OAuth client configured (no secret values)
    const oauthClient =
      Boolean(process.env.YOUTUBE_CLIENT_ID || config.youtubeClientId) &&
      Boolean(process.env.YOUTUBE_CLIENT_SECRET || config.youtubeClientSecret)
    checks.push({
      id: 'youtube_oauth_client',
      label: 'YouTube OAuth client',
      status: oauthClient ? 'PASS' : 'FAIL',
      detail: oauthClient ? 'client_id_and_secret_present' : 'YOUTUBE_CLIENT_ID/SECRET missing',
    })

    // Connection
    let connStatus = 'NOT_CONNECTED'
    try {
      const st = youtubeOAuthService.status(input.workspaceId)
      connStatus = st.status
      checks.push({
        id: 'youtube_connection',
        label: 'YouTube connection',
        status: st.status === 'CONNECTED' ? 'PASS' : 'FAIL',
        detail: st.status,
      })
    } catch {
      checks.push({
        id: 'youtube_connection',
        label: 'YouTube connection',
        status: 'FAIL',
        detail: 'status_error',
      })
    }

    // Content package (optional until contentId provided)
    if (input.contentId) {
      const pkg = publishingService.validateContentPackage(input.contentId, input.workspaceId)
      checks.push({
        id: 'content_package',
        label: 'Content package',
        status: pkg.ok ? 'PASS' : 'FAIL',
        detail: pkg.ok ? 'READY_FOR_PUBLISH' : pkg.issues.join(','),
      })
      const content = getDb()
        .prepare(`SELECT approved_for_publishing, approved_by FROM contents WHERE id=?`)
        .get(input.contentId) as
        | { approved_for_publishing: number; approved_by: string | null }
        | undefined
      checks.push({
        id: 'human_approval',
        label: 'Human approval',
        status: content?.approved_for_publishing ? 'PASS' : 'WARN',
        detail: content?.approved_for_publishing
          ? `approved_by=${content.approved_by || 'unknown'}`
          : 'approved_for_publishing=false',
      })
    } else {
      checks.push({
        id: 'content_package',
        label: 'Content package',
        status: 'WARN',
        detail: 'contentId not provided',
      })
    }

    // Storage
    try {
      const storage = new LocalFilesystemStorage()
      const probe = storage.root()
      const exists = fs.existsSync(probe)
      checks.push({
        id: 'storage',
        label: 'Storage',
        status: exists ? 'PASS' : 'FAIL',
        detail: exists ? 'local_filesystem_available' : 'media_root_missing',
      })
    } catch (err) {
      checks.push({
        id: 'storage',
        label: 'Storage',
        status: 'FAIL',
        detail: err instanceof Error ? err.message : 'storage_error',
      })
    }

    // Publishing / analytics providers (code readiness — not proven)
    checks.push({
      id: 'publishing_service',
      label: 'Publishing service',
      status: youtubePublisher.status() === 'READY' || youtubePublisher.status() === 'NOT_CONFIGURED'
        ? youtubePublisher.status() === 'READY'
          ? 'PASS'
          : 'FAIL'
        : 'FAIL',
      detail: `youtube=${youtubePublisher.status()}`,
    })
    checks.push({
      id: 'analytics_provider',
      label: 'Analytics provider',
      status: youtubeAnalyticsProvider.status() === 'READY' ? 'PASS' : 'FAIL',
      detail: `youtube=${youtubeAnalyticsProvider.status()}`,
    })

    // n8n connectivity (optional in mock)
    const n8nConfigured = Boolean(config.n8nBaseUrl && config.n8nApiKey)
    checks.push({
      id: 'n8n',
      label: 'n8n connectivity',
      status: n8nConfigured ? 'PASS' : 'WARN',
      detail: n8nConfigured ? 'configured' : 'optional_in_mock_not_configured',
    })

    // Safety posture — INFO/WARN, not infrastructure FAIL
    checks.push({
      id: 'dry_run',
      label: 'Dry Run',
      status: flags.dryRun ? 'WARN' : 'INFO',
      detail: flags.dryRun ? 'DRY_RUN=true (safe; blocks real upload)' : 'DRY_RUN=false',
    })
    checks.push({
      id: 'publishing_enabled',
      label: 'Publishing disabled',
      status: flags.publishingEnabled ? 'INFO' : 'WARN',
      detail: flags.publishingEnabled ? 'PUBLISHING_ENABLED=true' : 'PUBLISHING_ENABLED=false (safe)',
    })
    checks.push({
      id: 'kill_switch',
      label: 'Kill switch enabled',
      status: flags.globalPublishingKillSwitch ? 'WARN' : 'INFO',
      detail: flags.globalPublishingKillSwitch
        ? 'GLOBAL_PUBLISHING_KILL_SWITCH=true (safe)'
        : 'kill switch OFF — publish window open',
    })
    checks.push({
      id: 'daily_limit',
      label: 'Daily limit',
      status: flags.maxPublicationsPerDay <= 1 ? 'PASS' : 'WARN',
      detail: `MAX_PUBLICATIONS_PER_DAY=${flags.maxPublicationsPerDay}`,
    })

    const infraIds = new Set([
      'database',
      'credential_encryption',
      'youtube_oauth_client',
      'youtube_connection',
      'storage',
      'publishing_service',
      'analytics_provider',
    ])
    if (input.contentId) infraIds.add('content_package')

    const infrastructureReady = checks
      .filter((c) => infraIds.has(c.id))
      .every((c) => c.status === 'PASS')

    const safe =
      flags.globalPublishingKillSwitch === true ||
      flags.publishingEnabled === false ||
      flags.dryRun === true

    const readyToPublish =
      infrastructureReady &&
      !flags.globalPublishingKillSwitch &&
      flags.publishingEnabled &&
      flags.youtubePublishingEnabled &&
      !flags.dryRun &&
      connStatus === 'CONNECTED' &&
      (!input.contentId ||
        checks.find((c) => c.id === 'human_approval')?.status === 'PASS')

    return {
      overall: infrastructureReady ? 'READY' : 'NOT_READY',
      infrastructureReady,
      safe,
      readyToPublish,
      checks,
      safety,
      flags,
    }
  }
}

export const productionPreflightService = new ProductionPreflightService()
