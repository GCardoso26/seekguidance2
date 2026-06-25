"use client";

import { useEffect, useState } from "react";
import { ValuationCard } from "@/components/valuation/ValuationCard";
import { MarketPriceComparison } from "@/components/valuation/MarketPriceComparison";
import type { ValuationResult } from "@/lib/pricing/valuation-engine";
import { Skeleton } from "@/components/ui/skeleton";

interface CardValuationPanelProps {
  cardName: string;
  cardId?: string;
  game?: string;
  condition?: string;
}

export function CardValuationPanel({
  cardName,
  cardId,
  game = "mtg",
  condition = "NM",
}: CardValuationPanelProps) {
  const [valuation, setValuation] = useState<ValuationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ condition });
    if (cardId) {
      params.set("card_id", cardId);
    } else {
      params.set("name", cardName);
      params.set("game", game);
    }
    void fetch(`/api/valuation?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setValuation(data))
      .finally(() => setLoading(false));
  }, [cardName, cardId, game, condition]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!valuation || valuation.ourPriceCents <= 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Inteligência de preço</h2>
      <ValuationCard valuation={valuation} />
      <MarketPriceComparison valuation={valuation} />
    </section>
  );
}
