import type { Pool, PoolClient } from "pg";
import type { AggregatedValuation, PriceQuoteDTO, PricingMarketCode } from "../domain/types.js";

type Q = Pool | PoolClient;

const marketCache = new Map<string, string>();

export class PostgresPricingRepository {
  constructor(private readonly db: Q) {}

  async resolveMarketId(code: PricingMarketCode): Promise<string> {
    const cached = marketCache.get(code);
    if (cached) return cached;
    const res = await this.db.query<{ id: string }>(
      `SELECT id FROM pricing.pricing_markets WHERE code = $1 LIMIT 1`,
      [code],
    );
    if (!res.rows[0]) throw new Error(`pricing_market_missing:${code}`);
    marketCache.set(code, res.rows[0].id);
    return res.rows[0].id;
  }

  async insertQuote(
    subjectType: string,
    subjectId: string,
    quote: PriceQuoteDTO,
  ): Promise<void> {
    const marketId = await this.resolveMarketId(quote.marketCode);
    await this.db.query(
      `
      INSERT INTO pricing.price_quotes (
        subject_type, subject_id, market_id, currency,
        min_price_cents, avg_price_cents, median_price_cents, max_price_cents,
        suggested_price_cents, spread_bps, liquidity_score, seller_count, sample_size,
        condition, finish, language, raw
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb)
      `,
      [
        subjectType,
        subjectId,
        marketId,
        quote.currency,
        quote.minPriceCents ?? null,
        quote.avgPriceCents ?? null,
        quote.medianPriceCents ?? null,
        quote.maxPriceCents ?? null,
        quote.suggestedPriceCents ?? null,
        quote.spreadBps ?? null,
        quote.liquidityScore ?? null,
        quote.sellerCount ?? null,
        quote.sampleSize ?? null,
        quote.condition ?? null,
        quote.finish ?? null,
        quote.language ?? null,
        JSON.stringify(quote.raw ?? {}),
      ],
    );

    const metrics: Array<[string, number | undefined]> = [
      ["min", quote.minPriceCents],
      ["avg", quote.avgPriceCents],
      ["median", quote.medianPriceCents],
      ["max", quote.maxPriceCents],
      ["suggested", quote.suggestedPriceCents],
    ];
    for (const [metric, cents] of metrics) {
      if (cents == null) continue;
      await this.db.query(
        `
        INSERT INTO pricing.price_quote_history (
          subject_type, subject_id, market_id, currency, price_cents, metric
        ) VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [subjectType, subjectId, marketId, quote.currency, cents, metric],
      );
    }
  }

  async upsertAggregated(v: AggregatedValuation): Promise<void> {
    await this.db.query(
      `
      INSERT INTO pricing.aggregated_valuations (
        subject_type, subject_id, currency,
        min_price_cents, avg_price_cents, median_price_cents, suggested_price_cents,
        spread_bps, liquidity_score, confidence, sources, computed_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12)
      ON CONFLICT (subject_type, subject_id, currency) DO UPDATE SET
        min_price_cents = EXCLUDED.min_price_cents,
        avg_price_cents = EXCLUDED.avg_price_cents,
        median_price_cents = EXCLUDED.median_price_cents,
        suggested_price_cents = EXCLUDED.suggested_price_cents,
        spread_bps = EXCLUDED.spread_bps,
        liquidity_score = EXCLUDED.liquidity_score,
        confidence = EXCLUDED.confidence,
        sources = EXCLUDED.sources,
        computed_at = EXCLUDED.computed_at
      `,
      [
        v.subjectType,
        v.subjectId,
        v.currency,
        v.minPriceCents ?? null,
        v.avgPriceCents ?? null,
        v.medianPriceCents ?? null,
        v.suggestedPriceCents ?? null,
        v.spreadBps ?? null,
        v.liquidityScore ?? null,
        v.confidence,
        JSON.stringify(v.sources),
        v.computedAt,
      ],
    );
  }

  async getAggregated(
    subjectType: string,
    subjectId: string,
    currency = "BRL",
  ): Promise<AggregatedValuation | null> {
    const res = await this.db.query(
      `SELECT * FROM pricing.aggregated_valuations
       WHERE subject_type = $1 AND subject_id = $2 AND currency = $3 LIMIT 1`,
      [subjectType, subjectId, currency],
    );
    const row = res.rows[0];
    if (!row) return null;
    return {
      subjectType: row.subject_type,
      subjectId: row.subject_id,
      currency: row.currency,
      minPriceCents: row.min_price_cents,
      avgPriceCents: row.avg_price_cents,
      medianPriceCents: row.median_price_cents,
      suggestedPriceCents: row.suggested_price_cents,
      spreadBps: row.spread_bps,
      liquidityScore: row.liquidity_score != null ? Number(row.liquidity_score) : undefined,
      confidence: row.confidence,
      sources: row.sources ?? [],
      computedAt: row.computed_at?.toISOString?.() ?? String(row.computed_at),
    };
  }

  /** Ofertas internas JudgeTCG → quote. */
  async loadInternalOffers(subjectType: string, subjectId: string): Promise<PriceQuoteDTO | null> {
    if (subjectType !== "product_variant") return null;
    const res = await this.db.query<{
      min_cents: string;
      avg_cents: string;
      seller_count: string;
    }>(
      `
      SELECT
        min(price_cents)::text AS min_cents,
        avg(price_cents)::int::text AS avg_cents,
        count(*)::text AS seller_count
      FROM product_catalog.seller_products
      WHERE variant_id = $1 AND is_active = true AND stock > 0
      `,
      [subjectId],
    );
    const row = res.rows[0];
    if (!row || Number(row.seller_count) === 0) return null;
    const min = Number(row.min_cents);
    const avg = Number(row.avg_cents);
    return {
      marketCode: "JUDGETCG",
      currency: "BRL",
      minPriceCents: min,
      avgPriceCents: avg,
      medianPriceCents: avg,
      suggestedPriceCents: avg,
      sellerCount: Number(row.seller_count),
      sampleSize: Number(row.seller_count),
      liquidityScore: Math.min(1, Number(row.seller_count) / 10),
    };
  }
}
