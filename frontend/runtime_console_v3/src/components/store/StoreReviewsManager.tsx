"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReviewStarsDisplay } from "@/components/reviews/ReviewStars";
import type { ShopReview } from "@/components/reviews/ShopReviewCard";

type Props = {
  storeId: string;
};

export function StoreReviewsManager({ storeId }: Props) {
  const qc = useQueryClient();
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [response, setResponse] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["store-reviews-manage", storeId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/reviews/manage`);
      if (!res.ok) throw new Error("Sem acesso");
      return res.json() as Promise<{ reviews: ShopReview[]; stats: { average_rating: number } }>;
    },
  });

  async function submitResponse(reviewId: string) {
    await fetch(`/api/marketplace/shop/reviews/${encodeURIComponent(reviewId)}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response }),
    });
    setRespondingId(null);
    setResponse("");
    void qc.invalidateQueries({ queryKey: ["store-reviews-manage", storeId] });
  }

  async function flagReview(reviewId: string) {
    const reason = window.prompt("Motivo da denúncia:");
    if (!reason) return;
    await fetch(`/api/marketplace/shop/reviews/${encodeURIComponent(reviewId)}/flag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    void qc.invalidateQueries({ queryKey: ["store-reviews-manage", storeId] });
  }

  if (isLoading) return <p className="text-muted-foreground">Carregando avaliações…</p>;

  const reviews = data?.reviews ?? [];
  const avg = data?.stats?.average_rating ?? 0;

  return (
    <div className="space-y-6">
      <div className="surface-card p-4">
        <p className="text-sm text-muted-foreground">Média geral</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-2xl font-bold">{avg.toFixed(1)}</span>
          <ReviewStarsDisplay rating={avg} size="md" />
        </div>
      </div>
      <div className="space-y-3">
        {reviews.length === 0 && <p className="text-muted-foreground">Nenhuma avaliação recebida.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="surface-card p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <ReviewStarsDisplay rating={r.rating} />
              <span className="text-xs text-muted-foreground">
                {r.store_response ? "Respondida" : "Não respondida"}
              </span>
            </div>
            {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {!r.store_response && (
                <button
                  type="button"
                  onClick={() => setRespondingId(r.id)}
                  className="rounded-lg border border-border px-3 py-1 text-xs"
                >
                  Responder
                </button>
              )}
              <button
                type="button"
                onClick={() => void flagReview(r.id)}
                className="rounded-lg border border-red-500/30 px-3 py-1 text-xs text-red-300"
              >
                Denunciar
              </button>
            </div>
            {respondingId === r.id && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={3}
                  className="w-full surface-card rounded-lg px-3 py-2 text-sm"
                  placeholder="Sua resposta pública…"
                />
                <button
                  type="button"
                  onClick={() => void submitResponse(r.id)}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Enviar resposta
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
