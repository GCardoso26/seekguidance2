import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { config } from '../config.js'

function keyBytes(): Buffer | null {
  // Live env wins (same pattern as PublishingSafety) so tests can set the key after boot.
  const raw = process.env.CWM_CREDENTIALS_ENCRYPTION_KEY || config.credentialsEncryptionKey
  if (!raw || raw.length < 16) return null
  return createHash('sha256').update(raw).digest()
}

/** Encrypt secret for DB storage. Returns null if encryption key not configured. */
export function encryptSecret(plaintext: string): string | null {
  const key = keyBytes()
  if (!key) return null
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`
}

export function decryptSecret(payload: string): string | null {
  const key = keyBytes()
  if (!key || !payload.startsWith('v1:')) return null
  const [, ivB64, tagB64, dataB64] = payload.split(':')
  if (!ivB64 || !tagB64 || !dataB64) return null
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ])
  return dec.toString('utf8')
}

export function encryptionReady(): boolean {
  return Boolean(keyBytes())
}
