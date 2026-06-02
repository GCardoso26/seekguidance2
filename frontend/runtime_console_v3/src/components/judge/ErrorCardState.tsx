"use client";

import { RefreshCw } from "lucide-react";
import { useReducedMotion } from "framer-motion";

type Props = {
  onRetry?: () => void;
  message?: string;
};

export function ErrorCardState({
  onRetry,
  message = "Não foi possível consultar as regras agora. O problema pode ser temporário.",
}: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="judge-error-card flex flex-col items-center justify-center p-8 text-center">
      <div
        className={`mb-6 flex h-44 w-32 items-center justify-center rounded-xl border-2 border-slate-600 bg-gradient-to-br from-slate-700 to-slate-900 ${
          !reduceMotion ? "animate-[flip-in_0.6s_ease-out]" : ""
        }`}
        aria-hidden
      >
        <span className="text-4xl">❓</span>
      </div>

      <h2 className="mb-2 text-lg font-semibold text-[var(--tcg-text-primary)]">
        O juiz está conferindo...
      </h2>
      <p className="mb-4 max-w-sm text-sm text-[var(--tcg-text-secondary)]">{message}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="verdict-card inline-flex min-h-12 items-center gap-2 rounded-lg bg-[var(--tcg-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--tcg-primary-light)]"
        >
          <RefreshCw size={16} aria-hidden />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
