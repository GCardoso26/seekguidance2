"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { MobileLayout } from "@/components/layout/MobileLayout";

export default function StorePage() {
  const params = useParams();
  const slug = String(params.slug);
  const { data, isLoading } = useQuery({
    queryKey: ["store", slug],
    queryFn: async () => {
      const res = await fetch(`/api/stores/${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error("Loja não encontrada");
      return res.json();
    },
  });

  const store = data?.store as Record<string, unknown> | undefined;
  const tournaments = (data?.tournaments as Array<Record<string, unknown>>) ?? [];
  const reviews = (data?.reviews as Array<Record<string, unknown>>) ?? [];

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/stores" className="text-sm text-luxury-mist">
          ← Lojas
        </Link>
        {isLoading && <p className="mt-4 text-luxury-mist">Carregando…</p>}
        {store && (
          <>
            <div className="luxury-card mt-4">
              <h1 className="text-2xl font-bold">{String(store.name)}</h1>
              {Boolean(store.verified) && (
                <p className="text-sm text-luxury-gold-light">✓ Conta verificada</p>
              )}
              <p className="text-luxury-mist">
                📍 {String(store.city ?? "")} · ⭐ {String(store.average_rating)} (
                {String(store.review_count)} avaliações)
              </p>
            </div>
            <section className="mt-8">
              <h2 className="text-lg font-semibold">Próximos torneios</h2>
              <ul className="mt-3 space-y-2">
                {tournaments.map((t) => (
                  <li key={String(t.id)} className="rounded-lg border border-white/10 px-4 py-3 text-sm">
                    {String(t.name)} — {String(t.registered)}/{String(t.max_players)} inscritos
                  </li>
                ))}
              </ul>
            </section>
            <section className="mt-8">
              <h2 className="text-lg font-semibold">Avaliações</h2>
              {reviews.map((r) => (
                <ReviewCard
                  key={String(r.id)}
                  reviewerName={String(r.display_name ?? r.handle)}
                  rating={Number(r.rating)}
                  title={String(r.title ?? "")}
                  comment={String(r.comment ?? "")}
                  helpful={Number(r.helpful_count ?? 0)}
                />
              ))}
            </section>
          </>
        )}
      </div>
    </MobileLayout>
  );
}
