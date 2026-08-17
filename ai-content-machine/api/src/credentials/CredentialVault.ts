import { config } from '../config.js'
import { EnvironmentCredentialProvider } from './EnvironmentCredentialProvider.js'
import { encryptedCredentialProvider } from './EncryptedCredentialProvider.js'
import type { ConnectionStatus, PlatformCredentials } from './CredentialProvider.js'
import { encryptionReady } from './crypto.js'

const envProvider = new EnvironmentCredentialProvider()

/**
 * Resolves credentials: encrypted workspace store first, then env fallback.
 * Never returns tokens to HTTP responses — services only.
 */
export class CredentialVault {
  encryptionReady() {
    return encryptionReady()
  }

  async get(platform: string, workspaceId: string): Promise<PlatformCredentials | null> {
    const fromDb = await encryptedCredentialProvider.get(platform, workspaceId)
    if (fromDb) return fromDb
    return envProvider.get(platform, workspaceId)
  }

  async status(platform: string, workspaceId: string): Promise<ConnectionStatus> {
    const dbStatus = await encryptedCredentialProvider.status(platform, workspaceId)
    if (dbStatus !== 'NOT_CONNECTED') return dbStatus
    return envProvider.status(platform, workspaceId)
  }

  youtubeOAuthConfigured(): boolean {
    return Boolean(config.youtubeClientId && config.youtubeClientSecret)
  }
}

export const credentialVault = new CredentialVault()
