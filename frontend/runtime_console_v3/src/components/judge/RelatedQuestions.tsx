"use client";

import type { TcgType } from "@/types/judge";
import { recordGrowthEvent } from "@/services/judgeGrowthApi";
import { gameSlugFromTcg } from "@/lib/judge-game-slug";

type Props = {
  tcg: TcgType;
  sourceQuestion: string;
  suggestions: string[];
  onSelect: (question: string) => void;
};

export function RelatedQuestions({ tcg, sourceQuestion, suggestions, onSelect }: Props) {
  if (!suggestions.length) return null;

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(222_15%_45%)]">
        Perguntas relacionadas
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              void recordGrowthEvent({
                metric_type: "related_question_clicked",
                game: gameSlugFromTcg(tcg),
                details: { source_question: sourceQuestion, suggestion: s },
              });
              onSelect(s);
            }}
            className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.35)] px-3 py-1.5 text-left text-xs text-[hsl(222_20%_35%)] transition hover:border-[hsl(var(--tcg-accent)/0.4)] hover:bg-white"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
