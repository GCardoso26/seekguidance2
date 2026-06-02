"use client";

import { getTcgTheme } from "@/styles/tcg-theme";
import { TCG_OPTIONS, type TcgType } from "@/types/judge";

type Props = {
  tcg: TcgType;
  onExampleClick?: (question: string) => void;
};

export function EmptyTableState({ tcg, onExampleClick }: Props) {
  const label = TCG_OPTIONS.find((g) => g.id === tcg)?.label ?? tcg;
  const option = TCG_OPTIONS.find((g) => g.id === tcg);
  const theme = getTcgTheme(tcg);

  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center p-8 text-center">
      <div className="relative mb-6 h-64 w-48" aria-hidden>
        <svg viewBox="0 0 200 280" className="h-full w-full opacity-70 text-[var(--tcg-text-secondary)]">
          <rect
            x="20"
            y="40"
            width="160"
            height="200"
            rx="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="8 4"
          />
          <text x="100" y="150" textAnchor="middle" className="fill-current text-[11px] opacity-50">
            Mesa de regras
          </text>
          <rect
            x="60"
            y="200"
            width="30"
            height="40"
            rx="4"
            fill="var(--tcg-primary)"
            opacity="0.35"
            transform="rotate(-15 75 220)"
          />
          <rect
            x="110"
            y="190"
            width="30"
            height="40"
            rx="4"
            fill="var(--tcg-accent)"
            opacity="0.35"
            transform="rotate(10 125 210)"
          />
        </svg>
      </div>

      <h2 className="mb-2 text-lg font-semibold text-[var(--tcg-text-primary)]">
        {theme.emoji} Mesa de Regras
      </h2>
      <p className="max-w-xs text-sm text-[var(--tcg-text-secondary)]">
        Selecione um TCG no tapete acima e faça a sua pergunta. O juiz consulta as regras oficiais de{" "}
        <span className="font-medium text-[var(--tcg-text-primary)]">{label}</span>.
      </p>

      {option && !option.enabled && (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2">
          <p className="text-xs text-amber-300">Este jogo estará disponível em breve.</p>
        </div>
      )}

      {onExampleClick && option?.enabled && (
        <button
          type="button"
          onClick={() => onExampleClick("Como funciona a pilha?")}
          className="mt-6 min-h-12 rounded-lg border border-[var(--tcg-border)] px-4 py-2 text-sm font-medium text-[var(--tcg-primary-light)] hover:bg-white/5"
        >
          Experimentar com uma pergunta exemplo
        </button>
      )}
    </div>
  );
}
