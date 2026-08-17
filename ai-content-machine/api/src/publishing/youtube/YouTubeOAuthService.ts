import { randomBytes } from 'node:crypto'
import { config } from '../../config.js'
import { getDb, uid, nowIso } from '../../db/client.js'
import { emitEvent } from '../../services/EventService.js'
import { encryptSecret, encryptionReady } from '../../credentials/crypto.js'
import { encryptedCredentialProvider } from '../../credentials/EncryptedCredentialProvider.js'

const YT_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth'
const YT_TOKEN = 'https://oauth2.googleapis.com/token'
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
].join(' ')

export class YouTubeOAuthService {
  configured() {
    return Boolean(config.youtubeClientId && config.youtubeClientSecret)
  }

  start(workspaceId: string) {
    if (!this.configured()) {
      throw Object.assign(new Error('youtube_oauth_not_configured'), { code: 'NOT_CONFIGURED' })
    }
    if (!encryptionReady()) {
      throw Object.assign(new Error('credentials_encryption_key_required'), { code: 'NOT_CONFIGURED' })
    }
    const state = randomBytes(24).toString('hex')
    const expires = new Date(Date.now() + 30 * 60_000).toISOString()
    getDb()
      .prepare(
        `INSERT INTO oauth_states (state, workspace_id, platform, created_at, expires_at) VALUES (?, ?, 'YOUTUBE', ?, ?)`,
      )
      .run(state, workspaceId, nowIso(), expires)

    const url = new URL(YT_AUTH)
    url.searchParams.set('client_id', config.youtubeClientId)
    url.searchParams.set('redirect_uri', config.youtubeRedirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', SCOPES)
    url.searchParams.set('access_type', 'offline')
    url.searchParams.set('prompt', 'consent')
    url.searchParams.set('state', state)

    emitEvent({
      workspaceId,
      eventType: 'youtube.connection_created',
      entityType: 'workspace',
      entityId: workspaceId,
      reality: 'PENDING',
      payload: { stage: 'authorize_started' },
    })

    return { authorizeUrl: url.toString(), state }
  }

  async callback(input: { code: string; state: string }) {
    const db = getDb()
    const st = db.prepare(`SELECT * FROM oauth_states WHERE state = ?`).get(input.state) as
      | { workspace_id: string; platform: string; expires_at: string }
      | undefined
    if (!st) throw new Error('invalid_oauth_state')
    if (new Date(st.expires_at).getTime() < Date.now()) {
      db.prepare(`DELETE FROM oauth_states WHERE state = ?`).run(input.state)
      throw new Error('oauth_state_expired')
    }
    db.prepare(`DELETE FROM oauth_states WHERE state = ?`).run(input.state)

    const body = new URLSearchParams({
      code: input.code,
      client_id: config.youtubeClientId,
      client_secret: config.youtubeClientSecret,
      redirect_uri: config.youtubeRedirectUri,
      grant_type: 'authorization_code',
    })

    const res = await fetch(YT_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) {
      emitEvent({
        workspaceId: st.workspace_id,
        eventType: 'youtube.connection_failed',
        entityType: 'workspace',
        entityId: st.workspace_id,
        reality: 'FAILED',
        payload: { status: res.status },
      })
      throw new Error(`youtube_token_exchange_failed:${res.status}`)
    }
    const json = (await res.json()) as {
      access_token: string
      refresh_token?: string
      expires_in?: number
      scope?: string
    }

    // Never log tokens
    const accessEnc = encryptSecret(json.access_token)
    const refreshEnc = json.refresh_token ? encryptSecret(json.refresh_token) : null
    if (!accessEnc) throw new Error('encrypt_failed')

    const expiresAt = json.expires_in
      ? new Date(Date.now() + json.expires_in * 1000).toISOString()
      : null
    const id = uid()
    const existing = db
      .prepare(`SELECT id FROM platform_connections WHERE workspace_id=? AND platform='YOUTUBE'`)
      .get(st.workspace_id) as { id: string } | undefined

    if (existing) {
      db.prepare(
        `UPDATE platform_connections SET status='CONNECTED', access_token_enc=?, refresh_token_enc=COALESCE(?, refresh_token_enc),
         token_expires_at=?, scopes=?, last_verified_at=?, updated_at=?, reality='REAL' WHERE id=?`,
      ).run(
        accessEnc,
        refreshEnc,
        expiresAt,
        JSON.stringify((json.scope || SCOPES).split(' ')),
        nowIso(),
        nowIso(),
        existing.id,
      )
    } else {
      db.prepare(
        `INSERT INTO platform_connections
         (id, workspace_id, platform, status, scopes, access_token_enc, refresh_token_enc,
          token_expires_at, last_verified_at, metadata, reality, created_at, updated_at)
         VALUES (?, ?, 'YOUTUBE', 'CONNECTED', ?, ?, ?, ?, ?, '{}', 'REAL', ?, ?)`,
      ).run(
        id,
        st.workspace_id,
        JSON.stringify((json.scope || SCOPES).split(' ')),
        accessEnc,
        refreshEnc,
        expiresAt,
        nowIso(),
        nowIso(),
        nowIso(),
      )
    }

    emitEvent({
      workspaceId: st.workspace_id,
      eventType: 'youtube.connection_created',
      entityType: 'platform_connection',
      entityId: existing?.id || id,
      reality: 'REAL',
      payload: { stage: 'connected', hasRefresh: Boolean(json.refresh_token) },
    })

    return { workspaceId: st.workspace_id, status: 'CONNECTED' as const }
  }

  async refreshIfNeeded(workspaceId: string): Promise<'ok' | 'REQUIRES_REAUTH' | 'NOT_CONNECTED'> {
    const creds = await encryptedCredentialProvider.get('YOUTUBE', workspaceId)
    if (!creds) return 'NOT_CONNECTED'
    if (creds.status === 'CONNECTED') return 'ok'
    if (creds.status === 'REQUIRES_REAUTH' || !creds.refreshToken) {
      encryptedCredentialProvider.markStatus(workspaceId, 'YOUTUBE', 'REQUIRES_REAUTH')
      return 'REQUIRES_REAUTH'
    }

    const body = new URLSearchParams({
      client_id: config.youtubeClientId,
      client_secret: config.youtubeClientSecret,
      refresh_token: creds.refreshToken,
      grant_type: 'refresh_token',
    })
    const res = await fetch(YT_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) {
      encryptedCredentialProvider.markStatus(workspaceId, 'YOUTUBE', 'REQUIRES_REAUTH')
      return 'REQUIRES_REAUTH'
    }
    const json = (await res.json()) as { access_token: string; expires_in?: number }
    const accessEnc = encryptSecret(json.access_token)
    if (!accessEnc) return 'REQUIRES_REAUTH'
    const expiresAt = json.expires_in
      ? new Date(Date.now() + json.expires_in * 1000).toISOString()
      : null
    getDb()
      .prepare(
        `UPDATE platform_connections SET access_token_enc=?, token_expires_at=?, status='CONNECTED',
         last_verified_at=?, updated_at=? WHERE workspace_id=? AND platform='YOUTUBE'`,
      )
      .run(accessEnc, expiresAt, nowIso(), nowIso(), workspaceId)
    return 'ok'
  }

  disconnect(workspaceId: string) {
    getDb()
      .prepare(
        `UPDATE platform_connections SET status='NOT_CONNECTED', access_token_enc=NULL, refresh_token_enc=NULL,
         token_expires_at=NULL, updated_at=? WHERE workspace_id=? AND platform='YOUTUBE'`,
      )
      .run(nowIso(), workspaceId)
    return { status: 'NOT_CONNECTED' as const }
  }

  status(workspaceId: string) {
    const row = getDb()
      .prepare(
        `SELECT status, account_label, last_verified_at, token_expires_at, reality, refresh_token_enc FROM platform_connections
         WHERE workspace_id=? AND platform='YOUTUBE'`,
      )
      .get(workspaceId) as
      | {
          status: string
          account_label: string | null
          last_verified_at: string | null
          token_expires_at: string | null
          reality: string
          refresh_token_enc: string | null
        }
      | undefined

    let status = row?.status || 'NOT_CONNECTED'
    const expired =
      Boolean(row?.token_expires_at) && new Date(String(row?.token_expires_at)).getTime() < Date.now()
    if (row && expired && status === 'CONNECTED') {
      status = row.refresh_token_enc ? 'EXPIRED' : 'REQUIRES_REAUTH'
    }

    return {
      platform: 'YOUTUBE',
      status,
      accountLabel: row?.account_label || null,
      lastVerifiedAt: row?.last_verified_at || null,
      tokenExpiresAt: row?.token_expires_at || null,
      reality: row?.reality || 'PENDING',
      oauthConfigured: this.configured(),
      canRefresh: Boolean(row?.refresh_token_enc),
      // never include tokens
    }
  }
}

export const youtubeOAuthService = new YouTubeOAuthService()
