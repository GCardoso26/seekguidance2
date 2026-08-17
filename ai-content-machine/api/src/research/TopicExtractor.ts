import type { ResearchResult } from './types.js'
import { getActivePrompt } from '../services/PromptService.js'

export type ExtractedTopic = {
  title: string
  description: string
  keywords: string[]
  source: ResearchResult
  fingerprint: string
  normalizedTitle: string
}

/**
 * Deterministic extractor (no external AI required in mock).
 * Uses prompt version presence for telemetry/versioning contract.
 */
export function extractTopics(results: ResearchResult[]): ExtractedTopic[] {
  getActivePrompt('research_topic_extractor')
  return results.map((r) => ({
    title: r.title,
    description: r.description,
    keywords: r.keywords,
    source: r,
    fingerprint: String(r.metadata?.fingerprint || ''),
    normalizedTitle: String(r.metadata?.normalizedTitle || r.title),
  }))
}
