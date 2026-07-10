"use client";

import Link from "next/link";
import { Store, Truck, ShieldCheck, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format-currency";
import { isListingPurchasable } from "@/lib/listing-utils";
import type { CardListing, CardMarketSummary, UnifiedCard } from "@/types/card";

type Props = {
  card: UnifiedCard;
  listings: CardListing[];
  marketSummary?: CardMarketSummary | null;
  onBuy: (listing: CardListing) => void;
  onAddToCart: (listing: CardListing) => void;
  buying?: boolean;
};

export function CardBuyPanel({
  card,
  listings,
  marketSummary,
  onBuy,
  onAddToCart,
  buying,
}: Props) {
  const purchasable = listings.filter(isListingPurchasable);
  const best = purchasable[0] ?? null;
  const currency = best?.currency || marketSummary?.currency || card.latestPrice?.currency || "BRL";
  const bestPrice = best?.price ?? marketSummary?.bestOffer ?? card.lowestPrice ?? null;

  return (
    <section
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
      aria-labelledby="buy-panel-title"
      data-testid="card-buy-panel"
    >
      <h2 id="buy-panel-title" className="text-sm font-semibold text-muted-foreground">
        Melhor oferta
      </h2>

      <p className="mt-1 text-3xl font-bold tracking-tight">
        {bestPrice != null ? formatCurrency(bestPrice, currency) : "Indisponível"}
      </p>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Store className="h-3.5 w-3.5" aria-hidden />
          <dt className="sr-only">Lojas</dt>
          <dd>{marketSummary?.storeCount ?? purchasable.length} lojas</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
          <dt className="sr-only">Disponível</dt>
          <dd>{marketSummary?.listedQuantity ?? best?.quantity ?? 0} un.</dd>
        </div>
        {best && (
          <>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
              <dd>
                {best.sellerName}
                {best.sellerReputation >= 4.5 ? " · verificada" : ""}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" aria-hidden />
              <dd>Trust {best.sellerReputation.toFixed(1)}</dd>
            </div>
          </>
        )}
      </dl>

      {best && (
        <p className="mt-2 text-xs text-muted-foreground">
          {best.condition}
          {best.foil ? " · Foil" : ""} · {best.language?.toUpperCase()}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          className="flex-1"
          disabled={!best || buying}
          onClick={() => best && onBuy(best)}
          data-testid="card-buy-now"
        >
          Comprar agora
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={!best || buying}
          onClick={() => best && onAddToCart(best)}
        >
          Carrinho
        </Button>
      </div>

      {purchasable.length > 1 && (
        <Link
          href="#offers"
          className="mt-3 block text-center text-xs font-medium text-primary hover:underline"
        >
          Comparar {purchasable.length} ofertas
        </Link>
      )}
    </section>
  );
}
