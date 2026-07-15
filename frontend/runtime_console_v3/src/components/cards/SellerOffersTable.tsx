"use client";

import { useState } from "react";
import { ArrowUpDown, ShoppingCart, Store } from "lucide-react";
import { ConditionBadge, type CardCondition } from "@/components/cards/ConditionBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/format-currency";
import { isListingPurchasable } from "@/lib/listing-utils";
import { sellerInitial } from "@/lib/normalize-card-listing";
import type { CardListing } from "@/types/card";
import { cn } from "@/lib/utils";

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
        comparison = (CONDITION_ORDER[a.condition] ?? 99) - (CONDITION_ORDER[b.condition] ?? 99);
        break;
      case "seller":
        comparison = (a.sellerName || "").localeCompare(b.sellerName || "");
        break;
      case "quantity":
        comparison = a.quantity - b.quantity;
        break;
    }
    return sortAsc ? comparison : -comparison;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  if (listings.length === 0) {
    return (
      <div className="py-10 text-center">
        <Store className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" aria-hidden />
        <p className="text-body font-medium">Nenhuma oferta disponível</p>
        <p className="mt-1 text-small text-muted-foreground">Crie um alerta de preço para ser notificado.</p>
      </div>
    );
  }

  const SortBtn = ({ label, col }: { label: string; col: SortKey }) => (
    <button
      type="button"
      className="inline-flex items-center gap-1 hover:text-foreground"
      onClick={() => toggleSort(col)}
    >
      {label}
      <ArrowUpDown className={cn("h-3 w-3", sortKey === col && "text-primary")} aria-hidden />
    </button>
  );

  return (
    <DataTable className="border-0 shadow-none" stickyHeader density="comfortable">
      <DataTableHeader>
        <tr>
          <DataTableHead>Vendedor</DataTableHead>
          <DataTableHead>
            <SortBtn label="Condição" col="condition" />
          </DataTableHead>
          <DataTableHead>
            <SortBtn label="Preço" col="price" />
          </DataTableHead>
          <DataTableHead>Qtd</DataTableHead>
          <DataTableHead className="text-right">Ação</DataTableHead>
        </tr>
      </DataTableHeader>
      <DataTableBody>
        {sortedListings.map((listing) => {
          const purchasable = isListingPurchasable(listing);
          const isBuying = buyingId === listing.id;
          return (
            <DataTableRow key={listing.id}>
              <DataTableCell>
                <div className="flex items-center gap-2.5">
                  {listing.sellerAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={listing.sellerAvatar} alt="" className="h-8 w-8 rounded-full border border-border" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {sellerInitial(listing.sellerName)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-small font-medium">{listing.sellerName || "Loja"}</p>
                    <p className="text-caption text-muted-foreground">
                      Nota {(listing.sellerReputation ?? 0).toFixed(1)}
                    </p>
                  </div>
                </div>
              </DataTableCell>
              <DataTableCell>
                <div className="flex items-center gap-1.5">
                  <ConditionBadge condition={listing.condition as CardCondition} />
                  {listing.foil && (
                    <Badge variant="warning" className="text-caption">
                      Foil
                    </Badge>
                  )}
                </div>
              </DataTableCell>
              <DataTableCell>
                <span className="font-mono font-semibold">
                  {formatCurrency(listing.price, listing.currency)}
                </span>
              </DataTableCell>
              <DataTableCell>{listing.quantity}×</DataTableCell>
              <DataTableCell className="text-right">
                {purchasable ? (
                  <Button size="sm" onClick={() => onBuy?.(listing)} disabled={listing.quantity === 0 || isBuying}>
                    <ShoppingCart className="mr-1 h-3 w-3" aria-hidden />
                    {isBuying ? "…" : "Comprar"}
                  </Button>
                ) : (
                  <span className="text-caption text-muted-foreground">Referência</span>
                )}
              </DataTableCell>
            </DataTableRow>
          );
        })}
      </DataTableBody>
    </DataTable>
  );
}
