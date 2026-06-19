"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RoundManager } from "@/components/tournament/RoundManager";
import { StandingsTable } from "@/components/tournament/StandingsTable";
import { PairingsView } from "@/components/tournament/PairingsView";
import { useStandings, useTournamentDetail, useTournamentFlow } from "@/hooks/useTournamentFlow";
import { useRoundPairings } from "@/hooks/useTournamentFlow";
import { useJudgeAuth } from "@/features/auth/AuthProvider";

const qc = new QueryClient();

function Dashboard() {
  const params = useParams();
  const id = String(params.id);
  const { user } = useJudgeAuth();
  const { data: tournament } = useTournamentDetail(id);
  const { data: standings } = useStandings(id);
  const t = tournament as Record<string, unknown> | undefined;
  const isOrganizer = Boolean(user?.id && t?.created_by && user.id === String(t.created_by));
  const currentRound = Number(t?.current_round ?? 0);
  const { data: roundData } = useRoundPairings(id, currentRound);
  const flow = useTournamentFlow(id);

  const round = (roundData as { round?: { id: string } })?.round;
  const pairings = (roundData as { pairings?: unknown[] })?.pairings ?? [];
  const prizePool = Number(t?.prize_pool ?? 0);
  const phase = String(t?.phase ?? t?.status ?? "");

  return (
    <div className="luxury-page pb-8">
      <header className="border-b border-white/10 px-4 py-4">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{String(t?.name ?? "Torneio")}</h1>
            <p className="text-sm text-luxury-mist">
              {String(t?.game_code ?? "")} · {String(t?.format_code ?? "")} · {String(t?.status ?? "")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/tournament/${id}/play`} className="min-h-[44px] rounded-lg border border-white/10 px-4 py-2 text-sm">
              Vista jogador
            </Link>
            <Link href={`/tournament/${id}/bracket`} className="min-h-[44px] rounded-lg border border-white/10 px-4 py-2 text-sm">
              Bracket
            </Link>
            {isOrganizer && (
              <>
                <button
                  type="button"
                  onClick={() => flow.startCheckIn.mutate()}
                  className="min-h-[44px] rounded-lg border border-white/10 px-4 py-2 text-sm"
                >
                  Abrir check-in
                </button>
                <button
                  type="button"
                  onClick={() => flow.startTournament.mutate()}
                  className="min-h-[44px] rounded-lg bg-luxury-gold px-4 py-2 text-sm font-semibold text-luxury-onyx"
                >
                  Iniciar torneio
                </button>
              </>
            )}
          </div>
        </div>
        {!isOrganizer && user && (
          <p className="container mx-auto mt-2 text-xs text-luxury-mist">Somente o organizador pode gerenciar rodadas.</p>
        )}
      </header>

      <main className="container mx-auto space-y-8 px-4 py-8">
        {isOrganizer && (
          <RoundManager
            tournamentId={id}
            currentRound={currentRound || 1}
            roundId={round?.id ?? null}
            totalRounds={Number(t?.total_swiss_rounds ?? 5)}
          />
        )}

        {isOrganizer && phase === "swiss_complete" && (
          <section className="luxury-card rounded-xl p-4">
            <h2 className="mb-2 text-lg font-semibold">Top Cut</h2>
            <p className="text-sm text-luxury-mist">Suíço concluído. Inicie a eliminatória seeded.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={flow.advanceTopCut.isPending}
                onClick={() => void flow.advanceTopCut.mutateAsync()}
                className="rounded-lg bg-luxury-gold px-4 py-2 text-sm font-semibold text-luxury-onyx"
              >
                Iniciar Top Cut
              </button>
              <Link href={`/tournament/${id}/bracket`} className="rounded-lg border border-white/10 px-4 py-2 text-sm">
                Ver bracket
              </Link>
            </div>
          </section>
        )}

        {isOrganizer && (phase === "bracket_active" || phase === "bracket_complete") && (
          <section className="luxury-card rounded-xl p-4">
            <h2 className="mb-2 text-lg font-semibold">Eliminatória</h2>
            <Link href={`/tournament/${id}/bracket`} className="text-sm text-luxury-gold hover:underline">
              Gerenciar bracket →
            </Link>
            {phase === "bracket_complete" && (
              <button
                type="button"
                disabled={flow.finalize.isPending}
                onClick={() => void flow.finalize.mutateAsync()}
                className="mt-3 block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Finalizar torneio
              </button>
            )}
          </section>
        )}

        <section>
          <h2 className="mb-4 text-lg font-semibold">Standings</h2>
          <StandingsTable standings={(standings as never[]) ?? []} />
        </section>

        {prizePool > 0 && (
          <section className="luxury-card rounded-xl p-4">
            <h2 className="mb-2 text-lg font-semibold">Premiação</h2>
            <p className="text-sm text-luxury-mist">
              Pool: R$ {prizePool.toFixed(2)} · Distribuição 40% / 25% / 15% / 10% (calculada ao finalizar)
            </p>
          </section>
        )}

        {currentRound > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Pairings — Rodada {currentRound}</h2>
            <PairingsView pairings={pairings as never[]} />
          </section>
        )}
      </main>
    </div>
  );
}

export default function TournamentDashboardPage() {
  return (
    <QueryClientProvider client={qc}>
      <Dashboard />
    </QueryClientProvider>
  );
}
