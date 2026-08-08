import type { ResearchResult } from './types.js'
import { normalizeTitle, topicFingerprint } from '../lib/hash.js'

export function dedupeResults(results: ResearchResult[], nicheId: string): ResearchResult[] {
  const seen = new Set<string>()
  const out: ResearchResult[] = []
  for (const r of results) {
    const normTitle = normalizeTitle(r.title)
    const normSource = (r.sourceUrl || r.rawReference || r.provider).toLowerCase()
    const fp = topicFingerprint(normTitle, normSource, nicheId)
    const urlKey = r.sourceUrl.toLowerCase()
    const key = `${fp}|${urlKey}`
    if (seen.has(key) || seen.has(fp)) continue
    seen.add(key)
    seen.add(fp)
    out.push({
      ...r,
      metadata: { ...(r.metadata || {}), fingerprint: fp, normalizedTitle: normTitle },
    })
  }
  return out
}
