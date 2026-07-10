"use client";

import { formatCurrency } from "@/lib/format-currency";
import { collectionStats, estimateCollectionValueCents } from "@/lib/collection";
import type { CollectionItem } from "@/hooks/useDeck";

interface CollectionStatsProps {
  items: CollectionItem[];
  estimatedValueCents?: number;
}

export function CollectionStats({ items, estimatedValueCents }: CollectionStatsProps) {
  const stats = collectionStats(items);
  const value =
    estimatedValueCents ??
    estimateCollectionValueCents(
      items.map((i) => ({
        quantity: i.quantity,
        card: i.card as { lowestPrice?: number } | undefined,
      })),
    );
  const topGames = Object.entries(stats.byGame)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="space-y-3" data-testid="collection-stats">
      <div className="flex flex-wrap gap-4 text-sm text-luxury-mist">
        <span>
          Valor estimado:{" "}
          <strong className="text-luxury-gold">{formatCurrency(value / 100)}</strong>
        </span>
        <span>
          <strong className="text-luxury-frost">{stats.totalCards}</strong> cartas
        </span>
        <span>
          <strong className="text-luxury-frost">{stats.uniqueCards}</strong> únicas
        </span>
        <span>
          <strong className="text-luxury-frost">{stats.duplicates}</strong> duplicatas
        </span>
        <span>
          <strong className="text-luxury-frost">{stats.foilCount}</strong> foil
        </span>
      </div>
      {topGames.length > 0 && (
        <p className="text-xs text-luxury-mist">
          Por jogo:{" "}
          {topGames.map(([game, qty]) => `${game} (${qty})`).join(" · ")}
        </p>
      )}
    </div>
  );
}
