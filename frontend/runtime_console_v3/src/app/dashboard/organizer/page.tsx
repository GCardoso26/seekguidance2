"use client";

import Link from "next/link";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ParticipationChart } from "@/components/analytics/ParticipationChart";
import { RetentionMetrics } from "@/components/analytics/RetentionMetrics";
import { RevenueChart } from "@/components/analytics/RevenueChart";
import { useOrganizerAnalytics } from "@/hooks/useOrganizerAnalytics";

const qc = new QueryClient();

function OrganizerDashboard() {
  const { data, isLoading, isError } = useOrganizerAnalytics(90);
  const d = data as Record<string, unknown> | undefined;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 px-4 py-4">
        <div className="container mx-auto">
          <Link href="/" className="text-sm text-slate-400">
            ← Início
          </Link>
          <h1 className="mt-2 text-2xl font-bold">Analytics — Organizador</h1>
        </div>
      </header>
      <main className="container mx-auto space-y-8 px-4 py-8">
        {isLoading && <p className="text-slate-400">Carregando métricas…</p>}
        {isError && <p className="text-red-400">Faça login como organizador.</p>}
        {d && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-700 p-4">
                <div className="text-3xl font-bold">{String(d.totalTournaments)}</div>
                <div className="text-sm text-slate-400">Torneios (90 dias)</div>
              </div>
              <div className="rounded-xl border border-slate-700 p-4">
                <div className="text-3xl font-bold">{String(d.totalParticipants)}</div>
                <div className="text-sm text-slate-400">Jogadores únicos</div>
              </div>
              <RevenueChart
                totalRevenueCents={Number(d.totalRevenueCents ?? 0)}
                periodDays={Number(d.periodDays ?? 90)}
              />
            </div>

            <section>
              <h2 className="mb-4 text-lg font-semibold">Por jogo</h2>
              <ParticipationChart
                breakdown={(d.gameBreakdown as Parameters<typeof ParticipationChart>[0]["breakdown"]) ?? []}
              />
            </section>

            <section>
              <h2 className="mb-4 text-lg font-semibold">Retenção</h2>
              <RetentionMetrics
                returningRate={Number(d.returningPlayersRate ?? 0)}
                noShowRate={Number(d.noShowRate ?? 0)}
                disputeRate={Number(d.disputeRate ?? 0)}
              />
            </section>

            {(d.upcomingTournaments as Array<Record<string, unknown>>)?.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-semibold">Próximos torneios</h2>
                <ul className="divide-y divide-slate-700 rounded-lg border border-slate-700">
                  {(d.upcomingTournaments as Array<Record<string, unknown>>).map((t) => (
                    <li key={String(t.id)} className="flex justify-between px-4 py-3 text-sm">
                      <span>{String(t.name)}</span>
                      <span className="text-slate-400">
                        {String(t.registered)}/{String(t.max_players)} inscritos
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <QueryClientProvider client={qc}>
      <OrganizerDashboard />
    </QueryClientProvider>
  );
}
