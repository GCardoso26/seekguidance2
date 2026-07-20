/**
 * Métricas de maturidade do marketplace — preencher com dados reais do Beta.
 * Não usar seeds/simulação para North Star (ADR-014).
 */

export type MarketplaceCoverageSnapshot = {
  gameCode: string;
  asOf: string;
  /** % do catálogo canônico indexado */
  catalogPercent: number;
  /** % de cards com ≥1 listing */
  cardsWithListingPercent: number;
  /** % de cards com estoque > 0 */
  cardsWithStockPercent: number;
  /** % de cards com busca nos últimos 30d (denom = catálogo) */
  cardsSearchedPercent: number;
  /** % de cards com liquidez (venda concluída 90d) */
  cardsWithLiquidityPercent: number;
  source: "manual" | "warehouse" | "placeholder";
};

export const MARKETPLACE_COVERAGE_TEMPLATE: MarketplaceCoverageSnapshot[] = [
  {
    gameCode: "LORCANA",
    asOf: "1970-01-01T00:00:00.000Z",
    catalogPercent: 100,
    cardsWithListingPercent: 31,
    cardsWithStockPercent: 28,
    cardsSearchedPercent: 17,
    cardsWithLiquidityPercent: 5,
    source: "placeholder",
  },
];

export type MarketplaceCoverageReport = {
  generatedAt: string;
  note: string;
  snapshots: MarketplaceCoverageSnapshot[];
};

export function buildMarketplaceCoverageReport(): MarketplaceCoverageReport {
  return {
    generatedAt: new Date().toISOString(),
    note: "Substituir placeholders por snapshot Beta/warehouse; não alimentar North Star com simulation.",
    snapshots: MARKETPLACE_COVERAGE_TEMPLATE,
  };
}
