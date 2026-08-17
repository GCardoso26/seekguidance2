import type { ResearchResult } from './types.js'
import { normalizeTitle } from '../lib/hash.js'

export function normalizeResults(results: ResearchResult[]): ResearchResult[] {
  return results.map((r) => ({
    ...r,
    title: r.title.trim(),
    description: (r.description || '').trim(),
    sourceUrl: (r.sourceUrl || '').trim(),
    sourceTitle: (r.sourceTitle || r.title).trim(),
    keywords: [...new Set((r.keywords || []).map((k) => k.toLowerCase().trim()).filter(Boolean))],
    metadata: {
      ...(r.metadata || {}),
      normalizedTitle: normalizeTitle(r.title),
    },
  }))
}
