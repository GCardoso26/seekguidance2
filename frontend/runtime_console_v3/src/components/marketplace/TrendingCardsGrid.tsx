"use client";

import { useEffect, useState } from "react";
import { PriceTrendCard, type PriceTrendItem } from "@/components/marketplace/PriceTrendCard";
import { gameSlugFromId } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

type TrendCard = {
  id: string;
  name: string;
  game?: string;
  set?: { name?: string };
  imageUris?: { normal?: string; large?: string };
  latestPrice?: { price?: number; currency?: string };
  priceTrend7d?: number | null;
};

const FALLBACK: PriceTrendItem[] = [
  { cardId: "1", name: "Lightning Bolt", setName: "Modern Horizons 3", change7d: 12.4 },
  { cardId: "2", name: "Charizard ex", setName: "Obsidian Flames", change7d: -8.2 },
  { cardId: "3", name: "Sol Ring", setName: "Commander Masters", change7d: 5.1 },
];

function mapTrend(card: TrendCard): PriceTrendItem {
  const slug = card.game ? gameSlugFromId(card.game as GameId) : "mtg";
  return {
    cardId: card.id,
    name: card.name,
    setName: card.set?.name || "",
    imageUrl: card.imageUris?.normal || card.imageUris?.large,
    price: card.latestPrice?.price,
    currency: card.latestPrice?.currency || "USD",
    change7d: card.priceTrend7d ?? 0,
    href: `/loja/${slug}/cartas/${card.id}`,
  };
}

export function TrendingCardsGrid() {
  const [items, setItems] = useState<PriceTrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trends?limit=6")
      .then((r) => r.json())
      .then((data: { trends?: TrendCard[] }) => {
        const mapped = (data.trends || []).map(mapTrend);
        setItems(mapped.length ? mapped : FALLBACK);
      })
      .catch(() => setItems(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3" data-testid="featured-cards-loading">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-lg bg-muted/40" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3" data-testid="featured-cards">
      {items.map((trend) => (
        <PriceTrendCard key={trend.cardId} trend={trend} />
      ))}
    </div>
  );
}
