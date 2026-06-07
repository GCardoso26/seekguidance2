"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DecklistCard } from "@/components/marketplace/DecklistCard";
import { MobileLayout } from "@/components/layout/MobileLayout";

export default function MarketplacePage() {
  const [q, setQ] = useState("");
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["marketplace", q],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      const res = await fetch(`/api/marketplace/decklists?${params}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Marketplace de Decklists</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar decklist…"
          className="mt-4 w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2"
        />
        {isLoading && <p className="mt-4 text-slate-400">Carregando…</p>}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {(items as Array<Record<string, unknown>>).map((item) => (
            <DecklistCard
              key={String(item.id)}
              id={String(item.id)}
              name={String(item.name)}
              gameCode={String(item.game_code)}
              priceCents={Number(item.price_cents)}
              sellerName={String(item.seller_name ?? item.seller_handle)}
              rating={Number(item.average_rating)}
              salesCount={Number(item.sales_count)}
            />
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
