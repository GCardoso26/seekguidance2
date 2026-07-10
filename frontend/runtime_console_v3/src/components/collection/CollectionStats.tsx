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
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>
          Valor estimado:{" "}
          <strong className="text-primary">{formatCurrency(value / 100)}</strong>
        </span>
        <span>
          <strong className="text-foreground">{stats.totalCards}</strong> cartas
        </span>
        <span>
          <strong className="text-foreground">{stats.uniqueCards}</strong> únicas
        </span>
        <span>
          <strong className="text-foreground">{stats.duplicates}</strong> duplicatas
        </span>
        <span>
          <strong className="text-foreground">{stats.foilCount}</strong> foil
        </span>
      </div>
      {topGames.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Por jogo:{" "}
          {topGames.map(([game, qty]) => `${game} (${qty})`).join(" · ")}
        </p>
      )}
    </div>
  );
}
