import fs from 'node:fs'
import { mediaAssetRepository } from '../library/MediaAssetRepository.js'

export type ResolvedAudio = {
  path: string
  kind: 'music' | 'sfx'
  source: string
  license: string
  author?: string
  url?: string
} | null

/**
 * Optional beds. Never downloads random internet music.
 * Sources: CWM_MUSIC_PATH / CWM_SFX_PATH or library type=audio APPROVED.
 */
export function resolveMusic(workspaceId: string): ResolvedAudio {
  const envPath = (process.env.CWM_MUSIC_PATH || '').trim()
  if (envPath && fs.existsSync(envPath)) {
    return { path: envPath, kind: 'music', source: 'env', license: 'USER_OWNED' }
  }
  try {
    const hit = mediaAssetRepository.searchBest({
      workspaceId,
      type: 'audio',
      tags: ['music', 'bed'],
    })
    if (hit?.asset.path && fs.existsSync(hit.asset.path) && hit.asset.type === 'audio') {
      if (/\.(png|jpe?g|webp|gif|mp4|mov)$/i.test(hit.asset.path)) return null
      return {
        path: hit.asset.path,
        kind: 'music',
        source: 'asset_library',
        license: String(hit.asset.metadata?.license || 'LICENSED'),
        author: String(hit.asset.metadata?.author || ''),
        url: String(hit.asset.metadata?.sourceUrl || ''),
      }
    }
  } catch {
    /* library optional */
  }
  return null
}

export function resolveSfx(workspaceId: string): ResolvedAudio {
  const envPath = (process.env.CWM_SFX_PATH || '').trim()
  if (envPath && fs.existsSync(envPath)) {
    return { path: envPath, kind: 'sfx', source: 'env', license: 'USER_OWNED' }
  }
  return null
}
