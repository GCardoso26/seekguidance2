"use client";

import { useDroppable } from "@dnd-kit/core";
import type { DeckCardEntry } from "@/types/deck";
import { DeckCardRow } from "./DeckCardRow";
import { cn } from "@/lib/utils";

interface DeckZoneProps {
  id: string;
  label: string;
  cards: DeckCardEntry[];
  maxCards: number;
  onRemove: (deckCardId: string) => void;
  onQuantityChange: (deckCardId: string, quantity: number) => void;
  busy?: boolean;
}

export function DeckZone({
  id,
  label,
  cards,
  maxCards,
  onRemove,
  onQuantityChange,
  busy,
}: DeckZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0);
  const exceeded = totalCards > maxCards;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border-2 border-dashed p-4 min-h-[180px] transition-colors",
        isOver ? "border-luxury-gold bg-luxury-gold/5" : "border-white/15",
        exceeded && "border-red-500/70 bg-red-500/5",
      )}
    >
      <div className="mb-2 flex items-center justify-between text-sm text-luxury-mist">
        <span className="font-medium text-luxury-frost">{label}</span>
        <span className={cn(exceeded && "text-red-400")}>
          {totalCards} / {maxCards}
        </span>
      </div>

      <div className="space-y-2">
        {cards.map((deckCard) => (
          <DeckCardRow
            key={deckCard.id}
            deckCard={deckCard}
            disabled={busy}
            onRemove={() => onRemove(deckCard.id)}
            onQuantityChange={(qty) => {
              if (qty <= 0) onRemove(deckCard.id);
              else onQuantityChange(deckCard.id, qty);
            }}
          />
        ))}

        {cards.length === 0 && (
          <p className="py-8 text-center text-sm text-luxury-mist">
            Arraste cartas aqui ou clique para adicionar
          </p>
        )}
      </div>
    </div>
  );
}
