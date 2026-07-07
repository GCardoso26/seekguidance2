/** Remove acentos para busca accent-insensitive. */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** Pontuação fuzzy simples: prefixo > substring > tokens. */
export function fuzzyScore(query: string, haystack: string): number {
  const q = normalizeSearchText(query);
  const h = normalizeSearchText(haystack);
  if (!q || !h) return 0;
  if (h === q) return 100;
  if (h.startsWith(q)) return 90;
  if (h.includes(q)) return 75;

  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((t) => h.includes(t))) return 70;

  let score = 0;
  for (const token of tokens) {
    if (h.startsWith(token)) score += 40;
    else if (h.includes(token)) score += 25;
  }
  return score;
}

export function matchesFuzzy(query: string, ...fields: (string | undefined)[]): boolean {
  const hay = fields.filter(Boolean).join(" ");
  return fuzzyScore(query, hay) >= 25;
}
