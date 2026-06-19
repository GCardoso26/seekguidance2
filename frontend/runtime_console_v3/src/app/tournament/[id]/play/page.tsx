"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { User } from "lucide-react";
import { MobilePairingCard } from "@/components/tournament/MobilePairingCard";
import { TimerDisplay } from "@/components/tournament/TimerDisplay";
import { ResultReporter } from "@/components/tournament/ResultReporter";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { useRegisterTournament, useRoundPairings, useTournamentDetail } from "@/hooks/useTournamentFlow";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";

const qc = new QueryClient();

type Pairing = {
  id: string;
  table_number: number;
  player1_name: string;
  player2_name?: string;
  player1_user_id?: string;
  player2_user_id?: string;
  status: string;
};

function PlayView() {
  const params = useParams();
  const id = String(params.id);
  const { user } = useJudgeAuth();
  const { data: profile } = usePlayerProfile(user ? "me" : "");
  const { data: tournament } = useTournamentDetail(id);
  const register = useRegisterTournament(id);
  const t = tournament as Record<string, unknown> | undefined;
  const currentRound = Number(t?.current_round ?? 1);
  const { data: roundData, refetch } = useRoundPairings(id, currentRound);
  const round = (roundData as { round?: { id: string } })?.round;
  const pairings = ((roundData as { pairings?: Pairing[] })?.pairings ?? []) as Pairing[];

  const myPairing = pairings.find(
    (p) => user?.id && (p.player1_user_id === user.id || p.player2_user_id === user.id),
  );

  const enroll = async () => {
    try {
      const name = profile?.displayName ?? user?.email?.split("@")[0];
      await register.mutateAsync(name);
      showToast("Inscrição confirmada!", "success");
      void refetch();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Falha na inscrição", "error");
    }
  };

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
          <p className="mt-1 text-sm text-luxury-mist">Inscreva-se para participar das rodadas.</p>
          <Button
            className="mt-4 bg-luxury-gold text-luxury-onyx hover:bg-luxury-gold-light"
            disabled={register.isPending}
            onClick={() => void enroll()}
          >
            {register.isPending ? "Inscrevendo…" : "Inscrever-se"}
          </Button>
        </div>
      )}

      {myPairing && (
        <>
          <MobilePairingCard
            tableNumber={myPairing.table_number}
            player1={{ name: myPairing.player1_name }}
            player2={myPairing.player2_name ? { name: myPairing.player2_name } : undefined}
            onReport={() => document.getElementById("report")?.scrollIntoView({ behavior: "smooth" })}
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

