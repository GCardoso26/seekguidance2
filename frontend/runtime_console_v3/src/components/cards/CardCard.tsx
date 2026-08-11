"use client";

import { Eye, Layers, ShoppingCart } from "lucide-react";
import { CardImage } from "@/components/ui/CardImage";
import { PriceSparkline } from "@/components/cards/PriceSparkline";
import { FoilShinyText } from "@/components/gallery/FoilShinyText";
import { RarityBadge } from "@/components/catalog/RarityBadge";
import { formatRarityDisplay } from "@/lib/game-config/rarity";
import { Button } from "@/components/ui/button";
import { cardImageUrl, formatCurrency } from "@/lib/format-currency";
import { offerCountLabel } from "@/features/search/conversion";
import type { UnifiedCard } from "@/types/card";
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
  const hasFoil = card.latestPrice?.foil;
  const price = card.lowestPrice ?? card.latestPrice?.price;
  const currency = card.priceCurrency || card.latestPrice?.currency || "BRL";
  const trend = card.priceTrend7d;
  const imageSrc = cardImageUrl(card);
  const stock = card.availableStock ?? card.marketplaceStock;
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
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-card-hover",
        variant === "detailed" && "p-1",
      )}
      role="article"
      aria-label={`${card.name}, ${card.set.name}, ${formatRarityDisplay(card.game, card.rarity)}`}
      onClick={handleViewDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleViewDetail();
        }
      }}
      tabIndex={0}
    >
      <div className={cn("relative aspect-[63/88] overflow-hidden rounded-lg bg-muted/30", variant === "detailed" && "m-3 mb-0")}>
        <CardImage
          src={imageSrc}
          alt={card.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          listQuality={!priority}
          priority={priority}
        />

        {hasFoil && (
          <div className="absolute right-2 top-2 rounded-md border border-border bg-card/95 px-1.5 py-0.5" aria-label="Versão Foil">
            <FoilShinyText text="Foil" variant="seal" />
          </div>
        )}

        <div className="absolute inset-0 hidden items-center justify-center gap-2 bg-foreground/5 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100 md:flex">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-10 w-10 rounded-full shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetail();
            }}
            aria-label={`Ver oferta de ${card.name}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-10 w-10 rounded-full shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              onAddToDeck?.(card);
            }}
            aria-label={`Adicionar ${card.name} ao deck`}
          >
            <Layers className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            className="h-10 w-10 rounded-full shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.(card);
            }}
            aria-label={`Adicionar ${card.name} ao carrinho`}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className={cn("flex flex-1 flex-col p-4", variant === "detailed" && "p-5")}>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {card.name}
        </h3>

        <p className="mt-1 text-caption text-muted-foreground">
          {card.set.name || card.set.code}
          {card.number ? ` · #${card.number}` : ""}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {card.rarity && <RarityBadge game={card.game} rarity={card.rarity} />}
          {card.listingCount !== undefined && card.listingCount > 0 ? (
            <span className="text-caption text-muted-foreground" data-testid="card-offer-count">
              {offerCountLabel(card.listingCount)}
              {stock != null && stock > 0 ? ` · ${stock} un.` : ""}
            </span>
          ) : card.listingCount === 0 ? (
            <span className="text-caption text-muted-foreground" data-testid="card-no-offers">
              {offerCountLabel(0)}
            </span>
          ) : null}
        </div>

        {showPrice && price !== undefined ? (
          <div className="mt-auto pt-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-lg font-semibold tracking-tight">
                {formatCurrency(price, currency)}
              </span>
              {trend !== undefined && (
                <span
                  className={cn(
                    "flex items-center text-caption font-medium",
                    trend >= 0 ? "text-success" : "text-danger",
                  )}
                >
                  {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
                </span>
              )}
            </div>
            {trend !== undefined && <PriceSparkline trend={trend} className="mt-1" />}
          </div>
        ) : showPrice ? (
          <p className="mt-auto pt-3 text-caption text-muted-foreground">Preço sob consulta nas ofertas</p>
        ) : null}

        <div className="mt-3 flex gap-2 md:hidden">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-11 flex-1"
            aria-label={`Ver detalhes de ${card.name}`}
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetail();
            }}
          >
            Ver
          </Button>
          <Button
            type="button"
            size="sm"
            className="min-h-11 flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.(card);
            }}
          >
            <ShoppingCart className="mr-1 h-3 w-3" />
            Comprar
          </Button>
        </div>
      </div>
    </article>
  );
}
