"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format-currency";
import { addProductToCart } from "@/lib/marketplace-shop";
import { getListingProductId } from "@/lib/listing-utils";
import type { Deck } from "@/types/deck";
import type { CardListing } from "@/types/card";
import { useCartStore } from "@/stores/cartStore";

interface BuyDeckButtonProps {
  deck: Deck;
}

export function BuyDeckButton({ deck }: BuyDeckButtonProps) {
  const router = useRouter();
  const openCart = useCartStore((s) => s.openCart);
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    try {
      const cards = [...deck.main_deck, ...deck.sideboard];
      let added = 0;

      for (const entry of cards) {
        const res = await fetch(
          `/api/marketplace/listings/by-card/${entry.card_id}?condition=NM`,
        );
        if (!res.ok) continue;
        const data = (await res.json()) as { listings?: CardListing[] };
        const listing = data.listings?.[0];
        const productId = listing ? getListingProductId(listing) : null;
        if (!productId) continue;
        const result = await addProductToCart(productId, entry.quantity);
        if (result.ok) added += 1;
      }

      if (added === 0) {
        alert("Nenhuma oferta disponível para as cartas deste deck.");
        return;
      }

      openCart();
      router.push("/marketplace/checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" size="sm" onClick={handleBuy} disabled={loading || deck.total_cards === 0}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
      Comprar deck — {formatCurrency(deck.total_price / 100)}
    </Button>
  );
}
