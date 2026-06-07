"use client";

import Link from "next/link";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CheckoutForm } from "@/components/payments/CheckoutForm";
import { useTournamentSearch } from "@/hooks/useTournamentSearch";

const qc = new QueryClient();
const GAMES = ["MTG", "POKEMON", "LORCANA", "SWU"];

function SearchPage() {
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
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 px-4 py-4">
        <div className="container mx-auto">
          <Link href="/" className="text-sm text-slate-400">
            ← Início
          </Link>
          <h1 className="mt-2 text-2xl font-bold">Descobrir Torneios</h1>
        </div>
      </header>
      <main className="container mx-auto grid gap-8 px-4 py-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <input
            type="search"
            placeholder="Buscar torneios…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2"
          />
          <div className="flex flex-wrap gap-2">
            {GAMES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => toggleGame(g)}
                className={`rounded-full px-3 py-1 text-sm ${selectedGames.includes(g) ? "bg-amber-500 text-slate-900" : "border border-slate-600"}`}
              >
                {g}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setFreeOnly((v) => !v)}
              className={`rounded-full px-3 py-1 text-sm ${freeOnly ? "bg-emerald-600" : "border border-slate-600"}`}
            >
              Gratuito
            </button>
          </div>

          {isLoading && <p className="text-slate-400">Buscando…</p>}
          <div className="space-y-4">
            {items.map((t) => (
              <article key={String(t.id)} className="rounded-xl border border-slate-700 p-4">
                <h2 className="text-lg font-semibold">{String(t.name)}</h2>
                <p className="text-sm text-slate-400">
                  {String(t.game_code)} · {String(t.city ?? "Online")} ·{" "}
                  {Number(t.entry_fee_cents) > 0
                    ? `R$ ${(Number(t.entry_fee_cents) / 100).toFixed(2)}`
                    : "Gratuito"}
                </p>
                <p className="text-sm text-slate-500">
                  👥 {String(t.registered)}/{String(t.max_players ?? "?")} inscritos
                </p>
                <button
                  type="button"
                  onClick={() => setCheckoutId(String(t.id))}
                  className="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900"
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
      <SearchPage />
    </QueryClientProvider>
  );
}
