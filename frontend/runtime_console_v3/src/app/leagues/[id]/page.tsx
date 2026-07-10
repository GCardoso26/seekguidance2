"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useLeague } from "@/hooks/useLeague";

const qc = new QueryClient();

function LeagueDetail() {
  const params = useParams();
  const id = String(params.id);
  const { data, isLoading } = useLeague(id);
  const league = (data as { league?: Record<string, unknown> })?.league;
  const standings = (data as { standings?: Array<Record<string, unknown>> })?.standings ?? [];
  const events = (data as { events?: Array<Record<string, unknown>> })?.events ?? [];

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link href="/leagues" className="text-sm text-muted-foreground">
          ← Ligas
        </Link>
        {isLoading && <p className="mt-4 text-muted-foreground">Carregando…</p>}
        {league && (
          <>
            <div className="mt-4 rounded-xl border border-luxury-gold/20 bg-gradient-to-r from-luxury-midnight to-luxury-velvet p-6">
              <h1 className="text-2xl font-bold">{String(league.name)}</h1>
              <p className="text-muted-foreground">
                {String(league.game_code)} — {String(league.format)}
              </p>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h2 className="text-lg font-semibold">Classificação</h2>
                <table className="mt-3 w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2">#</th>
                      <th>Jogador</th>
                      <th>Pontos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((s) => (
                      <tr key={String(s.player_id)} className="border-t border-border">
                        <td className="py-2">{String(s.rank)}</td>
                        <td>{String(s.display_name ?? s.handle)}</td>
                        <td>{String(s.total_points)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Calendário</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {events.map((e) => (
                    <li key={String(e.id)} className="rounded-lg bg-muted/50 px-3 py-2">
                      {String(e.name)} · ×{String(e.points_multiplier)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </MobileLayout>
  );
}

export default function Page() {
  return (
    <QueryClientProvider client={qc}>
      <LeagueDetail />
    </QueryClientProvider>
  );
}
