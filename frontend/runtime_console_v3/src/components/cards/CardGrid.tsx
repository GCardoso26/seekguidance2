import { CardGridSkeleton } from "@/components/cards/CardGridSkeleton";
import { CardCard } from "@/components/cards/CardCard";
import { CardImage } from "@/components/ui/CardImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { cardImageUrl, formatCurrency } from "@/lib/format-currency";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId, UnifiedCard } from "@/types/card";

export interface CardGridProps {
  cards: UnifiedCard[];
  viewMode?: "grid" | "list";
  isLoading?: boolean;
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

export function CardGrid({
  cards,
  viewMode = "grid",
  isLoading,
  hasMore,
  onLoadMore,
  emptyMessage = "Nenhuma carta encontrada",
  cardSource = "search_results",
  onViewDetail,
  onAddToDeck,
  onAddToCart,
}: CardGridProps) {
  if (isLoading && cards.length === 0) {
    return <CardGridSkeleton count={12} />;
  }

  if (!isLoading && cards.length === 0) {
    return (
      <EmptyState
        type="search"
        title={emptyMessage}
        description="Tente ajustar seus filtros ou buscar por outro termo."
        action={{ label: "Limpar filtros", href: "/loja/mtg/busca" }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {viewMode === "list" ? (
        <div className="space-y-3">
          {cards.map((card) => (
            <CardListItem
              key={card.id}
              card={card}
              onViewDetail={onViewDetail}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {cards.map((card, index) => (
            <CardCard
              key={card.id}
              card={card}
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
