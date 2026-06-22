"use client";

import Link from "next/link";
import { useState } from "react";
import { ConditionBadge, type CardCondition } from "@/components/cards/ConditionBadge";
import { formatCurrency } from "@/lib/format-currency";
import type { CardListing } from "@/types/card";

interface Props {
  initialListings: CardListing[];
  total: number;
}

export function SellerCardGrid({ initialListings, total }: Props) {
  const [listings] = useState(initialListings);
  const [sort, setSort] = useState<"recent" | "price_asc" | "price_desc">("recent");

  const sorted = [...listings].sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    return 0;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-luxury-mist">{total} listagens ativas</p>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm"
        >
          <option value="recent">Mais recentes</option>
          <option value="price_asc">Menor preço</option>
          <option value="price_desc">Maior preço</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <p className="py-12 text-center text-luxury-mist">Nenhuma listagem ativa no momento.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {sorted.map((listing) => (
            <Link
              key={listing.id}
              href={`/cards/${listing.cardId}`}
              className="rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-luxury-gold/40"
            >
              {listing.images?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.images[0]}
                  alt={listing.cardName ?? "Carta"}
                  className="mb-2 aspect-[5/7] w-full rounded-lg object-cover"
                />
              )}
              <p className="line-clamp-2 text-sm font-medium">{listing.cardName ?? "Carta"}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <ConditionBadge condition={listing.condition as CardCondition} />
                <span className="text-sm font-semibold text-luxury-gold">
                  {formatCurrency(listing.price, listing.currency ?? "BRL")}
                </span>
              </div>
              <p className="mt-1 text-xs text-luxury-mist">Qtd: {listing.quantity}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
