"use client";

import { formatCurrency } from "@/lib/format-currency";
import { collectionStats } from "@/lib/collection";
import type { CollectionItem } from "@/hooks/useDeck";

interface CollectionStatsProps {
  items: CollectionItem[];
  estimatedValueCents?: number;
}

export function CollectionStats({ items, estimatedValueCents = 0 }: CollectionStatsProps) {
  const stats = collectionStats(items);

  return (
    <div className="flex flex-wrap gap-4 text-sm text-luxury-mist">
      <span>
        Valor estimado:{" "}
        <strong className="text-luxury-gold">{formatCurrency(estimatedValueCents / 100)}</strong>
      </span>
      <span>
        <strong className="text-luxury-frost">{stats.totalCards}</strong> cartas
      </span>
      <span>
        <strong className="text-luxury-frost">{stats.foilCount}</strong> foil
      </span>
    </div>
  );
}
