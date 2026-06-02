"use client";

import { RuleSourceCard } from "@/components/judge/RuleSourceCard";
import type { JudgeSource } from "@/types/judge";
import { getTcgBrand } from "@/lib/tcg-brand";
import type { TcgType } from "@/types/judge";

type Props = {
  sources: JudgeSource[];
  tcg: TcgType;
  highlightTerms?: string[];
  emptyMessage?: string;
};

export function RuleSourcesPanel({
  sources,
  tcg,
  highlightTerms = [],
  emptyMessage = "As fontes oficiais aparecem aqui após cada resposta.",
}: Props) {
  const brand = getTcgBrand(tcg);

  if (sources.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--tcg-border)] p-4 text-center text-sm text-[var(--tcg-text-secondary)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--tcg-text-primary)]">
        Fontes · Regras
      </h2>
      <ul className="space-y-2">
        {sources.map((source, i) => (
          <RuleSourceCard
            key={source.chunk_id ?? `${source.url}-${i}`}
            source={source}
            index={i}
            highlightTerms={highlightTerms}
            accent={brand.accent}
          />
        ))}
      </ul>
    </div>
  );
}
