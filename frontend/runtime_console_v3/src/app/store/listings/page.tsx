"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { ConditionBadge, type CardCondition } from "@/components/cards/ConditionBadge";
import { formatCurrency } from "@/lib/format-currency";
import type { CardListing } from "@/types/card";

async function fetchMyListings(): Promise<CardListing[]> {
  const res = await fetch("/api/marketplace/listings");
  if (res.status === 401) throw new Error("login_required");
  if (!res.ok) throw new Error("fetch_failed");
  const data = (await res.json()) as { listings: CardListing[] };
  return data.listings ?? [];
}

export default function SellerListingsPage() {
  const queryClient = useQueryClient();
  const { data: listings = [], isLoading, error } = useQuery({
    queryKey: ["my-listings"],
    queryFn: fetchMyListings,
  });

  async function deactivate(listingId: string) {
    await fetch(`/api/marketplace/listings/${encodeURIComponent(listingId)}`, { method: "DELETE" });
    await queryClient.invalidateQueries({ queryKey: ["my-listings"] });
  }

  if (error instanceof Error && error.message === "login_required") {
    return (
      <MobileLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Faça login para gerenciar suas listagens.</p>
          <Button asChild className="mt-4">
            <Link href="/login?next=/vendedor/painel/listagens">Entrar</Link>
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Link href="/vendedor/painel" className="text-sm text-muted-foreground hover:text-foreground">
          ← Painel do vendedor
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Minhas listagens de cartas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cartas do catálogo que você listou para venda.
        </p>

        {isLoading && <p className="mt-8 text-muted-foreground">Carregando…</p>}

        {!isLoading && listings.length === 0 && (
          <p className="mt-8 text-center text-muted-foreground">
            Nenhuma listagem ainda. Abra uma carta no catálogo e use &quot;Listar para venda&quot;.
          </p>
        )}

        <ul className="mt-6 space-y-3">
          {listings.map((listing) => (
            <li
              key={listing.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div>
                <Link href={`/loja/cartas/${listing.cardId}`} className="font-medium hover:underline">
                  {listing.cardName || "Carta"}
                </Link>
                <p className="text-xs text-muted-foreground">{listing.setName}</p>
                <div className="mt-1 flex items-center gap-2">
                  <ConditionBadge condition={listing.condition as CardCondition} size="sm" />
                  <span className="text-sm font-semibold">
                    {formatCurrency(listing.price, listing.currency)}
                  </span>
                  <span className="text-xs text-muted-foreground">× {listing.quantity}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/loja/cartas/${listing.cardId}`}>Ver</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deactivate(listing.id)}>
                  Desativar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </MobileLayout>
  );
}
