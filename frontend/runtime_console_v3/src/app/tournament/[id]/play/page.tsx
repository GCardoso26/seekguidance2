"use client";

import { useParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TimerDisplay } from "@/components/tournament/TimerDisplay";
import { ResultReporter } from "@/components/tournament/ResultReporter";
import { useRoundPairings, useTournamentDetail } from "@/hooks/useTournamentFlow";

const qc = new QueryClient();

function PlayView() {
  const params = useParams();
  const id = String(params.id);
  const { data: tournament } = useTournamentDetail(id);
  const t = tournament as Record<string, unknown> | undefined;
  const currentRound = Number(t?.current_round ?? 1);
  const { data: roundData } = useRoundPairings(id, currentRound);
  const round = (roundData as { round?: { id: string } })?.round;
  const pairings = (roundData as { pairings?: { id: string; table_number: number; player1_name: string; player2_name?: string; status: string }[] })?.pairings ?? [];
  const myPairing = pairings[0];

  const report = async (p1: number, p2: number) => {
    if (!myPairing) return;
    await fetch(`/api/tournament/tournaments/${id}/rounds/${currentRound}/pairings/${myPairing.id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player1_wins: p1, player2_wins: p2 }),
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-xl font-bold">Rodada {currentRound}</h1>
        <TimerDisplay roundId={round?.id ?? null} />
        {myPairing && (
          <div className="rounded-xl border border-slate-700 p-6">
            <p className="text-sm text-slate-400">Sua mesa</p>
            <p className="text-3xl font-bold text-amber-400">Mesa {myPairing.table_number}</p>
            <p className="mt-2 text-white">
              {myPairing.player1_name} vs {myPairing.player2_name ?? "BYE"}
            </p>
            <p className="text-xs text-slate-500">Estado: {myPairing.status}</p>
          </div>
        )}
        <ResultReporter onReport={(a, b) => void report(a, b)} />
      </div>
    </div>
  );
}

export default function TournamentPlayPage() {
  return (
    <QueryClientProvider client={qc}>
      <PlayView />
    </QueryClientProvider>
  );
}
