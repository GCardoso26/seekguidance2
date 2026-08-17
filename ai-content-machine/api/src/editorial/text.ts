export function clamp100(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

export function tokenize(text: string): string[] {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^a-z0-9áéíóúãõâêôç]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 2)
}

export function jaccard(a: string, b: string): number {
  const sa = new Set(tokenize(a))
  const sb = new Set(tokenize(b))
  if (!sa.size && !sb.size) return 1
  if (!sa.size || !sb.size) return 0
  let inter = 0
  for (const t of sa) if (sb.has(t)) inter += 1
  return inter / (sa.size + sb.size - inter)
}

export function maxJaccard(candidate: string, history: string[]): number {
  if (!history.length) return 0
  let max = 0
  for (const h of history) {
    const s = jaccard(candidate, h)
    if (s > max) max = s
  }
  return max
}

export function countHits(text: string, patterns: RegExp[]): number {
  const src = String(text || '')
  let n = 0
  for (const p of patterns) if (p.test(src)) n += 1
  return n
}
