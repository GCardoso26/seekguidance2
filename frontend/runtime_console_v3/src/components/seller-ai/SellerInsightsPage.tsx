"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { usePrepareSellerAction, useSellerAiInsights } from "@/hooks/useSellerAiInsights";
import { useSellerAiBrief } from "@/hooks/useSellerAiBrief";
import type { InsightPriority, SellerInsight } from "@/types/seller-ai";
import { cn } from "@/lib/utils";

const PRIORITY_LABELS: Record<InsightPriority, string> = {
  high: "Alta prioridade",
  medium: "Média prioridade",
  low: "Baixa prioridade",
};

const PRIORITY_STYLES: Record<InsightPriority, string> = {
  high: "border-red-500/30 bg-red-500/5",
  medium: "border-amber-500/30 bg-amber-500/5",
  low: "border-border bg-muted/50",
};

type Tab = "all" | "pricing" | "history";

function InsightCard({
  insight,
  onPrepare,
}: {
  insight: SellerInsight;
  onPrepare?: (ins: SellerInsight) => void;
}) {
  return (
    <article
      className={cn("rounded-xl border p-4", PRIORITY_STYLES[insight.priority])}
      data-testid={`insight-${insight.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">
            {PRIORITY_LABELS[insight.priority]}
          </p>
          <h4 className="mt-1 font-semibold text-foreground">{insight.title}</h4>
        </div>
        {insight.metric_value != null && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{insight.metric_value}</span>
        )}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{insight.description}</p>
      <dl className="mt-3 space-y-1 text-xs">
        <div>
          <dt className="text-muted-foreground/70">Motivo</dt>
          <dd className="text-foreground">{insight.reason}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground/70">Impacto</dt>
          <dd className="text-foreground">{insight.impact}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={insight.cta_href}
          className="rounded-lg bg-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/90/30"
        >
          {insight.cta_label}
        </Link>
        {insight.prepared_action_type && onPrepare && (
          <button
            type="button"
            onClick={() => onPrepare(insight)}
            className="rounded-lg border border-border px-3 py-1.5 text-caption text-foreground transition-colors hover:bg-muted/80"
          >
            Preparar ação
          </button>
        )}
      </div>
    </article>
  );
}

export function SellerInsightsPage() {
  const [tab, setTab] = useState<Tab>("all");
  const { data: brief } = useSellerAiBrief();
  const { data, isLoading, refetch } = useSellerAiInsights();
  const prepare = usePrepareSellerAction();
  const [planPreview, setPlanPreview] = useState<string | null>(null);

  const insights =
    tab === "pricing"
      ? (data?.insights.filter((i) => i.category === "pricing") ?? [])
      : (data?.insights ?? []);

  const handlePrepare = async (ins: SellerInsight) => {
    const plan = await prepare.mutateAsync({
      action_type: ins.prepared_action_type ?? "bulk_price_update",
      insight_id: ins.id,
    });
    setPlanPreview(
      `${plan.title}: ${plan.items.length} itens para revisão. Confirme manualmente antes de executar.`,
    );
  };

  return (
    <PageShell>
      <SellerHeader action={null} />
      <main className="flex-1 space-y-6 overflow-y-auto p-6">
        <PageHeader
          title="Insights — Assistente da Loja"
          description="Recomendações baseadas em dados reais. Nenhuma ação é executada automaticamente."
        />

        {brief && (
          <section className="rounded-xl border border-primary/20 bg-primary/5 p-4" data-testid="seller-ai-daily-brief">
            <p className="text-sm font-medium text-foreground">{brief.greeting}</p>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{brief.summary}</p>
          </section>
        )}

        <div className="flex flex-wrap gap-2">
          {(["all", "pricing", "history"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium",
                tab === t ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground hover:bg-muted",
              )}
            >
              {t === "all" ? "Recomendações" : t === "pricing" ? "Pricing" : "Histórico"}
            </button>
          ))}
        </div>

        {planPreview && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-warning">
            {planPreview}
            <button type="button" className="ml-2 underline" onClick={() => setPlanPreview(null)}>
              Fechar
            </button>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Analisando sua loja…</p>
        ) : tab === "history" ? (
          <section className="surface-card p-4 text-sm text-muted-foreground">
            Histórico de briefings será sincronizado com o backend na Sprint 13.
            {brief?.generated_at && (
              <p className="mt-2 text-xs">Último briefing: {new Date(brief.generated_at).toLocaleString("pt-BR")}</p>
            )}
          </section>
        ) : insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma recomendação no momento. Sua loja está em dia.</p>
        ) : (
          <div className="space-y-6">
            {(["high", "medium", "low"] as InsightPriority[]).map((priority) => {
              const group = insights.filter((i) => i.priority === priority);
              if (!group.length) return null;
              return (
                <section key={priority}>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {PRIORITY_LABELS[priority]}
                  </h3>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {group.map((ins) => (
                      <InsightCard key={ins.id} insight={ins} onPrepare={handlePrepare} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => void refetch()}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Atualizar análise
        </button>
      </main>
    </PageShell>
  );
}
