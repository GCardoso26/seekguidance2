import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')

export type AutomationMode = 'mock' | 'production'
export type Reality = 'REAL' | 'MOCK' | 'SIMULATED' | 'FAILED' | 'PENDING'

function env(name: string, fallback = ''): string {
  return process.env[name] ?? fallback
}

function envBool(name: string, fallback: boolean): boolean {
  const v = process.env[name]
  if (v === undefined || v === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())
}

export const config = {
  port: Number(env('PORT', '8787')),
  root,
  dbPath: env('CWM_DB_PATH', path.join(root, 'data', 'cwm.sqlite')),
  automationMode: (env('AUTOMATION_MODE', 'mock') as AutomationMode),
  n8nBaseUrl: env('N8N_BASE_URL', ''),
  n8nApiKey: env('N8N_API_KEY', ''),
  n8nWebhookSecret: env('N8N_WEBHOOK_SECRET', 'dev-webhook-secret-change-me'),
  publicApiBase: env('CWM_API_BASE', 'http://127.0.0.1:8787'),

  /** Phase 5 — publishing safety (real path only) */
  dryRun: envBool('DRY_RUN', true),
  publishingEnabled: envBool('PUBLISHING_ENABLED', false),
  youtubePublishingEnabled: envBool('YOUTUBE_PUBLISHING_ENABLED', false),
  globalPublishingKillSwitch: envBool('GLOBAL_PUBLISHING_KILL_SWITCH', true),
  maxPublicationsPerDay: Number(env('MAX_PUBLICATIONS_PER_DAY', '1')),

  /** YouTube OAuth — never log these */
  youtubeClientId: env('YOUTUBE_CLIENT_ID', ''),
  youtubeClientSecret: env('YOUTUBE_CLIENT_SECRET', ''),
  youtubeRedirectUri: env(
    'YOUTUBE_REDIRECT_URI',
    `${env('CWM_API_BASE', 'http://127.0.0.1:8787')}/api/publishing/connections/youtube/callback`,
  ),
  /** 32+ char secret for token encryption at rest */
  credentialsEncryptionKey: env('CWM_CREDENTIALS_ENCRYPTION_KEY', ''),

  /** Fallback workspace for n8n crons that omit workspaceId */
  defaultWorkspaceId: env('CWM_DEFAULT_WORKSPACE_ID', ''),
}

export function systemReady(): { ok: boolean; reason?: string } {
  if (config.automationMode === 'mock') {
    return { ok: true }
  }
  if (!config.n8nBaseUrl || !config.n8nApiKey) {
    return { ok: false, reason: 'SYSTEM_NOT_READY: missing N8N_BASE_URL or N8N_API_KEY' }
  }
  if (!config.n8nWebhookSecret || config.n8nWebhookSecret.includes('change-me')) {
    return { ok: false, reason: 'SYSTEM_NOT_READY: insecure N8N_WEBHOOK_SECRET' }
  }
  return { ok: true }
}
