"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ConditionBadge, type CardCondition } from "@/components/cards/ConditionBadge";
import { formatCurrency } from "@/lib/format-currency";
import type { CardListing } from "@/types/card";
import { EmptyState } from "./EmptyState";

type Props = {
  listings: CardListing[];
  isLoading?: boolean;
};

export function ListingManager({ listings, isLoading }: Props) {
  const queryClient = useQueryClient();

  async function deactivate(listingId: string) {
    await fetch(`/api/seller/listings/${encodeURIComponent(listingId)}`, { method: "DELETE" });
    await queryClient.invalidateQueries({ queryKey: ["seller-listings"] });
  }

  if (isLoading) return <p className="text-luxury-mist">Carregando listagens…</p>;

  if (listings.length === 0) {
    return (
      <EmptyState
        title="Nenhuma listagem ainda"
        description='Abra uma carta no catálogo ou crie uma nova listagem.'
        action={
          <Button asChild>
            <Link href="/vendedor/painel/listagens/nova">Nova listagem</Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="space-y-3">
      {listings.map((listing) => (
        <li
          key={listing.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <div>
            <Link href={`/loja/cartas/${listing.cardId}`} className="font-medium hover:underline">
              {listing.cardName || "Carta"}
            </Link>
            <p className="text-xs text-luxury-mist">{listing.setName}</p>
            <div className="mt-1 flex items-center gap-2">
              <ConditionBadge condition={listing.condition as CardCondition} size="sm" />
              <span className="text-sm font-semibold">
                {formatCurrency(listing.price, listing.currency)}
              </span>
              <span className="text-xs text-luxury-mist">× {listing.quantity}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/vendedor/painel/listagens/${listing.id}`}>Editar</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void deactivate(listing.id)}>
              Desativar
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
