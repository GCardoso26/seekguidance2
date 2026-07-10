"use client";

import type { CSSProperties } from "react";
import { getJudgeExamples } from "@/lib/judge-examples";
import { getTcgBrand } from "@/lib/tcg-brand";
import { TCG_OPTIONS, type TcgType } from "@/types/judge";

type Props = {
  tcg: TcgType;
  onExampleClick?: (question: string) => void;
};

export function JudgeEmptyState({ tcg, onExampleClick }: Props) {
  const label = TCG_OPTIONS.find((g) => g.id === tcg)?.label ?? tcg;
  const brand = getTcgBrand(tcg);
  const [ex1, ex2] = getJudgeExamples(tcg);

  return (
    <div
      className="judge-card rounded-2xl border border-dashed border-[hsl(var(--border))] p-8 text-center sm:p-10"
      style={
        {
          "--tcg-accent": brand.accent,
          "--tcg-accent-fg": brand.accentFg,
        } as CSSProperties
      }
    >
      <span
        className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--tcg-accent)/0.12)] text-caption font-black tracking-tight text-[hsl(var(--tcg-accent))]"
        aria-hidden
      >
        {brand.icon}
      </span>
      <p className="text-sm font-medium text-[hsl(222_20%_35%)]">
        Faça uma pergunta sobre as regras oficiais de{" "}
        <span className="font-semibold text-[hsl(var(--foreground))]">{label}</span>.
      </p>
      <p className="mt-2 text-xs text-[hsl(222_15%_50%)]">Exemplos para este jogo:</p>
      <ul className="mt-4 flex flex-col gap-2 sm:mx-auto sm:max-w-md">
        {[ex1, ex2].map((example) => (
          <li key={example}>
            {onExampleClick ? (
              <button
                type="button"
                onClick={() => onExampleClick(example)}
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-white px-4 py-2.5 text-left text-xs text-[hsl(222_20%_35%)] transition hover:border-[hsl(var(--tcg-accent)/0.45)] hover:shadow-sm"
              >
                &quot;{example}&quot;
              </button>
            ) : (
              <p className="text-xs text-[hsl(222_15%_50%)]">&quot;{example}&quot;</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
