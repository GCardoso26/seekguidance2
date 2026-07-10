"use client";

import type { Ruling } from "@/lib/rulings/schema";

type Props = {
  rulings: Ruling[];
  onApply?: (rulingId: string) => void;
};

export function SuggestedRulings({ rulings, onApply }: Props) {
  if (rulings.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma ruling sugerida para este contexto.</p>;
  }
  return (
    <ul className="space-y-2">
      {rulings.map((r) => (
        <li key={r.id} className="surface-card rounded-lg p-3">
          <p className="font-medium text-foreground">{r.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{r.question}</p>
          <p className="mt-2 text-sm text-emerald-200/90">{r.answer}</p>
          {onApply && (
            <button
              type="button"
              className="mt-2 text-xs text-purple-300 hover:underline"
              onClick={() => onApply(r.id)}
            >
              Aplicar esta ruling
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
