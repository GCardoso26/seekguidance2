"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { TOURNAMENT_GAMES } from "@/lib/tcg-adapters";
import { getTcgLogoBySlug } from "@/lib/tcg-logos";
import { useTournaments } from "@/hooks/useTournamentGames";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function ShowcaseInner() {
  const [activeGame, setActiveGame] = useState<string>("all");
  const slug = activeGame === "all" ? undefined : activeGame;
  const { data: tournaments, isLoading } = useTournaments(slug);
  const list = Array.isArray(tournaments) ? tournaments : [];

  return (
    <section className="container mx-auto px-4 py-16" id="torneios">
      <h2 className="mb-4 text-center text-3xl font-bold text-foreground">Torneios Multi-TCG</h2>
      <p className="mx-auto mb-8 max-w-xl text-center text-slate-400">
        Pokémon, Lorcana, MTG e Star Wars Unlimited — mesma plataforma, regras específicas por jogo.
      </p>

      <div className="mb-8 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => setActiveGame("all")}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            activeGame === "all" ? "bg-amber-500 text-slate-900" : "bg-slate-800 text-slate-300"
          }`}
        >
          Todos
        </button>
        {TOURNAMENT_GAMES.map((g) => {
          const logo = getTcgLogoBySlug(g.slug);
          return (
            <button
              key={g.code}
              type="button"
              onClick={() => setActiveGame(g.slug)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                activeGame === g.slug ? "bg-amber-500 text-slate-900" : "bg-slate-800 text-slate-300"
              }`}
            >
              <Image src={logo.src} alt="" width={20} height={20} />
              {g.name.split(" ")[0]}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <p className="text-center text-slate-500">A carregar torneios...</p>
      ) : !list.length ? (
        <div className="text-center">
          <p className="mb-4 text-slate-500">Ainda não há torneios públicos neste filtro.</p>
          <Link
            href="/tournament/create"
            className="inline-block rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-900"
          >
            Criar o primeiro torneio →
          </Link>
        </div>
      ) : (
        <ul className="mx-auto grid max-w-3xl gap-4">
          {list.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-4"
              >
                <div>
                  <p className="font-semibold text-foreground">{t.name}</p>
                  <p className="text-sm text-slate-400">
                    {t.tcg.toUpperCase()} · {t.format_code ?? t.tcg} · {t.status}
                  </p>
                </div>
                <Link href="/dashboard" className="text-sm text-warning hover:underline">
                  Ver →
                </Link>
              </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const client = new QueryClient();

export function TournamentShowcase() {
  return (
    <QueryClientProvider client={client}>
      <ShowcaseInner />
    </QueryClientProvider>
  );
}
