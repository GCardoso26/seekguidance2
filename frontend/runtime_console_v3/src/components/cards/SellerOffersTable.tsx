"use client";

import { useState } from "react";
import { ArrowUpDown, ShoppingCart, Store } from "lucide-react";
import { ConditionBadge, type CardCondition } from "@/components/cards/ConditionBadge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format-currency";
import { isListingPurchasable } from "@/lib/listing-utils";
import type { CardListing } from "@/types/card";

type SortKey = "price" | "condition" | "seller" | "quantity";

const CONDITION_ORDER: Record<string, number> = { NM: 0, LP: 1, MP: 2, HP: 3, DM: 4 };

interface SellerOffersTableProps {
  listings: CardListing[];
  onBuy?: (listing: CardListing) => void;
  buyingId?: string | null;
}

export function SellerOffersTable({ listings, onBuy, buyingId }: SellerOffersTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("price");
  const [sortAsc, setSortAsc] = useState(true);

  const sortedListings = [...listings].sort((a, b) => {
    let comparison = 0;
    switch (sortKey) {
      case "price":
        comparison = a.price - b.price;
        break;
      case "condition":
        comparison =
          (CONDITION_ORDER[a.condition] ?? 99) - (CONDITION_ORDER[b.condition] ?? 99);
        break;
      case "seller":
        comparison = a.sellerName.localeCompare(b.sellerName);
        break;
      case "quantity":
        comparison = a.quantity - b.quantity;
        break;
    }
    return sortAsc ? comparison : -comparison;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  if (listings.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <Store className="mx-auto mb-3 h-12 w-12 opacity-50" />
        <p>Nenhuma oferta disponível no momento.</p>
        <p className="text-sm">Crie um alerta de preço para ser notificado.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Vendedor</th>
            <th className="pb-2 pr-4 font-medium">
              <button
                type="button"
                className="inline-flex items-center gap-1 hover:text-foreground"
                onClick={() => toggleSort("condition")}
              >
                Condição
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </th>
            <th className="pb-2 pr-4 font-medium">
              <button
                type="button"
                className="inline-flex items-center gap-1 hover:text-foreground"
                onClick={() => toggleSort("price")}
              >
                Preço
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </th>
            <th className="pb-2 pr-4 font-medium">Qtd</th>
            <th className="pb-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {sortedListings.map((listing) => {
            const purchasable = isListingPurchasable(listing);
            const isBuying = buyingId === listing.id;
            return (
              <tr key={listing.id} className="border-b border-border/60">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    {listing.sellerAvatar && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={listing.sellerAvatar} alt="" className="h-6 w-6 rounded-full" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{listing.sellerName}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span aria-hidden="true">
                          {"★".repeat(Math.floor(listing.sellerReputation))}
                          {"☆".repeat(5 - Math.floor(listing.sellerReputation))}
                        </span>
                        <span>({listing.sellerReputation.toFixed(1)})</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <ConditionBadge condition={listing.condition as CardCondition} />
                  {listing.foil && (
                    <span className="ml-1 text-xs text-yellow-500" aria-label="Foil">
                      ✨
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4 font-semibold">
                  {formatCurrency(listing.price, listing.currency)}
                </td>
                <td className="py-3 pr-4">{listing.quantity}x</td>
                <td className="py-3">
                  {purchasable ? (
                    <Button
                      size="sm"
                      onClick={() => onBuy?.(listing)}
                      disabled={listing.quantity === 0 || isBuying}
                    >
                      <ShoppingCart className="mr-1 h-3 w-3" />
                      {isBuying ? "…" : "Comprar"}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Referência</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
