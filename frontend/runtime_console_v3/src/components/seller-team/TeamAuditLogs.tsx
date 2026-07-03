"use client";

import { useTeamLogs } from "@/hooks/useSellerTeam";

export function TeamAuditLogs() {
  const { data, isLoading } = useTeamLogs();

  if (isLoading) return <p className="text-sm text-luxury-mist">Carregando logs…</p>;

  const logs = data?.logs ?? [];

  return (
    <div data-testid="team-audit-logs">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-luxury-mist">
            <th className="py-2 pr-4">Data</th>
            <th className="py-2 pr-4">Usuário</th>
            <th className="py-2 pr-4">Ação</th>
            <th className="py-2">Detalhes</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-white/5">
              <td className="py-2 pr-4 whitespace-nowrap">
                {new Date(log.created_at).toLocaleString("pt-BR")}
              </td>
              <td className="py-2 pr-4">{log.actor_name ?? log.user_id}</td>
              <td className="py-2 pr-4">{log.action}</td>
              <td className="py-2 text-luxury-mist">
                {log.details ? JSON.stringify(log.details) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {logs.length === 0 && <p className="mt-4 text-sm text-luxury-mist">Nenhum log registrado.</p>}
    </div>
  );
}
