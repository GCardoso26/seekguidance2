"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const PHASE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  embedding: { icon: "🔍", label: "Analisando pergunta", color: "#4A90D9" },
  retrieving: { icon: "📚", label: "Buscando regras", color: "#22C55E" },
  hyde: { icon: "💭", label: "Expandindo contexto", color: "#A855F7" },
  reranking: { icon: "⚖️", label: "Verificando fontes", color: "#EAB308" },
  generating: { icon: "✍️", label: "Gerando veredito", color: "#F97316" },
};

function resolvePhase(phase: string) {
  const lower = phase.toLowerCase();
  for (const [key, cfg] of Object.entries(PHASE_CONFIG)) {
    if (lower.includes(key)) return cfg;
  }
  return { icon: "⚡", label: phase, color: "#94A3B8" };
}

type Props = {
  phase: string | null;
  className?: string;
  /** Overlay fixo no centro da mesa (streaming) */
  overlay?: boolean;
};

export function PipelineOrb({ phase, className, overlay = false }: Props) {
  const reduceMotion = useReducedMotion();
  if (!phase) return null;

  const config = resolvePhase(phase);

  const content = (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={reduceMotion ? false : { scale: 0.85, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { scale: 0.85, opacity: 0, y: -12 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="relative flex flex-col items-center"
        role="status"
        aria-live="polite"
        aria-label={config.label}
      >
        {!reduceMotion && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: config.color }}
            animate={{ scale: [1, 1.45, 1], opacity: [0.35, 0.08, 0.35] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
        )}

        <div
          className="judge-pipeline-orb relative flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 shadow-lg backdrop-blur-sm"
          style={{ borderColor: config.color }}
        >
          <span className="mb-0.5 text-2xl" aria-hidden>
            {config.icon}
          </span>
          <span className="max-w-[5.5rem] px-1 text-center text-[10px] font-medium leading-tight text-[var(--tcg-text-primary)]">
            {config.label}
          </span>
        </div>

        {!reduceMotion &&
          [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute h-2 w-2 rounded-full"
              style={{ background: config.color, top: "50%", left: "50%" }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
                delay: i * 1,
              }}
              // órbita via transform no estilo inline seria complexo — dots estáticos com bounce
            />
          ))}

        <div className="mt-3 flex gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                "h-2 w-2 rounded-full",
                !reduceMotion && "animate-bounce",
              )}
              style={{
                background: config.color,
                animationDelay: reduceMotion ? undefined : `${i * 160}ms`,
              }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );

  if (overlay) {
    return (
      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]",
          className,
        )}
      >
        {content}
      </div>
    );
  }

  return <div className={cn("my-4 flex justify-center", className)}>{content}</div>;
}
