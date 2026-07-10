"use client";

import Link from "next/link";
import {
  ChevronRight,
  Package,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConditionBadge, type CardCondition } from "@/components/cards/ConditionBadge";
import { formatCurrency } from "@/lib/format-currency";
import { isListingPurchasable } from "@/lib/listing-utils";
import type { CardListing, CardMarketSummary, UnifiedCard } from "@/types/card";
import { cn } from "@/lib/utils";

type Props = {
  card: UnifiedCard;
  listings: CardListing[];
  marketSummary?: CardMarketSummary | null;
  onBuy: (listing: CardListing) => void;
  onAddToCart: (listing: CardListing) => void;
  buying?: boolean;
  className?: string;
};

function TrustScore({ score }: { score: number }) {
  const label = score >= 4.5 ? "Excelente" : score >= 4 ? "Confiável" : score >= 3 ? "Bom" : "Novo";
  const tone =
    score >= 4.5 ? "text-success" : score >= 4 ? "text-primary" : "text-muted-foreground";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full border-2 bg-card text-center",
          score >= 4.5 ? "border-success/40" : "border-border",
        )}
        aria-label={`Trust score ${score.toFixed(1)}`}
      >
        <span className={cn("text-sm font-bold leading-none", tone)}>{score.toFixed(1)}</span>
        <Star className={cn("mt-0.5 h-2.5 w-2.5 fill-current", tone)} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-small font-semibold text-foreground">Trust Score</p>
        <p className="text-caption text-muted-foreground">{label} vendedor</p>
      </div>
    </div>
  );
}

export function CardBuyPanel({
  card,
  listings,
  marketSummary,
  onBuy,
  onAddToCart,
  buying,
  className,
}: Props) {
  const purchasable = listings.filter(isListingPurchasable);
  const best = purchasable[0] ?? null;
  const currency = best?.currency || marketSummary?.currency || card.latestPrice?.currency || "BRL";
  const bestPrice = best?.price ?? marketSummary?.bestOffer ?? card.lowestPrice ?? null;
  const storeCount = marketSummary?.storeCount ?? new Set(purchasable.map((l) => l.sellerId)).size;
  const listedQty = marketSummary?.listedQuantity ?? purchasable.reduce((s, l) => s + l.quantity, 0);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-card",
        className,
      )}
      aria-labelledby="buy-panel-title"
      data-testid="card-buy-panel"
    >
      <div className="border-b border-border bg-muted/20 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p id="buy-panel-title" className="section-title">
              {purchasable.length > 1 ? "A partir de" : "Melhor oferta"}
            </p>
            <p className="mt-1 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {bestPrice != null ? formatCurrency(bestPrice, currency) : "Indisponível"}
            </p>
            {marketSummary?.avgPrice != null && bestPrice != null && marketSummary.avgPrice > bestPrice && (
              <p className="mt-1 text-caption text-muted-foreground">
                Média do mercado: {formatCurrency(marketSummary.avgPrice, currency)}
              </p>
            )}
          </div>
          {best && best.quantity > 0 && (
            <Badge variant="success" className="shrink-0">
              {best.quantity} em estoque
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <dl className="grid grid-cols-2 gap-3 text-small">
          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <Store className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <dt className="text-caption text-muted-foreground">Lojas</dt>
              <dd className="font-semibold">{storeCount}</dd>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <Package className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <dt className="text-caption text-muted-foreground">Disponível</dt>
              <dd className="font-semibold">{listedQty} un.</dd>
            </div>
          </div>
        </dl>

        {best && (
          <>
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              {best.sellerAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={best.sellerAvatar}
                  alt=""
                  className="h-10 w-10 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {best.sellerName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-small font-semibold">{best.sellerName}</p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <ConditionBadge condition={best.condition as CardCondition} size="sm" />
                  {best.foil && (
                    <Badge variant="warning" className="text-caption">
                      Foil
                    </Badge>
                  )}
                  <span className="text-caption text-muted-foreground">{best.language?.toUpperCase()}</span>
                </div>
              </div>
              {best.sellerReputation >= 4.5 && (
                <ShieldCheck className="h-5 w-5 shrink-0 text-success" aria-label="Loja verificada" />
              )}
            </div>

            <TrustScore score={best.sellerReputation} />

            <div className="flex items-center gap-2 text-small text-muted-foreground">
              <Truck className="h-4 w-4 shrink-0" aria-hidden />
              <span>Frete calculado no carrinho · Melhor Envio</span>
            </div>
          </>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!best || buying}
            onClick={() => best && onBuy(best)}
            data-testid="card-buy-now"
          >
            <ShoppingCart className="mr-2 h-4 w-4" aria-hidden />
            Comprar agora
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={!best || buying}
            onClick={() => best && onAddToCart(best)}
          >
            Adicionar ao carrinho
          </Button>
        </div>

        {purchasable.length > 1 && (
          <Link
            href="#offers"
            className="flex items-center justify-center gap-1 text-small font-medium text-primary transition-colors hover:text-primary/80"
          >
            Comparar {purchasable.length} ofertas
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        )}

        {!best && purchasable.length === 0 && (
          <p className="text-center text-small text-muted-foreground">
            Nenhuma oferta comprável no momento. Crie um alerta de preço para ser notificado.
          </p>
        )}
      </div>
    </section>
  );
}
