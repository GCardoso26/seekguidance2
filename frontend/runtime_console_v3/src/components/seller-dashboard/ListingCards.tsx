"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConditionBadge, type CardCondition } from "@/components/cards/ConditionBadge";
import { formatCurrency } from "@/lib/format-currency";
import type { SellerListingRow } from "@/types/seller-listing";

type Props = {
  listings: SellerListingRow[];
  onDeactivate: (listingId: string) => void;
};

const STATUS_LABEL: Record<string, string> = {
  active: "Ativa",
  inactive: "Inativa",
  sold: "Vendida",
  reserved: "Reservada",
};

export function ListingCards({ listings, onDeactivate }: Props) {
  return (
    <ul className="space-y-3" data-testid="listing-cards">
      {listings.map((listing) => (
        <li
          key={listing.id}
          className="surface-card p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link
                href={`/loja/cartas/${listing.cardId}`}
                className="font-medium hover:text-primary hover:underline"
              >
                {listing.cardName || "Carta"}
              </Link>
              <p className="text-xs text-muted-foreground">{listing.setName}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ConditionBadge condition={listing.condition as CardCondition} size="sm" />
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(listing.price, listing.currency)}
                </span>
                <span className="text-xs text-muted-foreground">× {listing.quantity}</span>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                  {STATUS_LABEL[listing.status ?? "active"] ?? listing.status}
                </span>
              </div>
              {listing.createdAt && (
                <p className="mt-1 text-xs text-muted-foreground/70">
                  {new Date(listing.createdAt).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" asChild className="border-border">
                <Link href={`/vendedor/painel/listagens/${listing.id}`}>Editar</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDeactivate(listing.id)}>
                Desativar
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
