import type { Pool } from "pg";
import { createLogger } from "../platform/logging/logger.js";
import { appendDomainEvent } from "../platform/events/DomainEventStore.js";
import { aggregateQuotes } from "./application/aggregateQuotes.js";
import type {
  AggregatedValuation,
  PriceQuoteDTO,
  PricingProvider,
  PricingSyncContext,
} from "./domain/types.js";
import { PostgresPricingRepository } from "./persistence/PostgresPricingRepository.js";
import { CardmarketPricingProvider } from "./providers/CardmarketPricingProvider.js";
import { CardTraderPricingProvider } from "./providers/CardTraderPricingProvider.js";
import { EbayPricingProvider } from "./providers/EbayPricingProvider.js";
import { JudgeTcgPricingProvider } from "./providers/JudgeTcgPricingProvider.js";
import { TcgPlayerPricingProvider } from "./providers/TcgPlayerPricingProvider.js";

const log = createLogger("pricing.service");

export class PricingService {
  constructor(
    private readonly repo: PostgresPricingRepository,
    private readonly providers: PricingProvider[],
    private readonly pool: Pool,
  ) {}

  async syncSubject(ctx: PricingSyncContext): Promise<AggregatedValuation> {
    const currency = ctx.currency ?? "BRL";
    const quotes: PriceQuoteDTO[] = [];

    for (const provider of this.providers) {
      try {
        const result = await provider.syncPrices(ctx);
        if (result.ok) quotes.push(...result.quotes);
        else log.warn({ market: provider.marketCode, error: result.error }, "pricing_provider_soft_fail");
      } catch (e) {
        log.error(
          { market: provider.marketCode, err: e instanceof Error ? e.message : String(e) },
          "pricing_provider_error",
        );
      }
    }

    for (const q of quotes) {
      await this.repo.insertQuote(ctx.subjectType, ctx.subjectId, q);
    }

    const valuation = aggregateQuotes(ctx.subjectType, ctx.subjectId, currency, quotes);
    await this.repo.upsertAggregated(valuation);

    await appendDomainEvent(this.pool, {
      eventType: "PriceChanged",
      aggregateType: ctx.subjectType,
      aggregateId: ctx.subjectId,
      payload: {
        min: valuation.minPriceCents,
        avg: valuation.avgPriceCents,
        median: valuation.medianPriceCents,
        suggested: valuation.suggestedPriceCents,
        sources: valuation.sources,
      },
      metadata: { requestId: ctx.requestId },
    });

    return valuation;
  }

  getValuation(subjectType: string, subjectId: string, currency = "BRL") {
    return this.repo.getAggregated(subjectType, subjectId, currency);
  }
}

export function createPricingService(pool: Pool): PricingService {
  const repo = new PostgresPricingRepository(pool);
  const providers: PricingProvider[] = [
    new TcgPlayerPricingProvider(),
    new CardmarketPricingProvider(),
    new CardTraderPricingProvider(),
    new EbayPricingProvider(),
    new JudgeTcgPricingProvider(repo),
  ];
  return new PricingService(repo, providers, pool);
}
