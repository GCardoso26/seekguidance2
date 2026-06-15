"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart3, Terminal } from "lucide-react";
import { GameLayout } from "@/components/judge/GameLayout";
import { JudgeLogo } from "@/components/judge/JudgeLogo";
import { ServiceStatusMonitor } from "@/components/ServiceStatusMonitor";
import { LoginButton } from "@/features/auth/LoginButton";
import { UserMenu } from "@/features/auth/UserMenu";
import { useUserRole } from "@/hooks/useUserRole";
import { gameSlugFromTcg } from "@/lib/judge-game-slug";
import { getTcgBrand, tcgThemeStyle } from "@/lib/tcg-brand";
import { TcgThemeProvider } from "@/providers/tcg-theme-provider";
import type { BackendHealthState, TcgType } from "@/types/judge";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  health?: BackendHealthState;
  tcg: TcgType;
  warmupReady?: boolean;
  healthScore?: number;
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

/** Oculto temporariamente — reativar quando necessário. */
const SHOW_WARMUP_BADGE = false;
const SHOW_HEALTH_BADGE = false;
const SHOW_ADMIN_ACTIONS = false;

export function JudgeLayout({
  children,
  health = "offline",
  tcg,
  warmupReady = true,
  healthScore,
}: Props) {
  const { isAdmin } = useUserRole();
  const brand = getTcgBrand(tcg);
  const slug = gameSlugFromTcg(tcg);
  const headerDegraded = healthScore != null && healthScore < 50;

  return (
    <TcgThemeProvider tcg={tcg}>
      <GameLayout tcg={tcg}>
        <div
          className="judge-app relative min-h-screen"
          data-tcg={tcg}
          data-pattern={brand.pattern}
          style={tcgThemeStyle(tcg)}
        >
          <ServiceStatusMonitor />

          <a href="#judge-main" className="skip-to-main">
            Saltar para o conteúdo
          </a>

          <header
            className={cn(
              "judge-header-bar judge-header-bar--dynamic sticky top-0 z-20 border-b border-white/10 shadow-md transition-[background,filter] duration-300",
              headerDegraded && "judge-header-bar--degraded",
            )}
            data-health={health}
            data-warmup={warmupReady ? "ready" : "pending"}
          >
            <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <JudgeLogo size={40} />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">
                    Judge TCG
                  </p>
                  <h1 className="text-base font-bold leading-tight text-white sm:text-lg">
                    Mesa de Regras
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                {SHOW_WARMUP_BADGE && (
                  <span
                    className="hidden items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[10px] text-white/85 sm:inline-flex"
                    title={warmupReady ? "Warmup concluído" : "Aquecendo serviço"}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        warmupReady ? "bg-emerald-400" : "animate-pulse bg-amber-400",
                      )}
                      aria-hidden
                    />
                    Warmup
                  </span>
                )}
                <LoginButton />
                <UserMenu />
                {SHOW_HEALTH_BADGE && (
                  <span
                    className="hidden items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/90 sm:inline-flex"
                    title={HEALTH_LABEL[health]}
                  >
                    <span className={cn("h-2 w-2 rounded-full", HEALTH_DOT[health])} aria-hidden />
                    {HEALTH_LABEL[health]}
                  </span>
                )}
                {SHOW_ADMIN_ACTIONS && isAdmin && (
                  <div className="admin-actions hidden items-center gap-1 sm:flex">
                    <Link
                      href={`/observability?game=${slug}&tab=judge`}
                      className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-white/90 hover:bg-white/15"
                    >
                      <BarChart3 size={14} aria-hidden />
                      Métricas
                    </Link>
                    <Link
                      href="/admin/console"
                      className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
                    >
                      <Terminal size={14} aria-hidden />
                      Console
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main id="judge-main" className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </main>

          <footer className="border-t border-[var(--tcg-border)] py-4 text-center text-xs text-[var(--tcg-text-secondary)]">
            Fontes oficiais indexadas ·{" "}
            <Link
              href={`/observability?game=${slug}`}
              className="underline hover:text-[var(--tcg-text-primary)]"
            >
              Qualidade deste jogo
            </Link>
          </footer>
        </div>
      </GameLayout>
    </TcgThemeProvider>
  );
}
