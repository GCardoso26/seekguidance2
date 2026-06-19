"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BracketTree } from "@/components/tournament/BracketTree";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import {
  useBracket,
  useTournamentDetail,
  useTournamentFlow,
} from "@/hooks/useTournamentFlow";

export default function TournamentBracketPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const { user } = useJudgeAuth();
  const { data: tournament } = useTournamentDetail(id);
  const t = tournament as Record<string, unknown> | undefined;
  const phase = String(t?.phase ?? t?.status ?? "");
  const hasBracket = phase === "bracket_active" || phase === "bracket_complete";
  const { data: bracket, isLoading, isError } = useBracket(id, hasBracket);
  const flow = useTournamentFlow(id);
  const [reportingId, setReportingId] = useState<string | null>(null);

  const isOrganizer = Boolean(user?.id && t?.created_by && user.id === String(t.created_by));

  const nameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of bracket?.matches ?? []) {
      if (m.player1Id && m.player1Name) map[m.player1Id] = m.player1Name;
      if (m.player2Id && m.player2Name) map[m.player2Id] = m.player2Name;
    }
    return map;
  }, [bracket]);

  const handleWinner = async (matchId: string, winnerId: string) => {
    setReportingId(matchId);
    try {
      await flow.reportBracketResult.mutateAsync({ matchId, winnerId });
    } finally {
      setReportingId(null);
    }
  };

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <Link href={`/tournament/${id}`} className="text-sm text-luxury-mist">
          ← Torneio
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Chaveamento — Top Cut</h1>
        <p className="mt-1 text-sm text-luxury-mist">
          {bracket ? `Top ${bracket.topCut} · ${bracket.status}` : "Eliminatória simples"}
        </p>

        {phase === "swiss_complete" && isOrganizer && (
          <div className="mt-4 rounded-xl border border-luxury-gold/30 bg-luxury-gold/10 p-4">
            <p className="text-sm text-luxury-frost">Suíço concluído. Gere o bracket eliminatório.</p>
            <button
              type="button"
              disabled={flow.advanceTopCut.isPending}
              onClick={() =>
                void flow.advanceTopCut.mutateAsync().then(() => router.refresh())
              }
              className="mt-3 rounded-lg bg-luxury-gold px-4 py-2 text-sm font-semibold text-luxury-onyx"
            >
              {flow.advanceTopCut.isPending ? "Gerando…" : "Iniciar Top Cut"}
            </button>
          </div>
        )}

        {isLoading && <p className="mt-6 text-sm text-luxury-mist">Carregando bracket…</p>}
        {isError && !hasBracket && phase !== "swiss_complete" && (
          <p className="mt-6 text-sm text-luxury-mist">Bracket ainda não disponível para este torneio.</p>
        )}

        {bracket && (
          <div className="mt-6">
            <BracketTree
              matches={bracket.matches.map((m) => ({
                id: m.id,
                roundNumber: m.roundNumber,
                matchNumber: m.matchNumber,
                player1Id: m.player1Id,
                player2Id: m.player2Id,
                winnerId: m.winnerId,
                status: m.status,
              }))}
              nameById={nameById}
              canEdit={isOrganizer && bracket.status === "active"}
              onReportWinner={(matchId, winnerId) => void handleWinner(matchId, winnerId)}
              reportingMatchId={reportingId}
            />
          </div>
        )}

        {phase === "bracket_complete" && isOrganizer && (
          <button
            type="button"
            disabled={flow.finalize.isPending}
            onClick={() => void flow.finalize.mutateAsync()}
            className="mt-6 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Finalizar torneio
          </button>
        )}
      </div>
    </MobileLayout>
  );
}
