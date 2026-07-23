/**
 * Pure secondary affinity boosts — collection / publisher / game / expansion / lifecycle.
 * Max ~0.095; never replaces lexical ranking.
 */
export type KnowledgeAffinityRow = {
  id: string;
  collection_id: string | null;
  publisher_id: string | null;
  game: string | null;
  lifecycle: string | null;
  expansion: string | null;
};

export function computeKnowledgeAffinityBoosts(
  matchedProductIds: string[],
  rows: KnowledgeAffinityRow[],
): Map<string, number> {
  const boost = new Map<string, number>();
  if (!matchedProductIds.length || !rows.length) return boost;

  const byId = new Map(rows.map((r) => [String(r.id), r]));
  const seeds = matchedProductIds.map((id) => byId.get(id)).filter(Boolean) as KnowledgeAffinityRow[];
  const collections = new Set(seeds.map((s) => s.collection_id).filter(Boolean));
  const publishers = new Set(seeds.map((s) => s.publisher_id).filter(Boolean));
  const games = new Set(seeds.map((s) => s.game).filter(Boolean));
  const lifecycles = new Set(seeds.map((s) => s.lifecycle).filter(Boolean));
  const expansions = new Set(seeds.map((s) => s.expansion).filter(Boolean));

  for (const row of rows) {
    const id = String(row.id);
    if (matchedProductIds.includes(id)) continue;
    let add = 0;
    if (row.collection_id && collections.has(row.collection_id)) add += 0.03;
    if (row.publisher_id && publishers.has(row.publisher_id)) add += 0.02;
    if (row.game && games.has(row.game)) add += 0.015;
    if (row.expansion && expansions.has(row.expansion)) add += 0.02;
    if (row.lifecycle && lifecycles.has(row.lifecycle)) add += 0.01;
    if (add > 0) boost.set(id, add);
  }
  return boost;
}
