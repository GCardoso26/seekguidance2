"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { DeckCardEntry } from "@/types/deck";
import { cardImageUrl } from "@/lib/format-currency";
import { formatCurrency } from "@/lib/format-currency";

interface DeckCardRowProps {
  deckCard: DeckCardEntry;
  onRemove: () => void;
  onQuantityChange: (quantity: number) => void;
  disabled?: boolean;
}

export function DeckCardRow({
  deckCard,
  onRemove,
  onQuantityChange,
  disabled,
}: DeckCardRowProps) {
  const imageSrc = cardImageUrl(deckCard.card);

  return (
    <div className="flex items-center gap-3 surface-card rounded-lg p-2 hover:bg-muted">
      <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded">
        <Image
          src={imageSrc}
          alt={deckCard.card.name}
          fill
          className="object-cover"
          sizes="32px"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{deckCard.card.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {deckCard.card.set?.name}
          {deckCard.card.lowestPrice !== null && deckCard.card.lowestPrice !== undefined
            ? ` · ${formatCurrency(deckCard.card.lowestPrice)}`
            : " · preço indisponível"}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onQuantityChange(deckCard.quantity - 1)}
          className="rounded p-1 hover:bg-muted disabled:opacity-40"
          aria-label="Diminuir quantidade"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-6 text-center text-sm font-medium">{deckCard.quantity}</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onQuantityChange(deckCard.quantity + 1)}
          className="rounded p-1 hover:bg-muted disabled:opacity-40"
          aria-label="Aumentar quantidade"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        className="rounded p-1 text-red-400 hover:bg-red-500/10 disabled:opacity-40"
        aria-label="Remover carta"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
