"use client";

import { useReducedMotion } from "motion/react";
import ShinyText from "@/components/react-bits/ShinyText";
import { cn } from "@/lib/utils";

type Props = {
  /** Texto do selo foil / preço foil — máx. 1–2 por viewport (allowlist). */
  text: string;
  className?: string;
  /** "seal" = selo Foil; "price" = valor monoespaçado */
  variant?: "seal" | "price";
};

/**
 * Reflexo foil contido — linguagem Galeria, sem neon default do React Bits.
 */
export function FoilShinyText({ text, className, variant = "seal" }: Props) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <span
        className={cn(
          variant === "price" ? "font-mono font-semibold tabular-nums" : "font-mono text-caption uppercase tracking-wide",
          "text-muted-foreground",
          className,
        )}
      >
        {text}
      </span>
    );
  }

  return (
    <ShinyText
      text={text}
      speed={2.4}
      yoyo
      delay={0.8}
      spread={110}
      color="oklch(0.52 0.02 90)"
      shineColor="oklch(0.92 0.02 95)"
      className={cn(
        variant === "price"
          ? "font-mono text-lg font-semibold tracking-tight"
          : "font-mono text-caption font-medium uppercase tracking-[0.08em]",
        className,
      )}
    />
  );
}
