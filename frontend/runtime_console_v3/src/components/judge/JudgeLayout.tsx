"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart3, Clock, CreditCard, Terminal } from "lucide-react";
import { GameLayout } from "@/components/judge/GameLayout";
import { JudgeLogo } from "@/components/judge/JudgeLogo";
import { TcgLogoImage } from "@/components/judge/TcgLogoImage";
import { ServiceStatusMonitor } from "@/components/ServiceStatusMonitor";
import { LoginButton } from "@/features/auth/LoginButton";
import { UserMenu } from "@/features/auth/UserMenu";
import { useUserRole } from "@/hooks/useUserRole";
import { gameSlugFromTcg } from "@/lib/judge-game-slug";
import { getTcgBrand, tcgThemeStyle } from "@/lib/tcg-brand";
import { TcgThemeProvider } from "@/providers/tcg-theme-provider";
import type { BackendHealthState, TcgType } from "@/types/judge";
import { TCG_OPTIONS } from "@/types/judge";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  health?: BackendHealthState;
  tcg: TcgType;
  warmupReady?: boolean;
  healthScore?: number;
  onHistoryClick?: () => void;
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

function HeaderNavButton({
  href,
  onClick,
  icon: Icon,
  label,
  className,
}: {
  href?: string;
  onClick?: () => void;
  icon: typeof Clock;
  label: string;
  className?: string;
}) {
  const inner = (
    <>
      <Icon className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </>
  );
  const classes = cn(
    "inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={label}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes} aria-label={label}>
      {inner}
    </button>
  );
}

export function JudgeLayout({
  children,
  health = "offline",
  tcg,
  warmupReady = true,
  healthScore,
  onHistoryClick,
}: Props) {
  const { isAdmin } = useUserRole();
  const brand = getTcgBrand(tcg);
  const slug = gameSlugFromTcg(tcg);
  const headerDegraded = healthScore != null && healthScore < 50;
  const tcgLabel = TCG_OPTIONS.find((g) => g.id === tcg)?.label ?? brand.icon;

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
            <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <JudgeLogo size={36} />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">
                    Judge TCG
                  </p>
                  <h1 className="truncate text-sm font-bold leading-tight text-white sm:text-base">
                    Mesa de Regras
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <span
                  className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-white sm:inline-flex"
                  title={tcgLabel}
                >
                  <span className="h-5 w-8 overflow-hidden rounded">
                    <TcgLogoImage tcgId={tcg} variant="compact" selected className="scale-75" />
                  </span>
                  {tcgLabel}
                </span>

                <HeaderNavButton
                  icon={Clock}
                  label="Histórico"
                  onClick={onHistoryClick}
                />
                <HeaderNavButton icon={CreditCard} label="Preços" href="/pricing" />

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
