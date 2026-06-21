import { CardGridSkeleton } from "@/components/cards/CardGridSkeleton";
import { CardCard } from "@/components/cards/CardCard";
import { Button } from "@/components/ui/button";
import type { UnifiedCard } from "@/types/card";
import { SearchX } from "lucide-react";

export interface CardGridProps {
  cards: UnifiedCard[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: string;
  onViewDetail?: (cardId: string) => void;
  onAddToDeck?: (card: UnifiedCard) => void;
  onAddToCart?: (card: UnifiedCard) => void;
}

export function CardGrid({
  cards,
  isLoading,
  hasMore,
  onLoadMore,
  emptyMessage = "Nenhuma carta encontrada",
  onViewDetail,
  onAddToDeck,
  onAddToCart,
}: CardGridProps) {
  if (isLoading && cards.length === 0) {
    return <CardGridSkeleton count={12} />;
  }

  if (!isLoading && cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16" role="status">
        <SearchX className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden />
        <p className="text-lg text-muted-foreground">{emptyMessage}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Tente ajustar seus filtros ou termos de busca
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {cards.map((card, index) => (
          <CardCard
            key={card.id}
            card={card}
            priority={index < 8}
            onViewDetail={onViewDetail}
            onAddToDeck={onAddToDeck}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center py-6">
          <Button type="button" variant="outline" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? "Carregando…" : "Carregar mais"}
          </Button>
        </div>
      )}
    </div>
  );
}
