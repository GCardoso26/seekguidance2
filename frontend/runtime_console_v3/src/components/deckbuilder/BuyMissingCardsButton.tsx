"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Deck } from "@/types/deck";
import type { CollectionItem } from "@/hooks/useDeck";
import { buildMissingCardsSearchUrl, calculateMissingCards } from "@/lib/deck-pricing";

interface BuyMissingCardsButtonProps {
  deck: Deck;
  collection: CollectionItem[];
}

export function BuyMissingCardsButton({ deck, collection }: BuyMissingCardsButtonProps) {
  const router = useRouter();

  const missing = useMemo(() => {
    const allCards = [...deck.main_deck, ...deck.sideboard, ...deck.commander];
    return calculateMissingCards(
      allCards,
      collection.map((c) => ({ card_id: c.card_id, quantity: c.quantity })),
    );
  }, [deck, collection]);

  const gameSlug = deck.game.toLowerCase();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={missing.length === 0}
      onClick={() => router.push(buildMissingCardsSearchUrl(gameSlug, missing))}
      title={
        missing.length > 0
          ? missing.map((m) => `${m.missing}x ${m.name} (tem ${m.owned}/${m.needed})`).join(", ")
          : undefined
      }
    >
      <ShoppingBag className="mr-2 h-4 w-4" />
      Comprar faltantes ({missing.length})
    </Button>
  );
}
