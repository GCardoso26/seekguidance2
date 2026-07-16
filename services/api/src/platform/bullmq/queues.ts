export type JobPriority = "HIGH" | "NORMAL" | "LOW";

export const PRIORITY_WEIGHT: Record<JobPriority, number> = {
  HIGH: 1,
  NORMAL: 5,
  LOW: 10,
};

/** Catalog + media + pricing + search queues (each has matching *.dlq). */
export const QUEUE_NAMES = {
  catalogSets: "catalog.sets",
  catalogCards: "catalog.cards",
  catalogVariants: "catalog.variants",
  mediaProcess: "media.process",
  catalogLegality: "catalog.legality",
  catalogRulings: "catalog.rulings",
  pricingPrices: "pricing.prices",
  pricingMarket: "pricing.market",
  pricingHistory: "pricing.history",
  currencyRates: "currency.rates",
  searchSync: "search.sync",
  analyticsIngest: "analytics.ingest",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export function dlqName(queue: QueueName): string {
  return `${queue}.dlq`;
}

export const DEFAULT_JOB_OPTIONS = {
  attempts: 5,
  backoff: { type: "exponential" as const, delay: 2_000 },
  removeOnComplete: 100,
  removeOnFail: 500,
};

export interface JobLogContext {
  requestId: string;
  jobId: string;
  providerId?: string;
  gameCode?: string;
  priority?: JobPriority;
}
