"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TournamentParticipantsList } from "@/components/tournament/TournamentParticipantsList";
import { TournamentPublicStatusBadge } from "@/components/tournament/TournamentPublicStatusBadge";
import { TournamentRegistrationPanel } from "@/components/tournament/TournamentRegistrationPanel";
import { RoundManager } from "@/components/tournament/RoundManager";
import { StandingsTable } from "@/components/tournament/StandingsTable";
import { PairingsView } from "@/components/tournament/PairingsView";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import {
  useRoundPairings,
  useStandings,
  useTournamentDetail,
  useTournamentFlow,
} from "@/hooks/useTournamentFlow";
import { useTournamentParticipantsPublic } from "@/hooks/useTournamentRegistration";
import { mapTournamentPublicStatus } from "@/lib/tournament-registration";
import { showToast } from "@/lib/toast";

const qc = new QueryClient();

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return "—";
  }
}

function formatFee(cents: number) {
  if (cents <= 0) return "Gratuito";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function TournamentPublicSection({ id }: { id: string }) {
  const { data: tournament } = useTournamentDetail(id);
  const { data: participants } = useTournamentParticipantsPublic(id);
  const t = tournament as Record<string, unknown> | undefined;

  const status = String(t?.status ?? "draft");
  const publicStatus = mapTournamentPublicStatus(status);
  const entryFee = Number(t?.entry_fee_cents ?? 0);
  const maxPlayers = t?.max_players != null ? Number(t.max_players) : null;
  const registeredCount = participants?.registered_count ?? Number(t?.registered ?? 0);

  return (
    <div className="space-y-6" data-testid="tournament-public-section">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{String(t?.name ?? "Torneio")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {String(t?.game_code ?? "")} · {String(t?.format_code ?? "")}
          </p>
        </div>
        <TournamentPublicStatusBadge status={publicStatus} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="surface-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Data</p>
          <p className="font-medium">{formatDate(t?.starts_at as string)}</p>
        </div>
        <div className="surface-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Local</p>
          <p className="font-medium">{String(t?.city ?? t?.location ?? "Online")}</p>
        </div>
        <div className="surface-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Taxa</p>
          <p className="font-medium">{formatFee(entryFee)}</p>
        </div>
      </div>

      {(Boolean(t?.description) || Boolean(t?.prize_pool)) && (
        <div className="surface-card space-y-3 rounded-xl p-6">
          {Boolean(t?.description) && (
            <div>
              <h2 className="text-sm font-semibold text-foreground">Descrição</h2>
              <p className="mt-1 text-sm text-muted-foreground">{String(t?.description)}</p>
            </div>
          )}
          {Boolean(t?.prize_pool) && (
            <div>
              <h2 className="text-sm font-semibold text-foreground">Prêmios</h2>
              <p className="mt-1 text-sm text-muted-foreground">{String(t?.prize_pool)}</p>
            </div>
          )}
        </div>
      )}

      <TournamentRegistrationPanel
        tournamentId={id}
        tournamentStatus={status}
        entryFeeCents={entryFee}
        registeredCount={registeredCount}
        maxPlayers={maxPlayers}
      />

      <TournamentParticipantsList tournamentId={id} />

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/tournament/${id}/play`}
          className="min-h-[44px] rounded-lg border border-border px-4 py-2 text-sm"
        >
          Vista jogador
        </Link>
        <Link
          href={`/tournament/${id}/bracket`}
          className="min-h-[44px] rounded-lg border border-border px-4 py-2 text-sm"
        >
          Bracket
        </Link>
      </div>
    </div>
  );
}

function OrganizerSection({ id }: { id: string }) {
  const { data: tournament } = useTournamentDetail(id);
  const { data: standings } = useStandings(id);
  const t = tournament as Record<string, unknown> | undefined;
  const currentRound = Number(t?.current_round ?? 0);
  const { data: roundData } = useRoundPairings(id, currentRound);
  const flow = useTournamentFlow(id);
  const round = (roundData as { round?: { id: string } })?.round;
  const pairings = (roundData as { pairings?: unknown[] })?.pairings ?? [];
  const prizePool = Number(t?.prize_pool ?? 0);
  const phase = String(t?.phase ?? t?.status ?? "");

  return (
    <div className="mt-10 space-y-8 border-t border-border pt-8" data-testid="tournament-organizer-section">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Painel do organizador</h2>
        <Link
          href={`/vendedor/painel/torneios/${id}/inscritos`}
          className="rounded-lg border border-primary/40 px-4 py-2 text-sm text-primary"
          data-testid="tournament-manage-registrations"
        >
          Gerenciar inscritos
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={flow.startCheckIn.isPending || flow.startTournament.isPending}
          onClick={() => flow.startCheckIn.mutate()}
          className="min-h-[44px] rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-50"
        >
          {flow.startCheckIn.isPending ? "Abrindo…" : "Abrir check-in"}
        </button>
        <button
          type="button"
          disabled={flow.startCheckIn.isPending || flow.startTournament.isPending}
          onClick={() => flow.startTournament.mutate()}
          className="min-h-[44px] rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {flow.startTournament.isPending ? "Iniciando…" : "Iniciar torneio"}
        </button>
      </div>

      <RoundManager
        tournamentId={id}
        currentRound={currentRound || 1}
        roundId={round?.id ?? null}
        totalRounds={Number(t?.total_swiss_rounds ?? 5)}
      />

      {phase === "swiss_complete" && (
        <section className="surface-card rounded-xl p-4">
          <h3 className="mb-2 text-lg font-semibold">Top Cut</h3>
          <button
            type="button"
            disabled={flow.advanceTopCut.isPending}
            onClick={() => void flow.advanceTopCut.mutateAsync()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Iniciar Top Cut
          </button>
        </section>
      )}

      <section>
        <h3 className="mb-4 text-lg font-semibold">Standings</h3>
        <StandingsTable standings={(standings as never[]) ?? []} />
      </section>

      {prizePool > 0 && (
        <section className="surface-card rounded-xl p-4">
          <h3 className="mb-2 text-lg font-semibold">Premiação</h3>
          <p className="text-sm text-muted-foreground">Pool: R$ {prizePool.toFixed(2)}</p>
        </section>
      )}

      {currentRound > 0 && (
        <section>
          <h3 className="mb-4 text-lg font-semibold">Pairings — Rodada {currentRound}</h3>
          <PairingsView pairings={pairings as never[]} />
        </section>
      )}
    </div>
  );
}

function Dashboard() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = String(params.id);
  const { user } = useJudgeAuth();
  const { data: tournament } = useTournamentDetail(id);
  const t = tournament as Record<string, unknown> | undefined;
  const isOrganizer = Boolean(user?.id && t?.created_by && user.id === String(t.created_by));

  useEffect(() => {
    if (searchParams.get("registered") === "1") {
      showToast("Inscrição confirmada!", "success");
    }
  }, [searchParams]);

  return (
    <div className="luxury-page pb-8">
      <main className="container mx-auto space-y-8 px-4 py-8">
        <TournamentPublicSection id={id} />
        {isOrganizer && <OrganizerSection id={id} />}
        {!isOrganizer && user && (
          <p className="text-xs text-muted-foreground">Somente o organizador pode gerenciar rodadas.</p>
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
