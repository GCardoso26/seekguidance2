"use client";

import type { ReactNode } from "react";
import { getTcgBackgroundGradient } from "@/constants/tcgThemes";
import type { TcgType } from "@/types/judge";

type Props = {
  tcg: TcgType | null;
  children: ReactNode;
  className?: string;
};

/**
 * Wrapper que aplica gradiente temático por TCG + overlay escuro para legibilidade.
 */
export function GameLayout({ tcg, children, className }: Props) {
  const gradient = getTcgBackgroundGradient(tcg);

  return (
    <div className={className ?? "relative min-h-screen"}>
      <div
        className="pointer-events-none fixed inset-0 -z-10 transition-[background] duration-700 ease-in-out"
        style={{ background: gradient }}
        aria-hidden
      />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-background/55" aria-hidden />
      {children}
    </div>
  );
}
