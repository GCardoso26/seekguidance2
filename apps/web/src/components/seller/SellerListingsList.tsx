"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getApiClients } from "@/src/api";
import { getPersistedSellerId } from "@/src/auth/seller-funnel";
import { formatPriceCents } from "@/src/lib/format";
import { EmptyState, ErrorState, Loading } from "@/src/components/ui";

export function SellerListingsList() {
  const sellerId = getPersistedSellerId();
  const { marketplaceApi } = getApiClients();

  const query = useQuery({
    queryKey: ["seller-listings", sellerId],
    queryFn: () => marketplaceApi.listSellerListings(sellerId!),
    enabled: Boolean(sellerId),
  });

  if (!sellerId) {
    return (
      <EmptyState
        title="Loja não encontrada nesta sessão"
        description="Crie a loja novamente ou publique um anúncio para sincronizar."
      />
    );
  }

  if (query.isPending) return <Loading label="Carregando anúncios…" />;
  if (query.isError) {
    return (
      <ErrorState
        title="Não foi possível carregar anúncios"
        description="Tente novamente em instantes."
      />
    );
  }

  const items = query.data?.items ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nenhum anúncio ainda"
        description="Publique o primeiro em menos de um minuto."
      />
    );
  }

  return (
    <ul className="divide-y divide-zinc-200">
      {items.map((listing) => (
        <li key={listing.id} className="flex items-center justify-between gap-3 py-3 text-sm">
          <div>
            <p className="font-mono text-xs text-zinc-500">{listing.id.slice(0, 8)}…</p>
            <p className="text-zinc-800">
              {listing.condition} · {listing.language.toUpperCase()} · qtd {listing.quantity} ·{" "}
              {listing.status}
            </p>
            <p className="font-medium text-zinc-900">
              {formatPriceCents(listing.priceCents, listing.currency)}
            </p>
          </div>
          <Link
            href={`/cards/${encodeURIComponent(listing.catalogCardId)}`}
            className="text-emerald-800 underline"
          >
            Ver na carta
          </Link>
        </li>
      ))}
    </ul>
  );
}
