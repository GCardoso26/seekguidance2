"use client";

import type { CSSProperties } from "react";
import { confidenceLabel, lowConfidenceNoticePt } from "@/lib/judge-confidence";
import { stripEnglishJudgeDisclaimer } from "@/lib/judge-sources";
import {
  extractHighlightTerms,
  parseJudgeVerdict,
  verdictBadgeClass,
} from "@/lib/judge-verdict";
import { cn } from "@/lib/utils";
import type { JudgeResponse } from "@/types/judge";
import { SourceCard } from "@/components/judge/SourceCard";
import { ShareVerdictButton } from "@/components/judge/ShareVerdictButton";
import type { TcgType } from "@/types/judge";

type Props = {
  response: JudgeResponse;
  question?: string;
  tcg?: TcgType;
  className?: string;
  accent?: string;
  accentFg?: string;
  streamingText?: string;
  isStreaming?: boolean;
};

export function ResponseCard({
  response,
  question,
  tcg,
  className,
  accent,
  accentFg,
  streamingText,
  isStreaming,
}: Props) {
  const parsed = parseJudgeVerdict(response);
  const displayExplanation = isStreaming
    ? stripEnglishJudgeDisclaimer(streamingText ?? parsed.explanation)
    : parsed.explanation;
  const noticeThr = response.confidence_notice_threshold;
  const confPct = Math.round((response.confidence ?? 0) * 100);
  const lowNotice = lowConfidenceNoticePt(response.confidence ?? 0, noticeThr);
  const sources = response.sources ?? [];
  const highlightTerms = extractHighlightTerms(parsed.ruleApplied, parsed.explanation);
  const themeStyle = {
    "--tcg-accent": accent ?? "0 82% 52%",
    "--tcg-accent-fg": accentFg ?? "0 0% 100%",
  } as CSSProperties;

  return (
    <article
      className={cn(
        "judge-card judge-response-card overflow-hidden rounded-2xl border border-[hsl(var(--border))]",
        className,
      )}
      style={themeStyle}
    >
      <div className="judge-response-accent h-1 bg-gradient-to-r from-[hsl(var(--tcg-accent))] to-[hsl(var(--tcg-accent)/0.55)]" />

      <div className="space-y-4 p-5 sm:p-6">
        {question && (
          <p className="text-xs text-[hsl(222_15%_50%)]">
            <span className="font-semibold">Pergunta: </span>
            {question}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              verdictBadgeClass(parsed.kind),
            )}
          >
            Veredito: {parsed.label}
          </span>
          {!isStreaming && response.success && (
            <span className="rounded-full bg-[hsl(var(--muted))] px-2.5 py-0.5 text-xs font-medium text-[hsl(222_20%_35%)]">
              Confiança: {confPct}% ({confidenceLabel(response.confidence ?? 0, noticeThr)})
            </span>
          )}
          {isStreaming && (
            <span className="rounded-full bg-[hsl(var(--muted))] px-2.5 py-0.5 text-xs font-medium text-[hsl(222_20%_35%)]">
              A redigir veredito…
            </span>
          )}
        </div>

        {parsed.ruleApplied && !isStreaming && (
          <section className="rounded-xl border border-[hsl(var(--tcg-accent)/0.2)] bg-[hsl(var(--tcg-accent)/0.06)] px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[hsl(var(--tcg-accent))]">
              Regra aplicada
            </p>
            <p className="mt-1 text-sm font-medium leading-snug text-[hsl(var(--foreground))]">
              {parsed.ruleApplied}
            </p>
          </section>
        )}

        {lowNotice && !isStreaming && (
          <p className="rounded-xl border border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/10 px-3 py-2 text-sm text-[hsl(32_80%_28%)]">
            {lowNotice}
          </p>
        )}

        <section>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[hsl(222_15%_45%)]">
            Explicação
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[hsl(var(--foreground))]">
            {displayExplanation}
            {isStreaming && (
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[hsl(var(--tcg-accent))]" />
            )}
          </p>
        </section>

        {parsed.exceptions && !isStreaming && (
          <section className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[hsl(222_15%_45%)]">
              Excepções / notas
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[hsl(222_20%_35%)]">{parsed.exceptions}</p>
          </section>
        )}

        {sources.length > 0 && !isStreaming && (
          <section className="space-y-3 border-t border-[hsl(var(--border))] pt-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold">Fontes da pesquisa</h3>
              {question && tcg && (
                <ShareVerdictButton tcg={tcg} question={question} />
              )}
            </div>
            <ul className="space-y-3">
              {sources.map((src, i) => (
                <SourceCard
                  key={`${src.title}-${i}`}
                  source={src}
                  index={i}
                  highlightTerms={highlightTerms}
                  accent={accent}
                />
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
