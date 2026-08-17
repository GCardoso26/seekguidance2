import { config } from '../config.js'
import type { ConnectionStatus, CredentialProvider, PlatformCredentials } from './CredentialProvider.js'

/**
 * Reads YouTube tokens from env for local/dev controlled tests.
 * Never use in multi-tenant production — prefer EncryptedCredentialProvider + OAuth.
 *
 * Env (optional):
 *   YOUTUBE_ACCESS_TOKEN
 *   YOUTUBE_REFRESH_TOKEN
 *   YOUTUBE_TOKEN_EXPIRES_AT
 */
export class EnvironmentCredentialProvider implements CredentialProvider {
  async get(platform: string, workspaceId: string): Promise<PlatformCredentials | null> {
    if (platform.toUpperCase() !== 'YOUTUBE' && platform.toUpperCase() !== 'YOUTUBE_SHORT') {
      return null
    }
    const access = process.env.YOUTUBE_ACCESS_TOKEN || ''
    if (!access) return null
    return {
      platform: 'YOUTUBE',
      workspaceId,
      accessToken: access,
      refreshToken: process.env.YOUTUBE_REFRESH_TOKEN || undefined,
      expiresAt: process.env.YOUTUBE_TOKEN_EXPIRES_AT || null,
      accountLabel: process.env.YOUTUBE_ACCOUNT_LABEL || 'env-youtube',
      scopes: ['youtube.upload', 'youtube.readonly'],
      status: 'CONNECTED',
    }
  }

  async status(platform: string, workspaceId: string): Promise<ConnectionStatus> {
    const creds = await this.get(platform, workspaceId)
    if (!creds) return 'NOT_CONNECTED'
    if (config.youtubeClientId && !config.youtubeClientSecret) return 'INVALID'
    return 'CONNECTED'
  }
}
