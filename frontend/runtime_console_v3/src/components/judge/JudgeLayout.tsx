"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { JudgeLogo } from "@/components/judge/JudgeLogo";
import { LoginButton } from "@/features/auth/LoginButton";
import { UserMenu } from "@/features/auth/UserMenu";
import { getTcgBrand, tcgThemeStyle } from "@/lib/tcg-brand";
import type { BackendHealthState, TcgType } from "@/types/judge";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  sidebar?: ReactNode;
  health?: BackendHealthState;
  tcg: TcgType;
};

const HEALTH_LABEL: Record<BackendHealthState, string> = {
  online: "Serviço online",
  degraded: "Serviço degradado",
  offline: "Serviço offline",
};

const HEALTH_DOT: Record<BackendHealthState, string> = {
  online: "bg-emerald-400",
  degraded: "bg-amber-300",
  offline: "bg-red-300",
};

export function JudgeLayout({ children, sidebar, health = "offline", tcg }: Props) {
  const brand = getTcgBrand(tcg);

  return (
    <div
      className="judge-app min-h-screen text-[hsl(var(--foreground))]"
      data-tcg={tcg}
      data-pattern={brand.pattern}
      style={tcgThemeStyle(tcg)}
    >
      <header className="judge-header-bar judge-header-bar--dynamic sticky top-0 z-20 border-b border-white/10 shadow-md transition-[background] duration-300">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <JudgeLogo size={40} />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">
                Judge TCG
              </p>
              <h1 className="text-base font-bold leading-tight text-white sm:text-lg">
                Consulta de Regras
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LoginButton />
            <UserMenu />
            <span
              className="hidden items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/90 sm:inline-flex"
              title={HEALTH_LABEL[health]}
            >
              <span className={cn("h-2 w-2 rounded-full", HEALTH_DOT[health])} aria-hidden />
              {HEALTH_LABEL[health]}
            </span>
            <Link
              href="/"
              className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
            >
              Console
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:gap-8">
          <div className="min-w-0 space-y-5">{children}</div>
          {sidebar && (
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="judge-card rounded-2xl border border-[hsl(var(--border))] p-4">
                {sidebar}
              </div>
            </aside>
          )}
        </div>
      </main>

      <footer className="border-t border-[hsl(var(--border))] py-4 text-center text-xs text-[hsl(222_15%_45%)]">
        Fontes oficiais indexadas · Respostas em português quando possível
      </footer>
    </div>
  );
}
