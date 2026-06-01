"use client";

import type { CSSProperties } from "react";
import { ResponseCard } from "@/components/judge/ResponseCard";
import { ErrorPanel } from "@/components/judge/ErrorPanel";
import { ResponseSkeleton } from "@/components/judge/ResponseSkeleton";
import { StreamingIndicator } from "@/components/judge/StreamingIndicator";
import { getTcgBrand } from "@/lib/tcg-brand";
import type { JudgeThreadTurn } from "@/lib/judge-thread";
import type { JudgeHistoryItem, TcgType } from "@/types/judge";

type Props = {
  tcg: TcgType;
  turns: JudgeThreadTurn[];
  onRelatedSelect?: (question: string) => void;
  historyByTurnId?: Record<string, JudgeHistoryItem>;
};

export function JudgeThread({ tcg, turns, onRelatedSelect, historyByTurnId }: Props) {
  const brand = getTcgBrand(tcg);

  if (turns.length === 0) return null;

  return (
    <div className="space-y-5">
      {turns.map((turn) => (
        <article key={turn.id} className="space-y-3">
          <div
            className="ml-auto max-w-[92%] rounded-2xl rounded-br-md border border-[hsl(var(--border))] bg-white px-4 py-3 shadow-sm sm:max-w-[85%]"
            style={
              {
                "--tcg-accent": brand.accent,
                "--tcg-accent-fg": brand.accentFg,
              } as CSSProperties
            }
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[hsl(222_15%_45%)]">
              A sua pergunta
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[hsl(var(--foreground))]">{turn.question}</p>
          </div>

          {turn.loading && !turn.response && !turn.streamingPhase && !turn.streamingText && (
            <ResponseSkeleton />
          )}
          {turn.loading && turn.streamingPhase && (
            <StreamingIndicator phase={turn.streamingPhase} />
          )}

          {turn.error && !turn.loading && <ErrorPanel message={turn.error} />}

          {(turn.response || turn.streamingText) && (
            <ResponseCard
              response={
                turn.response ?? {
                  success: true,
                  answer: turn.streamingText ?? "",
                  confidence: 0,
                  sources: [],
                  runtime_confidence: 0.94,
                }
              }
              question={turn.question}
              tcg={tcg}
              accent={brand.accent}
              accentFg={brand.accentFg}
              streamingText={turn.loading ? turn.streamingText : undefined}
              isStreaming={turn.loading}
              onRelatedSelect={onRelatedSelect}
              historyItem={historyByTurnId?.[turn.id]}
            />
          )}
        </article>
      ))}
    </div>
  );
}
