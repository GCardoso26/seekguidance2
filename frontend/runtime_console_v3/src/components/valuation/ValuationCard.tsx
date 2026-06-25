"use client";

import type { ValuationResult } from "@/lib/pricing/valuation-engine";
import { formatCurrency } from "@/lib/format-currency";
import { ConfidenceBadge } from "@/components/valuation/ConfidenceBadge";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface ValuationCardProps {
  valuation: ValuationResult;
}

export function ValuationCard({ valuation }: ValuationCardProps) {
  const trend = valuation.explanation.trendAnalysis;
  const TrendIcon =
    trend.direction === "up" ? TrendingUp : trend.direction === "down" ? TrendingDown : Minus;

  return (
    <article className="rounded-xl border border-white/10 bg-luxury-obsidian p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-luxury-frost">{valuation.cardName}</h3>
          <p className="text-sm text-luxury-mist">Condição {valuation.condition}</p>
        </div>
        <ConfidenceBadge confidence={valuation.confidence} />
      </div>

      <p className="mt-4 text-3xl font-bold text-emerald-400">
        {formatCurrency(valuation.ourPriceCents / 100, "BRL")}
      </p>
      <p className="mt-1 text-sm text-luxury-mist">Preço justo estimado</p>

      <div className="mt-4 flex items-center gap-2 text-sm">
        <TrendIcon className="h-4 w-4 text-luxury-gold" />
        <span>{valuation.explanation.summary}</span>
      </div>

      <ul className="mt-6 space-y-3">
        {valuation.explanation.factors.map((factor) => (
          <li key={factor.name} className="rounded-lg bg-luxury-onyx/60 px-3 py-2 text-sm">
            <p className="font-medium text-luxury-frost">{factor.name}</p>
            <p className="text-luxury-mist">{factor.description}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
