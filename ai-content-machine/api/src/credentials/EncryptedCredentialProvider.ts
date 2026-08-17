import { getDb, nowIso } from '../db/client.js'
import { decryptSecret } from './crypto.js'
import type { ConnectionStatus, CredentialProvider, PlatformCredentials } from './CredentialProvider.js'

/**
 * Loads workspace-scoped encrypted tokens from platform_connections.
 * Prepared for production; requires CWM_CREDENTIALS_ENCRYPTION_KEY.
 */
export class EncryptedCredentialProvider implements CredentialProvider {
  async get(platform: string, workspaceId: string): Promise<PlatformCredentials | null> {
    const key = normalizePlatform(platform)
    const row = getDb()
      .prepare(`SELECT * FROM platform_connections WHERE workspace_id = ? AND platform = ?`)
      .get(workspaceId, key) as
      | {
          status: ConnectionStatus
          access_token_enc: string | null
          refresh_token_enc: string | null
          token_expires_at: string | null
          account_label: string | null
          external_account_id: string | null
          scopes: string
        }
      | undefined
    if (!row || !row.access_token_enc) return null
    if (row.status === 'NOT_CONNECTED' || row.status === 'INVALID') return null

    const accessToken = decryptSecret(row.access_token_enc)
    if (!accessToken) return null
    const refreshToken = row.refresh_token_enc ? decryptSecret(row.refresh_token_enc) : null

    let status = row.status
    if (row.token_expires_at && new Date(row.token_expires_at).getTime() < Date.now()) {
      status = refreshToken ? 'EXPIRED' : 'REQUIRES_REAUTH'
    }

    return {
      platform: key,
      workspaceId,
      accessToken,
      refreshToken: refreshToken || undefined,
      expiresAt: row.token_expires_at,
      accountLabel: row.account_label || undefined,
      externalAccountId: row.external_account_id || undefined,
      scopes: (() => {
        try {
          return JSON.parse(row.scopes || '[]') as string[]
        } catch {
          return []
        }
      })(),
      status,
    }
  }

  async status(platform: string, workspaceId: string): Promise<ConnectionStatus> {
    const row = getDb()
      .prepare(`SELECT status, token_expires_at, refresh_token_enc FROM platform_connections WHERE workspace_id=? AND platform=?`)
      .get(workspaceId, normalizePlatform(platform)) as
      | { status: ConnectionStatus; token_expires_at: string | null; refresh_token_enc: string | null }
      | undefined
    if (!row) return 'NOT_CONNECTED'
    if (row.token_expires_at && new Date(row.token_expires_at).getTime() < Date.now()) {
      return row.refresh_token_enc ? 'EXPIRED' : 'REQUIRES_REAUTH'
    }
    return row.status
  }

  markStatus(workspaceId: string, platform: string, status: ConnectionStatus) {
    getDb()
      .prepare(`UPDATE platform_connections SET status=?, updated_at=? WHERE workspace_id=? AND platform=?`)
      .run(status, nowIso(), workspaceId, normalizePlatform(platform))
  }
}

function normalizePlatform(platform: string): string {
  const p = platform.toUpperCase()
  if (p.includes('YOUTUBE')) return 'YOUTUBE'
  if (p.includes('TIKTOK')) return 'TIKTOK'
  if (p.includes('INSTAGRAM')) return 'INSTAGRAM'
  if (p.includes('PINTEREST')) return 'PINTEREST'
  return p
}

export const encryptedCredentialProvider = new EncryptedCredentialProvider()
