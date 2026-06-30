"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  useTournamentParticipantsAdmin,
  useTournamentRegistration,
} from "@/hooks/useTournamentRegistration";
import {
  participantStatusLabel,
  participantsToCsv,
  paymentStatusLabel,
} from "@/lib/tournament-registration";
import { showToast } from "@/lib/toast";

type Props = {
  tournamentId: string;
  tournamentName: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

export function TournamentRegistrationsManager({ tournamentId, tournamentName }: Props) {
  const { data, isLoading } = useTournamentParticipantsAdmin(tournamentId);
  const { adminAction, notifyParticipants } = useTournamentRegistration(tournamentId);

  const rows = data?.participants ?? [];

  const csvContent = useMemo(
    () =>
      participantsToCsv(
        rows.map((r) => ({
          nome: r.display_name ?? r.user_id,
          status: participantStatusLabel(r.status),
          pagamento: paymentStatusLabel(r.payment_status),
          inscrito_em: formatDate(r.created_at),
        })),
      ),
    [rows],
  );

  const exportCsv = () => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inscritos-${tournamentId.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const runAction = async (participantId: string, action: "confirm" | "cancel" | "mark_paid") => {
    try {
      await adminAction.mutateAsync({ participantId, action });
      showToast("Atualizado", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Falha", "error");
    }
  };

  const notifyAll = async () => {
    try {
      const res = await notifyParticipants.mutateAsync();
      showToast(
        `Notificação enfileirada (${String((res as { recipient_count?: number }).recipient_count ?? 0)} inscritos)`,
        "success",
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Falha ao notificar", "error");
    }
  };

  return (
    <div className="space-y-4" data-testid="tournament-registrations-manager">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={exportCsv} data-testid="export-inscritos-csv">
          Exportar CSV
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={notifyParticipants.isPending}
          onClick={() => void notifyAll()}
          data-testid="notify-inscritos-btn"
        >
          Notificar inscritos
        </Button>
      </div>

      {isLoading && <p className="text-sm text-luxury-mist">Carregando inscritos…</p>}

      {!isLoading && rows.length === 0 && (
        <p className="rounded-xl border border-white/10 p-6 text-center text-sm text-luxury-mist">
          Nenhum inscrito em {tournamentName}.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm" data-testid="inscritos-table">
          <thead className="border-b border-white/10 bg-white/5 text-luxury-mist">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Pagamento</th>
              <th className="px-4 py-3">Inscrito em</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-white/5" data-testid={`inscrito-row-${row.id}`}>
                <td className="px-4 py-3">{row.display_name ?? "—"}</td>
                <td className="px-4 py-3">{participantStatusLabel(row.status)}</td>
                <td className="px-4 py-3">{paymentStatusLabel(row.payment_status)}</td>
                <td className="px-4 py-3">{formatDate(row.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      className="rounded border border-white/10 px-2 py-1 text-xs hover:border-emerald-500/40"
                      onClick={() => void runAction(row.id, "confirm")}
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      className="rounded border border-white/10 px-2 py-1 text-xs hover:border-amber-500/40"
                      onClick={() => void runAction(row.id, "mark_paid")}
                    >
                      Marcar pago
                    </button>
                    <button
                      type="button"
                      className="rounded border border-white/10 px-2 py-1 text-xs hover:border-red-500/40"
                      onClick={() => void runAction(row.id, "cancel")}
                      data-testid={`cancel-inscrito-${row.id}`}
                    >
                      Cancelar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
