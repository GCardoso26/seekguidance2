"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

const DecklistCard = dynamic(
  () => import("@/components/marketplace/DecklistCard").then((m) => m.DecklistCard),
  { ssr: false },
);

export function MarketplaceDecklistsTab() {
  const [deckQ, setDeckQ] = useState("");

  const { data: deckItems = [], isLoading } = useQuery({
    queryKey: ["marketplace", "decklists", deckQ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (deckQ) params.set("q", deckQ);
      const res = await fetch(`/api/marketplace/decklists?${params}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <div className="mt-6">
      <input
        value={deckQ}
        onChange={(e) => setDeckQ(e.target.value)}
        placeholder="Buscar decklist…"
        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2"
      />
      {isLoading && <p className="mt-4 text-luxury-mist">Carregando…</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(deckItems as Array<Record<string, unknown>>).map((item) => (
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
  );
}
