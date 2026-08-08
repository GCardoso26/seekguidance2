import crypto from 'node:crypto'

export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function topicFingerprint(normalizedTitle: string, normalizedSource: string, nicheId: string): string {
  return sha256(`${normalizedTitle}|${normalizedSource}|${nicheId}`)
}
