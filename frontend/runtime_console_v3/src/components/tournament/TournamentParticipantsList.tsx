"use client";

import { useTournamentParticipantsPublic } from "@/hooks/useTournamentRegistration";

type Props = {
  tournamentId: string;
};

export function TournamentParticipantsList({ tournamentId }: Props) {
  const { data, isLoading } = useTournamentParticipantsPublic(tournamentId);
  const players = data?.players ?? [];

  return (
    <section className="luxury-card rounded-xl border border-white/10 p-6" data-testid="tournament-participants-list">
      <h2 className="text-lg font-semibold">Inscritos confirmados</h2>
      <p className="mt-1 text-sm text-luxury-mist">
        {data?.registered_count ?? 0}
        {data?.max_players != null ? ` / ${data.max_players}` : ""} jogadores
      </p>

      {isLoading && <p className="mt-4 text-sm text-luxury-mist">Carregando…</p>}

      {!isLoading && players.length === 0 && (
        <p className="mt-4 text-sm text-luxury-mist">Nenhum inscrito ainda.</p>
      )}

      <ul className="mt-4 space-y-2">
        {players.map((p) => (
          <li
            key={p.label}
            className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-sm"
          >
            <span>{p.label}</span>
            <span className="text-luxury-mist">✓</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
