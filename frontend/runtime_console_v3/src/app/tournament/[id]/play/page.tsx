"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { User } from "lucide-react";
import { MobilePairingCard } from "@/components/tournament/MobilePairingCard";
import { TimerDisplay } from "@/components/tournament/TimerDisplay";
import { ResultReporter } from "@/components/tournament/ResultReporter";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { useRoundPairings, useTournamentDetail } from "@/hooks/useTournamentFlow";

const qc = new QueryClient();

type Pairing = {
  id: string;
  table_number: number;
  player1_name: string;
  player2_name?: string;
  player1_id?: string;
  player2_id?: string;
  status: string;
};

function PlayView() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);
  const { user } = useJudgeAuth();
  const { data: profile } = usePlayerProfile(user ? "me" : "");
  const { data: tournament } = useTournamentDetail(id);
  const t = tournament as Record<string, unknown> | undefined;
  const currentRound = Number(t?.current_round ?? 1);
  const { data: roundData } = useRoundPairings(id, currentRound);
  const round = (roundData as { round?: { id: string } })?.round;
  const pairings = ((roundData as { pairings?: Pairing[] })?.pairings ?? []) as Pairing[];

  const playerName =
    profile?.displayName ||
    (typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
    user?.email?.split("@")[0];

  const myPairing = pairings.find(
    (p) =>
      (playerName && (p.player1_name === playerName || p.player2_name === playerName)) ||
      (user?.id && (p.player1_id === user.id || p.player2_id === user.id)),
  );

  const report = async (p1: number, p2: number) => {
    if (!myPairing) return;
    await fetch(
      `/api/tournament/tournaments/${id}/rounds/${currentRound}/pairings/${myPairing.id}/report`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player1_wins: p1, player2_wins: p2 }),
      },
    );
  };

  return (
    <div className="luxury-page mx-auto max-w-lg space-y-6 pb-8">
        <Link href={`/tournament/${id}`} className="text-sm text-luxury-mist">
          ← Voltar ao torneio
        </Link>
        <h1 className="text-xl font-bold">Rodada {currentRound}</h1>
        <TimerDisplay roundId={round?.id ?? null} />

        {!user && (
          <p className="rounded-lg border border-luxury-gold/30 bg-luxury-gold/10 p-4 text-sm text-luxury-gold-light">
            Faça login para ver sua mesa.
          </p>
        )}

        {user && !myPairing && (
          <div className="rounded-xl border border-white/10 p-6 text-center">
            <User className="mx-auto mb-2 h-8 w-8 text-luxury-mist/70" />
            <p className="font-medium">Você não está inscrito neste torneio</p>
            <p className="mt-1 text-sm text-luxury-mist">Procure o organizador para se inscrever.</p>
            <Link
              href={`/tournament/${id}`}
              className="mt-4 inline-block rounded-lg bg-luxury-gold px-4 py-2 text-sm font-semibold text-luxury-onyx"
            >
              Ver torneio
            </Link>
          </div>
        )}

        {myPairing && (
          <>
            <MobilePairingCard
              tableNumber={myPairing.table_number}
              player1={{ name: myPairing.player1_name }}
              player2={myPairing.player2_name ? { name: myPairing.player2_name } : undefined}
              onReport={() => router.push(`#report`)}
            />
            <div id="report">
              <ResultReporter onReport={(a, b) => void report(a, b)} />
            </div>
          </>
        )}
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
