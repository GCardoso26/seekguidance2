"use client";

import Link from "next/link";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CheckoutForm } from "@/components/payments/CheckoutForm";
import { useTournamentSearch } from "@/hooks/useTournamentSearch";

const qc = new QueryClient();
/** ADR-016: SWU hard-exited from product ecosystem. */
const GAMES = ["MTG", "POKEMON", "LORCANA"];

function TorneiosSearchPage() {
  const [q, setQ] = useState("");
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [freeOnly, setFreeOnly] = useState(false);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);

  const { data, isLoading } = useTournamentSearch({
    q: q || undefined,
    game: selectedGames.length ? selectedGames : undefined,
    freeOnly,
  });

  const items = (data as { items?: Array<Record<string, unknown>> })?.items ?? [];

  const toggleGame = (g: string) => {
    setSelectedGames((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  return (
    <div className="luxury-page pb-8">
      <header className="border-b border-border px-4 py-4">
        <div className="container mx-auto">
          <Link href="/" className="text-sm text-muted-foreground">
            ← Início
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Procurando cartas ou produtos?{" "}
            <Link href="/loja/busca" className="underline hover:text-foreground">
              Ir para a loja
            </Link>
          </p>
          <h1 className="mt-2 text-2xl font-bold" data-testid="torneios-title">
            Descobrir Torneios
          </h1>
        </div>
      </header>
      <main className="container mx-auto grid gap-8 px-4 py-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <input
            type="search"
            placeholder="Buscar torneios…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full surface-card rounded-lg px-4 py-2"
            data-testid="torneios-search-input"
          />
          <div className="flex flex-wrap gap-2">
            {GAMES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => toggleGame(g)}
                className={`rounded-full px-3 py-1 text-sm ${selectedGames.includes(g) ? "bg-primary text-primary-foreground" : "border border-border"}`}
              >
                {g}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setFreeOnly((v) => !v)}
              className={`rounded-full px-3 py-1 text-sm ${freeOnly ? "bg-primary" : "border border-border"}`}
            >
              Gratuito
            </button>
          </div>

          {isLoading && <p className="text-muted-foreground">Buscando…</p>}
          <div className="space-y-4">
            {items.map((t) => (
              <article key={String(t.id)} className="rounded-xl border border-border p-4">
                <h2 className="text-lg font-semibold">{String(t.name)}</h2>
                <p className="text-sm text-muted-foreground">
                  {String(t.game_code)} · {String(t.city ?? "Online")} ·{" "}
                  {Number(t.entry_fee_cents) > 0
                    ? `R$ ${(Number(t.entry_fee_cents) / 100).toFixed(2)}`
                    : "Gratuito"}
                </p>
                <p className="text-sm text-muted-foreground/70">
                  👥 {String(t.registered)}/{String(t.max_players ?? "?")} inscritos
                </p>
                <button
                  type="button"
                  onClick={() => setCheckoutId(String(t.id))}
                  className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Inscrever-se
                </button>
              </article>
            ))}
          </div>
        </div>

        {checkoutId && (
          <div>
            {(() => {
              const t = items.find((x) => String(x.id) === checkoutId);
              if (!t) return null;
              return (
                <CheckoutForm
                  tournamentId={checkoutId}
                  tournamentName={String(t.name)}
                  feeCents={Number(t.entry_fee_cents ?? 0)}
                  currency={String(t.entry_fee_currency ?? "BRL")}
                />
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <QueryClientProvider client={qc}>
      <TorneiosSearchPage />
    </QueryClientProvider>
  );
}
