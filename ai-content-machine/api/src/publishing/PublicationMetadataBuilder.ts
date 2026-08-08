import { getDb } from '../db/client.js'
import type { PublicationMetadata } from './types.js'

export function buildPublicationMetadata(contentId: string, scheduledAt?: string | null): PublicationMetadata {
  const db = getDb()
  const content = db.prepare(`SELECT * FROM contents WHERE id = ?`).get(contentId) as
    | { title: string; script_id: string | null; asset_meta: string }
    | undefined
  if (!content) throw new Error('content_not_found')

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
      description = [script.hook, script.cta].filter(Boolean).join('\n\n')
      try {
        hashtags = JSON.parse(script.hashtags || '[]') as string[]
      } catch {
        hashtags = []
      }
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
