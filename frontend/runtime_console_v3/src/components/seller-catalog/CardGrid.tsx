"use client";

import type { CatalogCard } from "@/hooks/useCatalogCards";
import { CardGridItem } from "./CardGridItem";

type Props = {
  cards: CatalogCard[];
  onAddListing: (card: CatalogCard) => void;
};

export function CardGrid({ cards, onAddListing }: Props) {
  if (cards.length === 0) {
    return <p className="text-sm text-luxury-mist">Nenhuma carta encontrada. Tente outro termo ou jogo.</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((card) => (
        <CardGridItem key={card.id} card={card} onAdd={() => onAddListing(card)} />
      ))}
    </div>
  );
}
