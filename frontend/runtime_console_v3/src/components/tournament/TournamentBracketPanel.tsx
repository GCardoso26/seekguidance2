"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BracketControls } from "@/components/tournament/BracketControls";
import { BracketLegend } from "@/components/tournament/BracketLegend";
import { StandingsTable } from "@/components/tournament/StandingsTable";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { useTournamentDetail } from "@/hooks/useTournamentFlow";
import { useSwissRoundPairings, useTournamentBracket } from "@/hooks/useTournamentBracket";
import {
  bracketMatchesToCsv,
  inferPairingFormat,
  mapBracketPublicStatus,
  publicStatusLabel,
} from "@/lib/tournament-bracket";
import type { BracketMatchView, SwissRoundView } from "@/types/tournament-bracket";
import { Button } from "@/components/ui/button";

const SwissBracket = dynamic(
  () => import("@/components/tournament/SwissBracket").then((m) => m.SwissBracket),
  { loading: () => <p className="text-sm text-muted-foreground">Carregando rodadas suíças…</p> },
);

const EliminationBracket = dynamic(
  () => import("@/components/tournament/EliminationBracket").then((m) => m.EliminationBracket),
  { loading: () => <p className="text-sm text-muted-foreground">Carregando chave…</p> },
);

type Props = {
  tournamentId: string;
  backHref?: string;
  backLabel?: string;
  showSellerLink?: boolean;
};

function normalizePairingsRound(data: unknown): SwissRoundView["pairings"] {
  const pairings = (data as { pairings?: Array<Record<string, unknown>> })?.pairings ?? [];
  return pairings.map((p) => ({
    id: String(p.id ?? ""),
    tableNumber: Number(p.table_number ?? 0),
    player1Name: String(p.player1_name ?? "—"),
    player2Name: p.player2_name ? String(p.player2_name) : undefined,
    player1Points: Number(p.player1_points ?? 0),
    player2Points: Number(p.player2_points ?? 0),
    status: String(p.status ?? "pending"),
    isBye: Boolean(p.is_bye),
  }));
}

export function TournamentBracketPanel({
  tournamentId,
  backHref,
  backLabel = "← Voltar ao torneio",
  showSellerLink = false,
}: Props) {
  const { user } = useJudgeAuth();
  const { data: tournament } = useTournamentDetail(tournamentId);
  const t = tournament as Record<string, unknown> | undefined;
  const phase = String(t?.phase ?? t?.status ?? "");
  const format = inferPairingFormat(t);
  const currentRound = Number(t?.current_round ?? 0);
  const totalRounds = Number(t?.total_swiss_rounds ?? 5);
  const isActive =
    phase === "in_progress" || phase === "swiss_active" || phase === "bracket_active";
  const bracketApi = useTournamentBracket(tournamentId, { active: isActive });
  const { data: bracket } = bracketApi.bracket;
  const { data: standings = [] } = bracketApi.standings;
  const [reportingId, setReportingId] = useState<string | null>(null);

  const isOrganizer = Boolean(user?.id && t?.created_by && user.id === String(t.created_by));
  const publicStatus = mapBracketPublicStatus(phase, bracket?.status);
  const hasElimBracket =
    phase === "bracket_active" || phase === "bracket_complete" || Boolean(bracket?.matches?.length);

  const round1 = useSwissRoundPairings(tournamentId, 1, currentRound >= 1 && format === "swiss");
  const round2 = useSwissRoundPairings(tournamentId, 2, currentRound >= 2 && format === "swiss");
  const round3 = useSwissRoundPairings(tournamentId, 3, currentRound >= 3 && format === "swiss");

  const swissRounds: SwissRoundView[] = useMemo(() => {
    const sources = [
      { n: 1, data: round1.data },
      { n: 2, data: round2.data },
      { n: 3, data: round3.data },
    ];
    return sources
      .filter((s) => s.data)
      .map((s) => ({
        roundNumber: s.n,
        pairings: normalizePairingsRound(s.data),
      }))
      .filter((r) => r.pairings.length > 0);
  }, [round1.data, round2.data, round3.data]);

  const nameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of bracket?.matches ?? []) {
      if (m.player1Id && m.player1Name) map[m.player1Id] = m.player1Name;
      if (m.player2Id && m.player2Name) map[m.player2Id] = m.player2Name;
    }
    return map;
  }, [bracket]);

  const eliminationMatches: BracketMatchView[] = (bracket?.matches ?? []).map((m) => ({
    id: m.id,
    roundNumber: m.roundNumber,
    matchNumber: m.matchNumber,
    player1Id: m.player1Id,
    player2Id: m.player2Id,
    player1Name: m.player1Name,
    player2Name: m.player2Name,
    winnerId: m.winnerId,
    status: m.status,
  }));

  const handleWinner = async (matchId: string, winnerId: string) => {
    setReportingId(matchId);
    try {
      await bracketApi.reportMatchResult.mutateAsync({ matchId, winnerId });
    } finally {
      setReportingId(null);
    }
  };

  const exportResults = () => {
    const csv = bracketMatchesToCsv(
      eliminationMatches.map((m) => ({
        roundNumber: m.roundNumber,
        matchNumber: m.matchNumber,
        player1Name: m.player1Id ? nameById[m.player1Id] : "TBD",
        player2Name: m.player2Id ? nameById[m.player2Id] : "BYE",
        winnerName: m.winnerId ? nameById[m.winnerId] : "",
        status: m.status,
      })),
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bracket-${tournamentId.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" data-testid="tournament-bracket-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {backHref && (
            <Link href={backHref} className="text-sm text-muted-foreground hover:text-primary">
              {backLabel}
            </Link>
          )}
          <h1 className="mt-2 text-2xl font-bold text-foreground">
            Bracket — {String(t?.name ?? "Torneio")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format.replace(/_/g, " ")} · {publicStatusLabel(publicStatus)}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            publicStatus === "in_progress"
              ? "border-sky-500/40 bg-sky-500/20 text-info"
              : publicStatus === "finished"
                ? "border-border bg-muted text-muted-foreground"
                : publicStatus === "open"
                  ? "border-emerald-500/40 bg-emerald-500/20 text-success"
                  : "border-border bg-muted/50 text-muted-foreground"
          }`}
          data-testid="bracket-public-status"
        >
          {publicStatusLabel(publicStatus)}
        </span>
      </div>

      <BracketLegend />

      {publicStatus === "not_started" && (
        <div
          className="surface-card rounded-xl border border-dashed border-border p-8 text-center"
          data-testid="bracket-placeholder"
        >
          <p className="text-lg font-medium text-foreground">Torneio ainda não iniciado</p>
          <p className="mt-2 text-sm text-muted-foreground">
            O bracket será exibido aqui quando o organizador iniciar o torneio.
          </p>
        </div>
      )}

      <BracketControls
        phase={phase}
        format={format}
        isOrganizer={isOrganizer}
        currentRound={currentRound}
        totalRounds={totalRounds}
        onStartTournament={() =>
          void bracketApi.startBracket.mutateAsync("tournament")
        }
        onGenerateRound={() => void bracketApi.generateRound.mutateAsync()}
        onAdvanceTopCut={() => void bracketApi.startBracket.mutateAsync("top_cut")}
        onFinalize={() => void bracketApi.finalize.mutateAsync()}
        pending={{
          start: bracketApi.startBracket.isPending,
          round: bracketApi.generateRound.isPending,
          topCut: bracketApi.startBracket.isPending,
          finalize: bracketApi.finalize.isPending,
        }}
      />

      {format === "swiss" && publicStatus !== "not_started" && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Rodadas suíças</h2>
          <SwissBracket rounds={swissRounds} activeRound={currentRound} />
        </section>
      )}

      {format === "double_elimination" && publicStatus !== "not_started" && !hasElimBracket && (
        <section className="surface-card rounded-xl p-4 text-sm text-amber-300">
          Double elimination: estrutura visual disponível; fluxo operacional usa eliminatória
          simples até integração backend completa.
        </section>
      )}

      {(hasElimBracket || format === "single_elimination") && (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">
              {format === "swiss" ? "Top Cut" : "Chave eliminatória"}
            </h2>
            {isOrganizer && eliminationMatches.length > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={exportResults}>
                Exportar CSV
              </Button>
            )}
          </div>
          <EliminationBracket
            matches={eliminationMatches}
            nameById={nameById}
            canEdit={isOrganizer && bracket?.status === "active"}
            reportingMatchId={reportingId}
            onReportWinner={(matchId, winnerId) => void handleWinner(matchId, winnerId)}
          />
        </section>
      )}

      {standings.length > 0 && (
        <section data-testid="bracket-standings">
          <h2 className="mb-3 text-lg font-semibold">Classificação</h2>
          <StandingsTable standings={standings as never[]} />
        </section>
      )}

      {showSellerLink && isOrganizer && (
        <Link
          href={`/vendedor/painel/torneios/${tournamentId}/bracket`}
          className="text-sm text-primary hover:underline"
        >
          Gerenciar no painel lojista →
        </Link>
      )}
    </div>
  );
}
