import type { Pool } from "pg";
import { createLogger } from "../../platform/logging/logger.js";
import { createProductRelationshipService } from "../application/ProductRelationshipService.js";

const log = createLogger("product-catalog.embeddings");

/**
 * Hybrid search foundation: lexical (tsvector/trgm) + optional semantic.
 * Relationship boost is secondary only — never replaces ranking.
 */
export class HybridProductSearch {
  constructor(private readonly pool: Pool) {}

  async upsertEmbedding(productId: string, text: string): Promise<void> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      log.info({ productId }, "embedding_skipped_no_api_key");
      return;
    }
    const model = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, input: text.slice(0, 8000) }),
    });
    if (!res.ok) throw new Error(`openai_embedding_${res.status}`);
    const body = (await res.json()) as { data?: Array<{ embedding: number[] }> };
    const embedding = body.data?.[0]?.embedding;
    if (!embedding) throw new Error("openai_embedding_empty");

    await this.pool.query(
      `
      INSERT INTO product_catalog.product_embeddings (product_id, embedding_json, model, updated_at)
      VALUES ($1, $2::jsonb, $3, now())
      ON CONFLICT (product_id) DO UPDATE SET
        embedding_json = EXCLUDED.embedding_json,
        model = EXCLUDED.model,
        updated_at = now()
      `,
      [productId, JSON.stringify(embedding), model],
    );
  }

  async search(query: string, limit = 24): Promise<Array<{ product_id: string; score: number; title_pt: string }>> {
    const lexical = await this.pool.query<{ product_id: string; title_pt: string; rank: number }>(
      `
      SELECT p.id AS product_id, p.title_pt,
        ts_rank(p.search_vector, plainto_tsquery('portuguese', $1))
          + similarity(p.title_pt, $1) AS rank
      FROM product_catalog.products p
      WHERE p.search_vector @@ plainto_tsquery('portuguese', $1)
         OR p.title_pt % $1
      ORDER BY rank DESC
      LIMIT $2
      `,
      [query, Math.max(limit * 2, 48)],
    );

    const base = lexical.rows.map((r) => ({
      product_id: r.product_id,
      title_pt: r.title_pt,
      score: Number(r.rank),
    }));

    try {
      const topIds = base.slice(0, Math.min(5, base.length)).map((b) => b.product_id);
      const candidateIds = base.map((b) => b.product_id);
      const rel = createProductRelationshipService(this.pool);
      const boosts = await rel.relationshipBoostScores(topIds, candidateIds);
      for (const row of base) {
        row.score += boosts.get(row.product_id) ?? 0;
      }
      base.sort((a, b) => b.score - a.score);
    } catch (e) {
      log.warn({ err: String(e) }, "relationship_boost_skipped");
    }

    return base.slice(0, limit);
  }
}
