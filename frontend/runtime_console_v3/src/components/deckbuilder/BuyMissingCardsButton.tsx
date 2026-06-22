"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Deck } from "@/types/deck";

interface BuyMissingCardsButtonProps {
  deck: Deck;
  ownedCardIds: string[];
}

export function BuyMissingCardsButton({ deck, ownedCardIds }: BuyMissingCardsButtonProps) {
  const router = useRouter();
  const owned = useMemo(() => new Set(ownedCardIds), [ownedCardIds]);

  const missingIds = useMemo(() => {
    const ids = [...deck.main_deck, ...deck.sideboard]
      .map((entry) => entry.card_id)
      .filter((id, idx, arr) => arr.indexOf(id) === idx)
      .filter((id) => !owned.has(id));
    return ids;
  }, [deck.main_deck, deck.sideboard, owned]);

  const gameSlug = deck.game.toLowerCase();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={missingIds.length === 0}
      onClick={() => {
        const params = new URLSearchParams();
        for (const id of missingIds) params.append("card_id", id);
        router.push(`/loja/${gameSlug}/busca?${params.toString()}`);
      }}
    >
      <ShoppingBag className="mr-2 h-4 w-4" />
      Comprar faltantes ({missingIds.length})
    </Button>
  );
}
