"use client";

import type { ValuationResult } from "@/lib/pricing/valuation-engine";
import { formatCurrency } from "@/lib/format-currency";

interface MarketPriceComparisonProps {
  valuation: ValuationResult;
}

export function MarketPriceComparison({ valuation }: MarketPriceComparisonProps) {
  const tcg = valuation.marketData.tcgplayer;
  const cm = valuation.marketData.cardmarket;
  const local = valuation.marketData.local;

  const rows = [
    {
      source: "TCGPlayer (US)",
      value: tcg ? `$${tcg.market_price ?? tcg.price}` : "—",
      trend: tcg?.price_change_7d ? `${tcg.price_change_7d}% (7d)` : null,
    },
    {
      source: "Cardmarket (EU)",
      value: cm?.prices?.cardmarket?.lowest_near_mint
        ? `€${cm.prices.cardmarket.lowest_near_mint}`
        : "—",
      trend: null,
    },
    {
      source: "Mercado BR",
      value: local?.listingsCount
        ? formatCurrency(local.averagePrice / 100, "BRL")
        : "Sem listagens",
      trend: local ? `${local.listingsCount} ofertas` : null,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {rows.map((row) => (
        <div key={row.source} className="rounded-lg border border-border bg-background/50 p-3">
          <p className="text-xs text-muted-foreground">{row.source}</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{row.value}</p>
          {row.trend && <p className="text-xs text-muted-foreground">{row.trend}</p>}
        </div>
      ))}
    </div>
  );
}
