"use client";

import type { CSSProperties } from "react";
import { Zap } from "lucide-react";
import { VerdictIcon } from "@/components/judge/VerdictIcon";
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
import { verdictColorVar } from "@/styles/tcg-theme";
import { FeedbackButtons } from "@/components/judge/FeedbackButtons";
import { RelatedQuestions } from "@/components/judge/RelatedQuestions";
import { QuickActions } from "@/components/judge/QuickActions";
import type { JudgeHistoryItem } from "@/types/judge";
import { gameSlugFromTcg } from "@/lib/judge-game-slug";
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
  onRelatedSelect?: (question: string) => void;
  relatedAutoSubmit?: boolean;
  historyItem?: JudgeHistoryItem;
  /** Fontes exibidas na zona direita da mesa — oculta lista inline */
  hideSources?: boolean;
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
  onRelatedSelect,
  historyItem,
  hideSources = false,
  relatedAutoSubmit = false,
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
        "judge-card judge-verdict-card judge-response-card overflow-hidden rounded-2xl border",
        className,
      )}
      style={
        {
          ...themeStyle,
          "--verdict-color": verdictColorVar(parsed.label),
        } as CSSProperties
      }
    >
      <header
        className="judge-verdict-header flex items-center gap-3 border-b border-[var(--tcg-border)] px-5 py-4"
        style={{ borderColor: "var(--tcg-border)" }}
      >
        <VerdictIcon key={parsed.kind} kind={parsed.kind} />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--tcg-text-secondary)]">
            Veredito
          </p>
          <p
            className="text-2xl font-bold leading-tight text-[var(--tcg-text-primary)]"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
          >
            {parsed.label}
          </p>
        </div>
        {parsed.ruleApplied && (
          <span className="judge-rule-atom-badge ml-auto hidden rounded-full px-3 py-1.5 text-sm font-semibold sm:inline">
            {parsed.ruleApplied.replace(/^.*?(CR\s)?/i, "").slice(0, 12) || "Regra"}
          </span>
        )}
      </header>

      <div className="space-y-4 p-5 sm:p-6">
        {question && (
          <p className="text-xs text-[hsl(222_15%_50%)]">
            <span className="font-semibold">Pergunta: </span>
            {question}
          </p>
        )}

        {response.cache_hit && !isStreaming && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--tcg-primary-light)]/40 bg-[var(--tcg-primary)]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--tcg-primary-light)]">
            <Zap className="h-3 w-3" aria-hidden />
            Resposta instantânea
          </span>
        )}

        <div className="flex flex-wrap items-center gap-2 md:hidden">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              verdictBadgeClass(parsed.kind),
            )}
          >
            {parsed.label}
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

        {sources.length > 0 && !isStreaming && !hideSources && (
          <section className="space-y-3 border-t border-[hsl(var(--border))] pt-4">
            <h3 className="text-sm font-bold">Fontes da pesquisa</h3>
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

        {question && tcg && !isStreaming && response.related_questions?.length && onRelatedSelect && (
          <RelatedQuestions
            tcg={tcg}
            sourceQuestion={question}
            suggestions={response.related_questions}
            onSelect={onRelatedSelect}
            autoSubmit={relatedAutoSubmit}
          />
        )}

        {question && tcg && !isStreaming && response.success && (
          <>
            <QuickActions
              tcg={tcg}
              question={question}
              response={response}
              historyItem={historyItem}
            />
            <FeedbackButtons
              question={question}
              gameSlug={gameSlugFromTcg(tcg)}
              verdict={parsed.label}
            />
          </>
        )}
      </div>
    </article>
  );
}

export { ResponseCard as VerdictCard };
