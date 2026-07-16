"use client";

import { useEffect, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { getApiClients } from "@/src/api";
import { Analytics } from "@/src/analytics/events";
import { formatPriceCents } from "@/src/lib/format";
import type { CardOffersResponse, ListingResponse } from "@/src/types/api";
import { EmptyState, ErrorState, Loading } from "@/src/components/ui";
import { AddToCartButton } from "@/src/components/buyer/AddToCartButton";

function OfferRow({
  offer,
  storeName,
  cardId,
  cardName,
}: {
  offer: ListingResponse;
  storeName: string;
  cardId: string;
  cardName: string;
}) {
  return (
    <tr className="border-t border-zinc-200 text-sm text-zinc-800">
      <td className="py-3 pr-3 font-medium">{storeName}</td>
      <td className="py-3 pr-3">{offer.condition}</td>
      <td className="py-3 pr-3 uppercase">{offer.language}</td>
      <td className="py-3 pr-3 text-right tabular-nums">
        {formatPriceCents(offer.priceCents, offer.currency || "BRL")}
      </td>
      <td className="py-3 pl-2 text-right">
        <AddToCartButton
          offer={offer}
          cardId={cardId}
          cardName={cardName}
          storeName={storeName}
        />
      </td>
    </tr>
  );
}

/**
 * Marketplace offers — independent of Catalog block.
 */
export function OffersBlock({
  cardId,
  cardName,
  status,
  data,
}: {
  cardId: string;
  cardName: string;
  status: "pending" | "error" | "success";
  data?: CardOffersResponse;
}) {
  const sellerIds = useMemo(
    () => [...new Set((data?.offers ?? []).map((o) => o.sellerId))],
    [data?.offers],
  );

  const { marketplaceApi } = getApiClients();
  const sellerQueries = useQueries({
    queries: sellerIds.map((id) => ({
      queryKey: ["seller", id],
      queryFn: () => marketplaceApi.getSeller(id),
      staleTime: 60_000,
      retry: 0,
    })),
  });

  const sellerNames = useMemo(() => {
    const map = new Map<string, string>();
    sellerIds.forEach((id, i) => {
      const q = sellerQueries[i];
      map.set(id, q?.data?.displayName ?? id.slice(0, 8));
    });
    return map;
  }, [sellerIds, sellerQueries]);

  useEffect(() => {
    if (status === "success" && data && data.offers.length > 0) {
      Analytics.track("buyer_offers_viewed", {
        cardId,
        offerCount: data.offerCount,
      });
    }
  }, [status, data, cardId]);

  return (
    <section
      aria-labelledby="offers-heading"
      data-testid="offers-block"
      className="rounded-lg border border-emerald-200 bg-white p-6"
    >
      <p
        id="offers-heading"
        className="mb-4 text-xs font-semibold uppercase tracking-wider text-emerald-800"
      >
        Ofertas
      </p>

      {status === "pending" ? <Loading label="Carregando ofertas…" /> : null}

      {status === "error" ? (
        <ErrorState
          title="Ofertas indisponíveis temporariamente"
          description="A carta foi encontrada. Tente novamente em instantes."
        />
      ) : null}

      {status === "success" && data && data.offers.length === 0 ? (
        <EmptyState
          title="Nenhuma loja possui esta carta atualmente."
          description="Volte mais tarde ou busque outra carta."
        />
      ) : null}

      {status === "success" && data && data.offers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-zinc-500">
                <th className="pb-2 pr-3 font-medium">Loja</th>
                <th className="pb-2 pr-3 font-medium">Condição</th>
                <th className="pb-2 pr-3 font-medium">Idioma</th>
                <th className="pb-2 pr-3 text-right font-medium">Preço</th>
                <th className="pb-2 pl-2 text-right font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {data.offers.map((offer) => (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  cardId={cardId}
                  cardName={cardName}
                  storeName={sellerNames.get(offer.sellerId) ?? offer.sellerId}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
