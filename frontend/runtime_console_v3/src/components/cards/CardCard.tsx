"use client";

import { Eye, Layers, ShoppingCart, Sparkles } from "lucide-react";
import { CardImage } from "@/components/ui/CardImage";
import { PriceSparkline } from "@/components/cards/PriceSparkline";
import { Button } from "@/components/ui/button";
import { cardImageUrl, formatCurrency } from "@/lib/format-currency";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId, UnifiedCard } from "@/types/card";
import { cn } from "@/lib/utils";
import { useAnalytics } from "@/hooks/useAnalytics";

export interface CardCardProps {
  card: UnifiedCard;
  variant?: "compact" | "detailed";
  priority?: boolean;
  showPrice?: boolean;
  source?: "search_results" | "related" | "trending" | "detail";
  onAddToCart?: (card: UnifiedCard) => void;
  onAddToDeck?: (card: UnifiedCard) => void;
  onViewDetail?: (cardId: string) => void;
}

export function CardCard({
  card,
  variant = "compact",
  priority = false,
  showPrice = true,
  source = "search_results",
  onAddToCart,
  onAddToDeck,
  onViewDetail,
}: CardCardProps) {
  const gameToken = GAME_TOKENS[card.game as GameId];
  const hasFoil = card.latestPrice?.foil;
  const price = card.lowestPrice ?? card.latestPrice?.price;
  const trend = card.priceTrend7d;
  const imageSrc = cardImageUrl(card);
  const { track } = useAnalytics();

  function handleViewDetail() {
    track("card_view", {
      card_id: card.id,
      card_name: card.name,
      game: card.game,
      source,
    });
    onViewDetail?.(card.id);
  }

  return (
    <article
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card p-3 transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:scale-[1.03] hover:shadow-2xl hover:shadow-purple-500/10",
        variant === "detailed" && "p-4",
      )}
      role="article"
      aria-label={`${card.name}, ${card.set.name}, ${card.rarity}`}
    >
      <div className="relative aspect-[63/88] overflow-hidden rounded-lg bg-muted/30">
        <CardImage
          src={imageSrc}
          alt={card.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          listQuality={!priority}
          priority={priority}
        />

        {hasFoil && (
          <div className="absolute right-2 top-2" aria-label="Versão Foil">
            <Sparkles className="h-5 w-5 fill-yellow-400 text-yellow-400 drop-shadow-md" />
          </div>
        )}

        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="hidden font-medium text-white md:inline">Ver detalhes →</span>
        </div>

        <div className="absolute inset-0 hidden items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100 md:flex">
          <button
            type="button"
            onClick={handleViewDetail}
            className="min-h-11 min-w-11 rounded-full bg-white p-2 text-black hover:bg-gray-200"
            aria-label={`Ver detalhes de ${card.name}`}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onAddToDeck?.(card)}
            className="min-h-11 min-w-11 rounded-full bg-white p-2 text-black hover:bg-gray-200"
            aria-label={`Adicionar ${card.name} ao deck`}
          >
            <Layers className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onAddToCart?.(card)}
            className="min-h-11 min-w-11 rounded-full bg-primary p-2 text-primary-foreground hover:bg-primary/90"
            aria-label={`Adicionar ${card.name} ao carrinho`}
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight transition-colors group-hover:text-purple-400">
          {card.name}
        </h3>

        <p className="mt-1 text-xs text-muted-foreground">
          {card.set.name || card.set.code}
          {card.number ? ` • #${card.number}` : ""}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {card.rarity && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
              style={{
                backgroundColor: `${gameToken?.primary ?? "#666"}20`,
                color: gameToken?.primary ?? "#666",
              }}
            >
              {card.rarity}
            </span>
          )}
          {card.listingCount !== undefined && card.listingCount > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {card.listingCount} oferta{card.listingCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {showPrice && price !== undefined && (
          <div className="mt-auto pt-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-lg font-bold">
                {formatCurrency(price, card.latestPrice?.currency || "USD")}
              </span>
              {trend !== undefined && (
                <span
                  className={`flex items-center text-xs ${trend >= 0 ? "text-emerald-500" : "text-red-500"}`}
                >
                  {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
                </span>
              )}
            </div>
            {trend !== undefined && <PriceSparkline trend={trend} className="mt-1" />}
          </div>
        )}

        <div className="mt-2 flex gap-2 md:hidden">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-11 flex-1"
            onClick={handleViewDetail}
          >
            Ver
          </Button>
          <Button
            type="button"
            size="sm"
            className="min-h-11 flex-1"
            onClick={() => onAddToCart?.(card)}
          >
            <ShoppingCart className="mr-1 h-3 w-3" />
            Comprar
          </Button>
        </div>
      </div>
    </article>
  );
}
