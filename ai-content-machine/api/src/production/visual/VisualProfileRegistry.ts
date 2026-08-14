import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { VisualProfile } from './visualTypes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROFILES_DIR = path.join(__dirname, 'profiles')

const cache = new Map<string, VisualProfile>()

const NICHE_KEYWORDS: Array<{ id: string; keywords: string[] }> = [
  { id: 'finance', keywords: ['financ', 'dinheiro', 'invest', 'renda', 'money', 'income', 'profit', 'salário', 'salario', 'cripto', 'crypto'] },
  { id: 'technology', keywords: ['tecnolog', 'software', 'ia', 'ai ', 'llm', 'app', 'automação', 'automacao', 'n8n', 'código', 'codigo', 'code'] },
  { id: 'news', keywords: ['notícia', 'noticia', 'breaking', 'jornal', 'headline'] },
  { id: 'luxury', keywords: ['luxo', 'premium', 'luxury', 'exclusiv'] },
  { id: 'history', keywords: ['histór', 'histor', 'antig', 'século', 'seculo'] },
  { id: 'mystery', keywords: ['mistério', 'misterio', 'segredo', 'secret', 'ocult'] },
  { id: 'gaming', keywords: ['game', 'gaming', 'jogo', 'gamer'] },
]

export function listVisualProfileIds(): string[] {
  return fs
    .readdirSync(PROFILES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .sort()
}

export function loadVisualProfile(id: string): VisualProfile {
  const key = (id || 'documentary').trim().toLowerCase()
  const cached = cache.get(key)
  if (cached) return cached
  const file = path.join(PROFILES_DIR, `${key}.json`)
  if (!fs.existsSync(file)) {
    return loadVisualProfile('documentary')
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as VisualProfile
  if (!raw.id || !raw.style || !raw.negative) {
    throw new Error(`visual_profile_invalid:${key}`)
  }
  raw.maxScenes = Math.max(3, Math.min(7, Number(raw.maxScenes) || 5))
  cache.set(key, raw)
  return raw
}

/**
 * Niche / script text choose the visual identity.
 * The LLM must not invent aesthetics — only which profile id to bind.
 */
export function resolveVisualProfileId(input: {
  nicheName?: string | null
  scriptText?: string | null
  preferredId?: string | null
}): string {
  if (input.preferredId && listVisualProfileIds().includes(input.preferredId)) {
    return input.preferredId
  }
  const blob = `${input.nicheName || ''} ${input.scriptText || ''}`.toLowerCase()
  for (const row of NICHE_KEYWORDS) {
    if (row.keywords.some((k) => blob.includes(k))) return row.id
  }
  return process.env.CWM_VISUAL_PROFILE || 'documentary'
}

export function getVisualProfile(input: {
  nicheName?: string | null
  scriptText?: string | null
  preferredId?: string | null
}): VisualProfile {
  return loadVisualProfile(resolveVisualProfileId(input))
}
