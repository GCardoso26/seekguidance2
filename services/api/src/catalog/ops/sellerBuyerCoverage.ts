/**
 * Cobertura de sellers/buyers — funil operacional sem GMV.
 */

export type SellerCoverageSnapshot = {
  gameCode: string;
  asOf: string;
  storesTotal: number;
  specializedStores: number;
  activeStores: number;
  storesWith100PlusListings: number;
  storesWithRepeatSales: number;
  source: "manual" | "warehouse" | "placeholder";
};

export type BuyerCoverageSnapshot = {
  gameCode: string;
  asOf: string;
  registered: number;
  searchedCards: number;
  openedPdp: number;
  cart: number;
  checkout: number;
  source: "manual" | "warehouse" | "placeholder";
};

export const SELLER_COVERAGE_TEMPLATE: SellerCoverageSnapshot[] = [
  {
    gameCode: "LORCANA",
    asOf: "1970-01-01T00:00:00.000Z",
    storesTotal: 7,
    specializedStores: 6,
    activeStores: 5,
    storesWith100PlusListings: 4,
    storesWithRepeatSales: 3,
    source: "placeholder",
  },
];

export const BUYER_COVERAGE_TEMPLATE: BuyerCoverageSnapshot[] = [
  {
    gameCode: "LORCANA",
    asOf: "1970-01-01T00:00:00.000Z",
    registered: 31,
    searchedCards: 24,
    openedPdp: 18,
    cart: 9,
    checkout: 4,
    source: "placeholder",
  },
];

export type SellerBuyerCoverageReport = {
  generatedAt: string;
  note: string;
  sellers: SellerCoverageSnapshot[];
  buyers: BuyerCoverageSnapshot[];
};

export function buildSellerBuyerCoverageReport(): SellerBuyerCoverageReport {
  return {
    generatedAt: new Date().toISOString(),
    note: "Complementa SD (profundidade); atualizar no MRB/Founder Report com dados Beta.",
    sellers: SELLER_COVERAGE_TEMPLATE,
    buyers: BUYER_COVERAGE_TEMPLATE,
  };
}
