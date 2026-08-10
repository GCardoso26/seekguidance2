"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { formatEventPriceBrl, normalizeStoreEvent } from "@/types/store-event";

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
  const storeId = store?.id ? String(store.id) : null;
  const tournaments = (data?.tournaments as Array<Record<string, unknown>>) ?? [];
  const reviews = (data?.reviews as Array<Record<string, unknown>>) ?? [];

  const eventsQ = useQuery({
    queryKey: ["store-public-events", storeId],
    queryFn: async () => {
      const res = await fetch(
        `/api/tournament-platform/events?store_id=${encodeURIComponent(storeId!)}&limit=24`,
      );
      if (!res.ok) return [];
      const json = (await res.json()) as { events?: Record<string, unknown>[] };
      return (json.events ?? []).map((e) => normalizeStoreEvent(e));
    },
    enabled: Boolean(storeId),
    staleTime: 60_000,
  });

  const events = eventsQ.data ?? [];

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/stores" className="text-sm text-muted-foreground">
          ← Lojas
        </Link>
        {isLoading && <p className="mt-4 text-muted-foreground">Carregando…</p>}
        {store && (
          <>
            <div className="surface-card mt-4">
              <h1 className="text-2xl font-bold">{String(store.name)}</h1>
              {Boolean(store.verified) && (
                <p className="text-sm text-primary">✓ Conta verificada</p>
              )}
              <p className="text-muted-foreground">
                {String(store.city ?? "")} · nota {String(store.average_rating)} (
                {String(store.review_count)} avaliações)
              </p>
            </div>

            <section className="mt-8" data-testid="store-event-tickets">
              <h2 className="text-lg font-semibold">Ingressos de eventos</h2>
              {eventsQ.isLoading && (
                <p className="mt-3 text-sm text-muted-foreground">Carregando ingressos…</p>
              )}
              {!eventsQ.isLoading && events.length === 0 && (
                <p className="mt-3 text-sm text-muted-foreground">Nenhum ingresso publicado.</p>
              )}
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {events.map((ev) => {
                  const remaining = ev.ticketsRemaining;
                  const capacity = ev.ticketsCapacity ?? ev.capacity;
                  const soldOut = remaining != null && remaining <= 0;
                  return (
                    <li
                      key={ev.id}
                      className="flex gap-3 rounded-xl border border-border bg-card/40 p-4"
                    >
                      {ev.bannerUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={ev.bannerUrl}
                          alt=""
                          className="h-[100px] w-[70px] shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-[100px] w-[70px] shrink-0 items-center justify-center rounded bg-muted text-xs">
                          —
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{ev.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {ev.startsAt
                            ? new Date(ev.startsAt).toLocaleString("pt-BR")
                            : "Data a definir"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ev.addressCity && ev.addressState
                            ? `${ev.addressCity}/${ev.addressState}`
                            : ev.venue ?? "—"}
                        </p>
                        <p className="mt-1 text-xs">
                          <span className="text-muted-foreground">{formatEventPriceBrl(ev.priceCents)}</span>
                          {" · "}
                          {soldOut ? (
                            <span className="font-medium text-danger">Esgotado</span>
                          ) : remaining != null && capacity != null ? (
                            <span className="text-muted-foreground">
                              {remaining}/{capacity} vagas
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Entrada</span>
                          )}
                        </p>
                        {soldOut ? (
                          <Button size="sm" className="mt-2" disabled data-testid={`store-event-cta-${ev.id}`}>
                            Esgotado
                          </Button>
                        ) : (
                          <Button asChild size="sm" className="mt-2" data-testid={`store-event-cta-${ev.id}`}>
                            <Link href={`/search/torneios/${ev.id}`}>Garantir vaga</Link>
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-semibold">Próximos torneios</h2>
              <ul className="mt-3 space-y-2">
                {tournaments.map((t) => (
                  <li key={String(t.id)} className="rounded-lg border border-border px-4 py-3 text-sm">
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
