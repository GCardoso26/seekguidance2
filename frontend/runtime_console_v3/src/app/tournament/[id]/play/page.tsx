"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { User } from "lucide-react";
import { MobilePairingCard } from "@/components/tournament/MobilePairingCard";
import { TimerDisplay } from "@/components/tournament/TimerDisplay";
import { ResultReporter } from "@/components/tournament/ResultReporter";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import {
  useTournamentRegistration,
  useTournamentRegistrationStatus,
} from "@/hooks/useTournamentRegistration";
import { useRoundPairings, useTournamentDetail } from "@/hooks/useTournamentFlow";
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
  const router = useRouter();
  const id = String(params.id);
  const { user } = useJudgeAuth();
  const { data: tournament } = useTournamentDetail(id);
  const { data: regStatus } = useTournamentRegistrationStatus(id, Boolean(user));
  const { register } = useTournamentRegistration(id);
  const t = tournament as Record<string, unknown> | undefined;
  const currentRound = Number(t?.current_round ?? 1);
  const entryFee = Number(t?.entry_fee_cents ?? 0);
  const { data: roundData, refetch } = useRoundPairings(id, currentRound);
  const round = (roundData as { round?: { id: string } })?.round;
  const pairings = ((roundData as { pairings?: Pairing[] })?.pairings ?? []) as Pairing[];

  const myPairing = pairings.find(
    (p) => user?.id && (p.player1_user_id === user.id || p.player2_user_id === user.id),
  );

  const isRegistered = regStatus?.status === "confirmed";

  const enroll = () => {
    if (entryFee > 0) {
      router.push(`/tournament/${id}/checkout`);
      return;
    }
    router.push(`/tournament/${id}`);
  };

  const [reporting, setReporting] = useState(false);

  const report = async (p1: number, p2: number) => {
    if (!myPairing || reporting) return;
    setReporting(true);
    try {
      await fetch(
        `/api/tournament/tournaments/${id}/rounds/${currentRound}/pairings/${myPairing.id}/report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ player1_wins: p1, player2_wins: p2 }),
        },
      );
      void refetch();
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="luxury-page mx-auto max-w-lg space-y-6 pb-8">
      <Link href={`/tournament/${id}`} className="text-sm text-muted-foreground">
        ← Voltar ao torneio
      </Link>
      <h1 className="text-xl font-bold">Rodada {currentRound}</h1>
      <TimerDisplay roundId={round?.id ?? null} />

      {!user && (
        <p className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          Faça login para ver sua mesa.
        </p>
      )}

      {user && !myPairing && !isRegistered && (
        <div className="rounded-xl border border-border p-6 text-center">
          <User className="mx-auto mb-2 h-8 w-8 text-muted-foreground/70" />
          <p className="font-medium">Você não está inscrito neste torneio</p>
          <p className="mt-1 text-sm text-muted-foreground">Inscreva-se para participar das rodadas.</p>
          <Button
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90-light"
            disabled={register.isPending}
            onClick={enroll}
          >
            Inscrever-se
          </Button>
        </div>
      )}

      {user && isRegistered && !myPairing && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-success">
          Inscrito ✓ — aguardando pairings da rodada.
        </p>
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
            <ResultReporter disabled={reporting} onReport={(a, b) => void report(a, b)} />
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
