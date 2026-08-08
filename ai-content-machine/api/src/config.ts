import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')

export type AutomationMode = 'mock' | 'production'
export type Reality = 'REAL' | 'MOCK' | 'SIMULATED' | 'FAILED' | 'PENDING'

function env(name: string, fallback = ''): string {
  return process.env[name] ?? fallback
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
