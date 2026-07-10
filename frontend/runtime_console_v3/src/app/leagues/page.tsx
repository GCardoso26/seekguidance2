"use client";

import Link from "next/link";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useLeagues } from "@/hooks/useLeague";

const qc = new QueryClient();

function LeaguesList() {
  const { data: leagues = [], isLoading } = useLeagues();

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="text-sm text-muted-foreground">
          ← Início
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Ligas e Temporadas</h1>
          <Link href="/leagues/create" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Criar liga
          </Link>
        </div>
        {isLoading && <p className="mt-4 text-muted-foreground">Carregando…</p>}
        <div className="mt-6 space-y-4">
          {(leagues as Array<Record<string, unknown>>).map((l) => (
            <Link
              key={String(l.id)}
              href={`/leagues/${l.id}`}
              className="block rounded-xl border border-border p-4 hover:border-luxury-gold/50"
            >
              <h2 className="font-semibold">{String(l.name)}</h2>
              <p className="text-sm text-muted-foreground">
                {String(l.game_code)} · {String(l.participants ?? 0)} participantes
              </p>
            </Link>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}

export default function LeaguesPage() {
  return (
    <QueryClientProvider client={qc}>
      <LeaguesList />
    </QueryClientProvider>
  );
}
