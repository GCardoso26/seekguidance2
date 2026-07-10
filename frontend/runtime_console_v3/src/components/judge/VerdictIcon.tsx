"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, HelpCircle, Minus, X } from "lucide-react";
import type { VerdictKind } from "@/lib/judge-verdict";
import { cn } from "@/lib/utils";

type Props = {
  kind: VerdictKind;
  className?: string;
};

const CONFIG: Record<
  VerdictKind,
  { Icon: typeof Check; color: string; animate: Record<string, number[]> }
> = {
  permitido: {
    Icon: Check,
    color: "text-primary-light",
    animate: { scale: [0, 1.15, 1], opacity: [0, 1, 1] },
  },
  nao_permitido: {
    Icon: X,
    color: "text-red-400",
    animate: { scale: [0, 1.1, 1], x: [0, -4, 4, -2, 0] },
  },
  depende: {
    Icon: HelpCircle,
    color: "text-primary",
    animate: { scale: [0, 1.2, 1], y: [0, -6, 0] },
  },
  informacao: {
    Icon: Minus,
    color: "text-foreground/90",
    animate: { scale: [0, 1, 1], opacity: [0, 1, 1] },
  },
  indisponivel: {
    Icon: Minus,
    color: "text-muted-foreground/70",
    animate: { scale: [0, 1, 1], opacity: [0, 1, 1] },
  },
};

export function VerdictIcon({ kind, className }: Props) {
  const reduceMotion = useReducedMotion();
  const { Icon, color, animate } = CONFIG[kind] ?? CONFIG.informacao;

  return (
    <motion.span
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
        className,
      )}
      style={{
        background: "color-mix(in srgb, var(--verdict-color) 35%, var(--tcg-surface-elevated))",
      }}
      initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
      animate={reduceMotion ? undefined : animate}
      transition={{ duration: 0.45, type: "spring", stiffness: 320, damping: 18 }}
      aria-hidden
    >
      <Icon className={cn("h-6 w-6", color)} strokeWidth={2.5} />
    </motion.span>
  );
}
