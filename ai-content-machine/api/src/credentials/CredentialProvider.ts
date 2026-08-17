export type ConnectionStatus =
  | 'CONNECTED'
  | 'EXPIRED'
  | 'INVALID'
  | 'NOT_CONNECTED'
  | 'REQUIRES_REAUTH'

export type PlatformCredentials = {
  platform: string
  workspaceId: string
  accessToken: string
  refreshToken?: string
  expiresAt?: string | null
  accountLabel?: string
  externalAccountId?: string
  scopes: string[]
  status: ConnectionStatus
}

export interface CredentialProvider {
  get(platform: string, workspaceId: string): Promise<PlatformCredentials | null>
  status(platform: string, workspaceId: string): Promise<ConnectionStatus>
}
