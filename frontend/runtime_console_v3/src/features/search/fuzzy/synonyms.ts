/** Expansões de query — abreviações e sinônimos comuns TCG. */
const SYNONYM_MAP: Record<string, string[]> = {
  char: ["charizard"],
  lotr: ["lord of the rings", "middle-earth"],
  neo: ["neo revelation", "neo genesis"],
  bolt: ["lightning bolt"],
  sol: ["sol ring"],
  black: ["black lotus"],
  mox: ["mox pearl", "mox jet", "mox ruby", "mox sapphire", "mox emerald"],
  pika: ["pikachu"],
  lili: ["liliana"],
  ugin: ["ugin"],
};

export function expandQueryTokens(query: string): string[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const expanded = new Set<string>([normalized, ...tokens]);

  for (const token of tokens) {
    const syns = SYNONYM_MAP[token];
    if (syns) syns.forEach((s) => expanded.add(s));
  }

  return [...expanded];
}
