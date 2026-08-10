"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { fetchPublicEvents } from "@/lib/live-data/fetchers";
import { TOURNAMENT_GAME_OPTIONS } from "@/lib/seller-tournament-form";
import { formatEventPriceBrl, normalizeStoreEvent } from "@/types/store-event";

export default function EventosSearchPage() {
  const [q, setQ] = useState("");
  const [selectedGames, setSelectedGames] = useState<string[]>([]);

  const eventsQ = useQuery({
    queryKey: ["search-torneios-events"],
    queryFn: async () => {
      const raw = await fetchPublicEvents(48);
      return raw.map((e) => normalizeStoreEvent(e as unknown as Record<string, unknown>));
    },
    staleTime: 60_000,
  });

  const items = useMemo(() => {
    const list = eventsQ.data ?? [];
    const query = q.trim().toLowerCase();
    return list.filter((ev) => {
      if (selectedGames.length && !selectedGames.includes((ev.game ?? "").toUpperCase())) {
        return false;
      }
      if (!query) return true;
      const hay = [ev.name, ev.storeName, ev.addressCity, ev.game, ev.format]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [eventsQ.data, q, selectedGames]);

  const toggleGame = (g: string) => {
    setSelectedGames((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  return (
    <MobileLayout>
      <div className="luxury-page pb-8" data-testid="eventos-search-page">
        <header className="border-b border-border px-4 py-4">
          <div className="container mx-auto max-w-5xl">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Eventos" },
              ]}
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Procurando cartas ou produtos?{" "}
              <Link href="/loja/busca" className="underline hover:text-foreground">
                Ir para a loja
              </Link>
            </p>
            <h1 className="mt-2 text-2xl font-bold" data-testid="torneios-title">
              Eventos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ingressos de lojas — filtre por jogo e garanta sua vaga no checkout.
            </p>
          </div>
        </header>

        <main className="container mx-auto max-w-5xl space-y-4 px-4 py-8">
          <input
            type="search"
            placeholder="Buscar eventos, loja ou cidade…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full surface-card rounded-lg px-4 py-2"
            data-testid="torneios-search-input"
          />
          <div className="flex flex-wrap gap-2">
            {TOURNAMENT_GAME_OPTIONS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGame(g.id)}
                className={`rounded-full px-3 py-1 text-sm ${
                  selectedGames.includes(g.id)
                    ? "bg-primary text-primary-foreground"
                    : "border border-border"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          {eventsQ.isLoading && <p className="text-muted-foreground">Buscando…</p>}
          {eventsQ.isError && (
            <p className="text-sm text-danger">Não foi possível carregar os eventos.</p>
          )}
          {!eventsQ.isLoading && items.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum evento encontrado.</p>
          )}

          <ul className="grid gap-3 sm:grid-cols-2">
            {items.map((ev) => {
              const remaining = ev.ticketsRemaining;
              const capacity = ev.ticketsCapacity ?? ev.capacity;
              const soldOut = remaining != null ? remaining <= 0 : false;
              return (
                <li key={ev.id}>
                  <Link
                    href={`/search/torneios/${ev.id}`}
                    className="flex gap-3 rounded-xl border border-border bg-card/40 p-4 transition hover:border-primary/40"
                    data-testid={`event-card-${ev.id}`}
                  >
                    {ev.bannerUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ev.bannerUrl}
                        alt=""
                        className="h-[100px] w-[70px] shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-[100px] w-[70px] shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{ev.name}</p>
                        {ev.game && (
                          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                            {ev.game}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {ev.startsAt
                          ? new Date(ev.startsAt).toLocaleString("pt-BR")
                          : "Data a definir"}
                        {ev.storeName ? ` · ${ev.storeName}` : ""}
                        {ev.addressCity && ev.addressState
                          ? ` · ${ev.addressCity}/${ev.addressState}`
                          : ""}
                      </p>
                      <p className="mt-1 text-sm">
                        <span className="font-medium">{formatEventPriceBrl(ev.priceCents)}</span>
                        {" · "}
                        {soldOut ? (
                          <span className="text-danger">Esgotado</span>
                        ) : remaining != null && capacity != null ? (
                          <span className="text-muted-foreground">
                            {remaining}/{capacity} vagas
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Vagas sob consulta</span>
                        )}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </main>
      </div>
    </MobileLayout>
  );
}
