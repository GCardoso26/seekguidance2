"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { GameLogViewer } from "@/components/judge-panel/GameLogViewer";
import { ResolutionForm } from "@/components/judge-panel/ResolutionForm";
import { SuggestedRulings } from "@/components/judge-panel/SuggestedRulings";
import { useGameLog } from "@/hooks/useGameLog";
import { useInfractionReport } from "@/hooks/useJudgeReports";
import { useSuggestedRulings } from "@/hooks/useSuggestedRulings";
import { trackEvent } from "@/lib/analytics";
import type { CardSnapshot } from "@/lib/game-log/schema";

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: report } = useInfractionReport(id);
  const { entries } = useGameLog(report?.match_id);
  const { data: suggested = [] } = useSuggestedRulings(report);
  const [appliedRuling, setAppliedRuling] = useState("");
  const [, setHovered] = useState<CardSnapshot | null>(null);

  async function resolveReport(data: { penalty: string; notes: string; rulingId: string }) {
    await fetch(`/api/judge/infractions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "resolved",
        resolution: {
          penalty: { type: data.penalty, reason: data.notes },
          judge_notes: data.notes,
          ruling_applied: data.rulingId || appliedRuling,
          resolved_by: "judge",
        },
      }),
    });
    void trackEvent("report_resolved", { report_id: id });
    if (data.rulingId) void trackEvent("ruling_applied", { ruling_id: data.rulingId });
    router.push("/judge/dashboard");
  }

  if (!report) {
    return <p className="text-white/50">Carregando report...</p>;
  }

  return (
    <div className="flex min-h-[70vh] flex-col gap-4 lg:flex-row">
      <div className="lg:w-1/2 overflow-auto rounded-xl border border-border p-4">
        <h2 className="mb-3 font-semibold">Game log — {report.match_id}</h2>
        <GameLogViewer
          entries={entries}
          highlightedSequences={report.evidence?.log_sequences}
          onCardHover={setHovered}
        />
      </div>
      <div className="lg:w-1/2 space-y-4 rounded-xl border border-border p-4">
        <div>
          <h2 className="font-semibold">{report.type}</h2>
          <p className="text-sm text-white/60">{report.description}</p>
          <p className="mt-1 text-xs text-amber-300">
            SLA: {new Date(report.sla_deadline).toLocaleString("pt-BR")}
          </p>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium text-white/80">Rulings sugeridas</h3>
          <SuggestedRulings rulings={suggested} onApply={setAppliedRuling} />
        </div>
        <ResolutionForm onSubmit={resolveReport} />
      </div>
    </div>
  );
}
