"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { MessageCircle, Sparkles } from "lucide-react";
import type { TcgType } from "@/types/judge";
import { recordGrowthEvent } from "@/services/judgeGrowthApi";
import { gameSlugFromTcg } from "@/lib/judge-game-slug";
import { getTcgBrand } from "@/lib/tcg-brand";
import { cn } from "@/lib/utils";

type Props = {
  tcg: TcgType;
  sourceQuestion: string;
  suggestions: string[];
  onSelect: (question: string) => void;
  autoSubmit?: boolean;
};

export function RelatedQuestions({
  tcg,
  sourceQuestion,
  suggestions,
  onSelect,
  autoSubmit = false,
}: Props) {
  const limited = suggestions.slice(0, 5);
  if (!limited.length) return null;

  const brand = getTcgBrand(tcg);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 space-y-3"
    >
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Sparkles className="h-3.5 w-3.5 text-amber-400" aria-hidden />
        Perguntas relacionadas
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
        {limited.map((s) => (
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
            className={cn(
              "flex min-w-[200px] shrink-0 items-start gap-2 rounded-xl border border-slate-700/50 bg-slate-800/50 px-3 py-2.5 text-left transition sm:min-w-0 sm:max-w-full",
              "hover:border-[hsl(var(--tcg-accent)/0.35)] hover:bg-slate-700/50",
            )}
            style={{ "--tcg-accent": brand.accent } as CSSProperties}
          >
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <span className="text-xs leading-snug text-slate-200">{s}</span>
            <span className="ml-auto shrink-0 rounded bg-slate-700/80 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-400">
              Relacionado
            </span>
          </button>
        ))}
      </div>
      {autoSubmit && (
        <p className="text-[10px] text-slate-500">Toque para enviar automaticamente</p>
      )}
    </motion.div>
  );
}
