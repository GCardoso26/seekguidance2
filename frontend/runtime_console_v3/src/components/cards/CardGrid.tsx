"use client";

import { CardGridSkeleton } from "@/components/cards/CardGridSkeleton";
import { CardCard } from "@/components/cards/CardCard";
import { CardImage } from "@/components/ui/CardImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { cardImageUrl, formatCurrency } from "@/lib/format-currency";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import { Search } from "lucide-react";
import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { trackEvent } from "@/lib/analytics";
import type { GameId, UnifiedCard } from "@/types/card";

export interface CardGridProps {
  cards: UnifiedCard[];
  viewMode?: "grid" | "list" | "gallery" | "compact" | "table";
  isLoading?: boolean;
  /** Quando true, não exibe empty state (erro de API tratado pelo pai). */
  isError?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: string;
  cardSource?: "search_results" | "related" | "trending" | "detail";
  onViewDetail?: (cardId: string) => void;
  onAddToDeck?: (card: UnifiedCard) => void;
  onAddToCart?: (card: UnifiedCard) => void;
}

function CardListItem({
  card,
  onViewDetail,
  onAddToCart,
}: {
  card: UnifiedCard;
  onViewDetail?: (cardId: string) => void;
  onAddToCart?: (card: UnifiedCard) => void;
}) {
  const gameToken = GAME_TOKENS[card.game as GameId] ?? null;
  const price = card.lowestPrice ?? card.latestPrice?.price;

  return (
    <article className="flex gap-4 rounded-lg border border-border bg-card p-3 transition hover:shadow-md">
      <button
        type="button"
        onClick={() => onViewDetail?.(card.id)}
        className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-md bg-muted/30"
      >
        <CardImage src={cardImageUrl(card)} alt={card.name} fill className="object-cover" sizes="72px" />
      </button>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <button
          type="button"
          onClick={() => onViewDetail?.(card.id)}
          className="text-left font-semibold hover:text-primary"
        >
          {card.name}
        </button>
        <p className="text-sm text-muted-foreground">
          {card.set.name} · {gameToken?.name ?? card.game}
          {card.number ? ` · #${card.number}` : ""}
        </p>
        {card.rarity && (
          <span className="mt-1 text-xs text-muted-foreground">{card.rarity}</span>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end justify-center gap-2">
        {price !== undefined && (
          <span className="text-lg font-bold">
            {formatCurrency(price, card.latestPrice?.currency ?? "USD")}
          </span>
        )}
        <Button type="button" size="sm" onClick={() => onAddToCart?.(card)}>
          Comprar
        </Button>
      </div>
    </article>
  );
}

function VirtualGalleryGrid({
  cards,
  cardSource,
  onViewDetail,
  onAddToDeck,
  onAddToCart,
}: {
  cards: UnifiedCard[];
  cardSource: CardGridProps["cardSource"];
  onViewDetail?: (cardId: string) => void;
  onAddToDeck?: (card: UnifiedCard) => void;
  onAddToCart?: (card: UnifiedCard) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const cols = 3;
  const rowCount = Math.ceil(cards.length / cols);
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300,
    overscan: 2,
  });

  return (
    <div ref={parentRef} className="max-h-[70vh] overflow-auto" data-testid="card-grid-virtual-gallery">
      <div style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const start = virtualRow.index * cols;
          const rowCards = cards.slice(start, start + cols);
          return (
            <div
              key={virtualRow.key}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {rowCards.map((card, index) => (
                <CardCard
                  key={card.id}
                  card={card}
                  variant="detailed"
                  priority={start + index < 8}
                  source={cardSource}
                  onViewDetail={onViewDetail}
                  onAddToDeck={onAddToDeck}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CardGrid({
  cards,
  viewMode = "grid",
  isLoading,
  isError,
  hasMore,
  onLoadMore,
  emptyMessage = "Nenhuma carta encontrada",
  cardSource = "search_results",
  onViewDetail,
  onAddToDeck,
  onAddToCart,
}: CardGridProps) {
  useEffect(() => {
    if (viewMode === "gallery" && cards.length > 48) {
      void trackEvent("gallery_mode", { virtualized: true, count: cards.length });
    }
  }, [viewMode, cards.length]);

  if (isLoading && cards.length === 0) {
    return <CardGridSkeleton count={12} />;
  }

  if (!isLoading && !isError && cards.length === 0) {
    return (
      <EmptyState
        icon={<Search className="h-10 w-10 text-muted-foreground" aria-hidden />}
        title={emptyMessage}
        description="Tente ajustar seus filtros ou buscar por outro termo."
        action={{ label: "Limpar filtros", href: "/loja/mtg/busca" }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {viewMode === "list" || viewMode === "table" ? (
        <div className={viewMode === "table" ? "overflow-x-auto rounded-lg border" : "space-y-3"}>
          {viewMode === "table" ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="p-2">Carta</th>
                  <th className="p-2">Expansão</th>
                  <th className="p-2">Nº</th>
                  <th className="p-2">Raridade</th>
                  <th className="p-2 text-right">Preço</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => {
                  const price = card.lowestPrice ?? card.latestPrice?.price;
                  return (
                    <tr
                      key={card.id}
                      className="cursor-pointer border-t hover:bg-muted/30"
                      onClick={() => onViewDetail?.(card.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onViewDetail?.(card.id);
                      }}
                      tabIndex={0}
                      role="link"
                    >
                      <td className="p-2 font-medium">{card.name}</td>
                      <td className="p-2 text-muted-foreground">{card.set?.name}</td>
                      <td className="p-2">{card.number}</td>
                      <td className="p-2 capitalize">{card.rarity}</td>
                      <td className="p-2 text-right font-semibold">
                        {price != null
                          ? formatCurrency(price, card.latestPrice?.currency ?? "USD")
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            cards.map((card) => (
              <CardListItem
                key={card.id}
                card={card}
                onViewDetail={onViewDetail}
                onAddToCart={onAddToCart}
              />
            ))
          )}
        </div>
      ) : viewMode === "gallery" && cards.length > 48 ? (
        <VirtualGalleryGrid
          cards={cards}
          cardSource={cardSource}
          onViewDetail={onViewDetail}
          onAddToDeck={onAddToDeck}
          onAddToCart={onAddToCart}
        />
      ) : (
        <div
          className={
            viewMode === "gallery"
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
              : viewMode === "compact"
                ? "grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
                : "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          }
        >
          {cards.map((card, index) => (
            <CardCard
              key={card.id}
              card={card}
              variant={viewMode === "gallery" ? "detailed" : "compact"}
              priority={index < 8}
              source={cardSource}
              onViewDetail={onViewDetail}
              onAddToDeck={onAddToDeck}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center py-6">
          <Button type="button" variant="outline" onClick={onLoadMore} disabled={isLoading} loading={isLoading}>
            {isLoading ? "Carregando…" : "Carregar mais"}
          </Button>
        </div>
      )}
    </div>
  );
}
