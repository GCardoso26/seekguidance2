import { getDb } from '../db/client.js'
import type { PublicationMetadata } from './types.js'
import { resolvePlatform } from '../scriptFactory/PlatformProfiles.js'

/**
 * "Link na bio" is a TikTok/Reels convention that doesn't apply to YouTube — Shorts have
 * no clickable bio link, so the CTA must point viewers to the description instead.
 */
const BIO_CTA_PATTERN = /link\s+na\s+bio\b/gi

function sanitizeBioCtaForYoutube(text: string): string {
  if (!text) return text
  return text.replace(BIO_CTA_PATTERN, (match) => {
    const firstIsUpper = match[0] !== match[0].toLowerCase()
    return firstIsUpper ? 'Link na descrição' : 'link na descrição'
  })
}

export function buildPublicationMetadata(
  contentId: string,
  scheduledAt?: string | null,
  platform?: string,
): PublicationMetadata {
  const db = getDb()
  const content = db.prepare(`SELECT * FROM contents WHERE id = ?`).get(contentId) as
    | { title: string; script_id: string | null; asset_meta: string }
    | undefined
  if (!content) throw new Error('content_not_found')

  const isYoutube = resolvePlatform(platform) === 'YOUTUBE_SHORT'

  let caption = content.title
  let hashtags: string[] = []
  let description = content.title
  let hook = content.title

  if (content.script_id) {
    const script = db.prepare(`SELECT * FROM scripts WHERE id = ?`).get(content.script_id) as
      | {
          hook: string
          cta: string
          caption: string | null
          hashtags: string
          body: string
        }
      | undefined
    if (script) {
      hook = script.hook
      caption = script.caption || script.hook
      const cta = isYoutube ? sanitizeBioCtaForYoutube(script.cta || '') : script.cta || ''
      try {
        hashtags = JSON.parse(script.hashtags || '[]') as string[]
      } catch {
        hashtags = []
      }
      const hashtagLine = hashtags.length
        ? hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')
        : ''
      // Description leads with caption + hashtags (what viewers actually read/search on),
      // CTA follows so "link na descrição" makes literal sense.
      description = [caption, cta, hashtagLine].filter(Boolean).join('\n\n')
    }
  }

  const assetMeta = (() => {
    try {
      return JSON.parse(content.asset_meta || '{}') as { productionId?: string }
    } catch {
      return {}
    }
  })()

  let video: string | undefined
  let thumbnail: string | undefined
  if (assetMeta.productionId) {
    const final = db
      .prepare(
        `SELECT uri FROM media_assets WHERE production_id = ? AND type = 'FINAL_VIDEO' AND is_current = 1 LIMIT 1`,
      )
      .get(assetMeta.productionId) as { uri: string } | undefined
    const thumb = db
      .prepare(
        `SELECT uri FROM media_assets WHERE production_id = ? AND type = 'THUMBNAIL' AND is_current = 1 LIMIT 1`,
      )
      .get(assetMeta.productionId) as { uri: string } | undefined
    video = final?.uri
    thumbnail = thumb?.uri
  }

  return {
    title: hook.slice(0, 100),
    description,
    caption,
    hashtags,
    tags: hashtags.slice(0, 8),
    category: 'education',
    language: 'pt-BR',
    thumbnail,
    video,
    scheduledAt: scheduledAt ?? null,
  }
}
