"use client";

import Link from "next/link";
import { useState } from "react";
import { Gavel } from "lucide-react";
import { JudgeCallCard } from "@/components/judge/JudgeCallCard";
import { JudgeStats } from "@/components/judge/JudgeStats";
import { KPICard } from "@/components/judge-panel/KPICard";
import { Badge } from "@/components/ui/badge";
import { useJudgeCalls } from "@/hooks/useJudgeCalls";
import { useJudgeCertification } from "@/hooks/useJudgeCertification";
import { useJudgeReports, useJudgeStats } from "@/hooks/useJudgeReports";
import type { InfractionReport } from "@/lib/infractions/schema";

type Tab = "active" | "open" | "resolved" | "reports";

function slaColor(deadline: string): string {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms < 0) return "text-red-400";
  if (ms < 120_000) return "text-amber-300";
  return "text-emerald-300";
}

export default function JudgeDashboardPage() {
  const [tab, setTab] = useState<Tab>("active");
  const { certification, isLoading: certLoading } = useJudgeCertification();
  const { data: myCalls = [], isLoading: callsLoading } = useJudgeCalls({ assignedToMe: true });
  const { data: openPool = [] } = useJudgeCalls({ openCalls: true });
  const { data: reports = [], isLoading: reportsLoading } = useJudgeReports({ status: "open" });
  const { data: legacyStats } = useJudgeStats();

  const activeCalls = myCalls.filter((c) => c.status === "assigned");
  const openCalls = openPool.filter((c) => c.status === "open");
  const resolvedToday = myCalls.filter(
    (c) =>
      c.status === "resolved" &&
      c.resolvedAt &&
      new Date(c.resolvedAt).toDateString() === new Date().toDateString(),
  );

  if (!certLoading && !certification) {
    return (
      <div className="py-12 text-center">
        <Gavel className="mx-auto mb-4 h-16 w-16 text-white/20" />
        <h1 className="mb-2 text-2xl font-bold">Certificação Necessária</h1>
        <p className="text-white/60">
          Você precisa ser certificado como juiz para atender chamadas de torneio.
        </p>
        <p className="mt-4 text-sm text-white/40">
          Reports do Judge Assistant (Fase A) continuam disponíveis abaixo.
        </p>
        <LegacyReportsSection
          reports={reports}
          reportsLoading={reportsLoading}
          legacyStats={legacyStats}
          slaColor={slaColor}
        />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "active", label: "Ativas", count: activeCalls.length },
    { id: "open", label: "Abertas", count: openCalls.length },
    { id: "resolved", label: "Resolvidas hoje", count: resolvedToday.length },
    { id: "reports", label: "Reports (legacy)", count: reports.length },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Painel do Juiz</h1>
          {certification && (
            <p className="mt-1 text-sm text-white/60">
              Certificado:{" "}
              <Badge className="border border-emerald-500/30 bg-transparent text-emerald-300">
                {certification.gameCode} — {certification.level}
              </Badge>
            </p>
          )}
        </div>
        <div className="w-full sm:w-auto">
          <JudgeStats callsToday={resolvedToday.length} avgResolutionTime="4.2 min" rating={4.8} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              tab === t.id ? "bg-emerald-600/20 text-emerald-200" : "text-white/60 hover:text-white"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {tab !== "reports" && (
        <CallList
          tab={tab}
          loading={callsLoading}
          active={activeCalls}
          open={openCalls}
          resolved={resolvedToday}
        />
      )}

      {tab === "reports" && (
        <LegacyReportsSection
          reports={reports}
          reportsLoading={reportsLoading}
          legacyStats={legacyStats}
          slaColor={slaColor}
        />
      )}
    </div>
  );
}

function CallList({
  tab,
  loading,
  active,
  open,
  resolved,
}: {
  tab: Tab;
  loading: boolean;
  active: Parameters<typeof JudgeCallCard>[0]["call"][];
  open: Parameters<typeof JudgeCallCard>[0]["call"][];
  resolved: Parameters<typeof JudgeCallCard>[0]["call"][];
}) {
  const items = tab === "active" ? active : tab === "open" ? open : resolved;
  const type = tab === "active" ? "active" : tab === "open" ? "open" : "resolved";
  const empty =
    tab === "active"
      ? "Nenhuma chamada ativa no momento"
      : tab === "open"
        ? "Nenhuma chamada aberta"
        : "Nenhuma chamada resolvida hoje";

  if (loading) return <p className="text-white/50">Carregando chamadas...</p>;
  if (items.length === 0) {
    return <p className="rounded-xl border border-white/10 py-12 text-center text-white/50">{empty}</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((call) => (
        <JudgeCallCard key={call.id} call={call} type={type} />
      ))}
    </div>
  );
}

function LegacyReportsSection({
  reports,
  reportsLoading,
  legacyStats,
  slaColor,
}: {
  reports: InfractionReport[];
  reportsLoading: boolean;
  legacyStats?: {
    open?: number;
    investigating?: number;
    overdue?: number;
    resolvedToday?: number;
  };
  slaColor: (d: string) => string;
}) {
  return (
    <section className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KPICard title="Abertos" value={legacyStats?.open ?? 0} color="red" />
        <KPICard title="Investigando" value={legacyStats?.investigating ?? 0} color="yellow" />
        <KPICard title="Atrasados (SLA)" value={legacyStats?.overdue ?? 0} color="red" />
        <KPICard title="Resolvidos hoje" value={legacyStats?.resolvedToday ?? 0} color="green" />
      </div>
      <div>
        <h2 className="mb-3 text-lg font-semibold">Reports abertos (Judge Assistant)</h2>
        {reportsLoading && <p className="text-white/50">Carregando...</p>}
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/60">
              <tr>
                <th className="px-3 py-2">SLA</th>
                <th className="px-3 py-2">TCG</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Severidade</th>
                <th className="px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-t border-white/5">
                  <td className={`px-3 py-2 ${slaColor(r.sla_deadline)}`}>
                    {new Date(r.sla_deadline).toLocaleTimeString("pt-BR")}
                  </td>
                  <td className="px-3 py-2">{r.match_tcg ?? "—"}</td>
                  <td className="px-3 py-2">{r.type}</td>
                  <td className="px-3 py-2">{r.severity}</td>
                  <td className="px-3 py-2">
                    <Link href={`/judge/reports/${r.id}`} className="text-purple-300 hover:underline">
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!reportsLoading && reports.length === 0 && (
            <p className="px-3 py-6 text-center text-white/50">Nenhum report aberto.</p>
          )}
        </div>
      </div>
    </section>
  );
}
