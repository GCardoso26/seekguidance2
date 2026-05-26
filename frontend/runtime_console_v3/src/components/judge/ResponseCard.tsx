"use client";

import { formatJudgeSource, lowConfidenceNoticePt, stripEnglishJudgeDisclaimer } from "@/lib/judge-sources";
import { cn } from "@/lib/utils";
import type { JudgeResponse } from "@/types/judge";
import { ExternalLink } from "lucide-react";

type Props = {
  response: JudgeResponse;
  question?: string;
  className?: string;
};

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.7) return "Alta";
  if (confidence >= 0.45) return "Média";
  return "Baixa";
}

function statusFromResponse(res: JudgeResponse): { label: string; className: string } {
  if (!res.success) {
    return { label: "Indisponível", className: "bg-[hsl(var(--danger))]/15 text-[hsl(var(--danger))]" };
  }
  const integrity = (res.integrity_status || "ok").toLowerCase();
  if (integrity !== "ok") {
    return {
      label: "Recuperação limitada",
      className: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
    };
  }
  if ((res.confidence ?? 0) < 0.45) {
    return {
      label: "Confiança baixa",
      className: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
    };
  }
  return { label: "OK", className: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]" };
}

export function ResponseCard({ response, question, className }: Props) {
  const answer = stripEnglishJudgeDisclaimer(response.answer);
  const badge = statusFromResponse(response);
  const confPct = Math.round((response.confidence ?? 0) * 100);
  const lowNotice = lowConfidenceNoticePt(response.confidence ?? 0);
  const sources = response.sources ?? [];

  return (
    <article
      className={cn(
        "judge-card overflow-hidden rounded-2xl border border-[hsl(var(--border))]",
        className,
      )}
    >
      <div className="h-1 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(0_70%_40%)]" />

      <div className="space-y-4 p-5 sm:p-6">
        {question && (
          <p className="text-xs text-[hsl(222_15%_50%)]">
            <span className="font-semibold">Pergunta: </span>
            {question}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", badge.className)}>
            {badge.label}
          </span>
          <span className="rounded-full bg-[hsl(var(--muted))] px-2.5 py-0.5 text-xs font-medium text-[hsl(222_20%_35%)]">
            Confiança: {confPct}% ({confidenceLabel(response.confidence ?? 0)})
          </span>
        </div>

        {lowNotice && (
          <p className="rounded-xl border border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/10 px-3 py-2 text-sm text-[hsl(32_80%_28%)]">
            {lowNotice}
          </p>
        )}

        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap leading-relaxed text-[hsl(var(--foreground))]">{answer}</p>
        </div>

        {sources.length > 0 && (
          <section className="space-y-3 border-t border-[hsl(var(--border))] pt-4">
            <h3 className="text-sm font-bold">Fontes da pesquisa</h3>
            <ul className="space-y-3">
              {sources.map((src, i) => {
                const f = formatJudgeSource(src, i);
                return (
                  <li
                    key={`${f.title}-${i}`}
                    className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-3"
                  >
                    <div className="flex items-start gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-xs font-bold text-white">
                        {f.index}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-snug">{f.title}</p>
                        {f.section && (
                          <p className="mt-0.5 text-xs text-[hsl(222_15%_45%)]">{f.section}</p>
                        )}
                      </div>
                      {f.hasLink && f.url && (
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-[hsl(var(--primary))] hover:opacity-80"
                          aria-label="Abrir fonte"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    {f.excerpt && (
                      <blockquote className="mt-2 border-l-2 border-[hsl(var(--primary))]/40 pl-3 text-xs leading-relaxed text-[hsl(222_20%_35%)]">
                        <span className="font-medium text-[hsl(222_15%_45%)]">Trecho: </span>
                        {f.excerpt}
                      </blockquote>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
