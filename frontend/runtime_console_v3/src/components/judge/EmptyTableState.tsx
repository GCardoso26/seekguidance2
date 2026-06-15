"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { TcgLogoImage } from "@/components/judge/TcgLogoImage";
import { getExampleQuestions } from "@/constants/tcg-example-questions";
import { getTcgTheme } from "@/styles/tcg-theme";
import { TCG_OPTIONS, type TcgType } from "@/types/judge";
import { cn } from "@/lib/utils";

const FLOATING_TCGS: TcgType[] = ["magic", "yugioh", "pokemon"];

type Props = {
  tcg: TcgType;
  tcgSelected?: boolean;
  onExampleClick?: (question: string) => void;
};

export function EmptyTableState({ tcg, tcgSelected = true, onExampleClick }: Props) {
  const label = TCG_OPTIONS.find((g) => g.id === tcg)?.label ?? tcg;
  const option = TCG_OPTIONS.find((g) => g.id === tcg);
  const theme = getTcgTheme(tcg);
  const reduceMotion = useReducedMotion();
  const examples = getExampleQuestions(tcg).slice(0, 3);

  if (!tcgSelected) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center p-8 text-center">
        <div className="relative mb-8 flex h-32 w-full max-w-sm items-center justify-center gap-4">
          {FLOATING_TCGS.map((id, i) => (
            <motion.div
              key={id}
              className="w-20"
              animate={
                reduceMotion
                  ? undefined
                  : { y: [0, -10, 0], rotate: [-4, 4, -4] }
              }
              transition={{
                duration: 3 + i * 0.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            >
              <TcgLogoImage tcgId={id} variant="compact" selected={false} className="opacity-80" />
            </motion.div>
          ))}
        </div>
        <h2 className="mb-2 text-lg font-semibold text-[var(--tcg-text-primary)]">Mesa de Regras</h2>
        <p className="max-w-sm text-sm text-[var(--tcg-text-secondary)]">
          Arraste um TCG do carrossel para a mesa ou toque em um tapete para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center p-6 text-center sm:p-8">
      <motion.div
        key={tcg}
        initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="mb-6 w-24"
      >
        <TcgLogoImage tcgId={tcg} variant="default" selected priority className="drop-shadow-lg" />
      </motion.div>

      <h2 className="mb-2 text-lg font-semibold text-[var(--tcg-text-primary)]">
        Mesa de Regras · {theme.icon}
      </h2>
      <p className="mb-6 max-w-md text-sm text-[var(--tcg-text-secondary)]">
        Faça sua pergunta sobre{" "}
        <span className="font-medium text-[var(--tcg-text-primary)]">{label}</span> ou experimente um
        exemplo:
      </p>

      {option && !option.enabled && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2">
          <p className="text-xs text-amber-300">Este jogo estará disponível em breve.</p>
        </div>
      )}

      {onExampleClick && option?.enabled && (
        <ul className="w-full max-w-lg space-y-2 text-left">
          {examples.map((q) => (
            <li key={q}>
              <button
                type="button"
                onClick={() => onExampleClick(q)}
                className={cn(
                  "judge-card flex w-full items-start gap-3 rounded-xl border border-slate-700/50 bg-slate-900/80 p-3 text-left transition",
                  "hover:border-[var(--tcg-border)] hover:bg-slate-800/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
                )}
              >
                <MessageCircle
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--tcg-primary-light)]"
                  aria-hidden
                />
                <span className="text-sm text-slate-200">{q}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
