"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { DeckCardEntry } from "@/types/deck";
import { cardImageUrl, formatCurrency } from "@/lib/format-currency";
import { useUserCollection } from "@/hooks/useDeck";

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
  const { data: collection = [] } = useUserCollection();
  const have = collection
    .filter((c) => c.card_id === deckCard.card_id)
    .reduce((s, c) => s + c.quantity, 0);
  const need = Math.max(0, deckCard.quantity - have);

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
        <p className="truncate text-xs" data-testid="deck-card-collection-status">
          {need === 0 ? (
            <span className="text-success">Tenho ✓</span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400">Preciso de {need}</span>
          )}
          {have > deckCard.quantity ? (
            <span className="text-muted-foreground"> · Duplicada</span>
          ) : null}
          {" · "}
          <Link
            href={`/loja/busca?q=${encodeURIComponent(deckCard.card.name)}`}
            className="text-primary hover:underline"
          >
            Comprar
          </Link>
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
        className="rounded p-1 text-danger hover:bg-red-500/10 disabled:opacity-40"
        aria-label="Remover carta"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
