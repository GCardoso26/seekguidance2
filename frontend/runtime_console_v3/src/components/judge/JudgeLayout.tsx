"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart3, Clock, CreditCard, Scale, Terminal } from "lucide-react";
import { GameLayout } from "@/components/judge/GameLayout";
import { TcgLogoImage } from "@/components/judge/TcgLogoImage";
import { ServiceStatusDot } from "@/components/ServiceStatusMonitor";
import { NoiseOverlay } from "@/components/luxury/effects/NoiseOverlay";
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
  online: "bg-primary-light",
  degraded: "bg-primary",
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
      <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </>
  );
  const classes = cn(
    "inline-flex items-center gap-1.5 surface-card rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/30 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/40",
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
          className="judge-app relative min-h-screen text-foreground"
          data-tcg={tcg}
          data-pattern={brand.pattern}
          style={tcgThemeStyle(tcg)}
        >
          <NoiseOverlay />
          <a href="#judge-main" className="skip-to-main">
            Saltar para o conteúdo
          </a>

          <header
            className={cn(
              "judge-header-bar judge-header-bar--dynamic sticky top-0 z-20 border-b border-luxury-gold/10 shadow-md transition-[background,filter] duration-300",
              headerDegraded && "judge-header-bar--degraded",
            )}
            data-health={health}
            data-warmup={warmupReady ? "ready" : "pending"}
          >
            <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <Link
                  href="/"
                  className="flex shrink-0 items-center gap-2.5 transition hover:opacity-90"
                  aria-label="Judge TCG — início"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                    <Scale className="h-4 w-4 text-primary" strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Judge <span className="text-primary">TCG</span>
                    </p>
                    <h1 className="truncate text-sm font-medium leading-tight text-foreground sm:text-base">
                      Mesa de Regras
                    </h1>
                  </div>
                </Link>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <span
                  className="hidden items-center gap-2 rounded-full border border-border bg-card shadow-card px-2.5 py-1 text-xs font-medium text-foreground sm:inline-flex"
                  title={tcgLabel}
                >
                  <span className="h-5 w-8 overflow-hidden rounded">
                    <TcgLogoImage tcgId={tcg} variant="compact" selected className="scale-75" />
                  </span>
                  {tcgLabel}
                </span>

                <HeaderNavButton icon={Clock} label="Histórico" onClick={onHistoryClick} />
                <HeaderNavButton icon={CreditCard} label="Preços" href="/pricing" />

                {SHOW_WARMUP_BADGE && (
                  <span
                    className="hidden items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] text-foreground/85 sm:inline-flex"
                    title={warmupReady ? "Warmup concluído" : "Aquecendo serviço"}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        warmupReady ? "bg-primary-light" : "animate-pulse bg-primary",
                      )}
                      aria-hidden
                    />
                    Warmup
                  </span>
                )}
                <LoginButton />
                <UserMenu onHistoryClick={onHistoryClick} />
                {SHOW_HEALTH_BADGE && (
                  <span
                    className="hidden items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-foreground/90 sm:inline-flex"
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
                      className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-muted/50 px-2.5 py-1 text-[10px] font-medium text-foreground/90 hover:border-primary/30 hover:bg-muted"
                    >
                      <BarChart3 size={14} aria-hidden />
                      Métricas
                    </Link>
                    <Link
                      href="/admin/console"
                      className="inline-flex items-center gap-1 rounded-full border border-luxury-gold/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20"
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

          <footer className="flex flex-wrap items-center justify-center gap-3 border-t border-border py-4 text-xs text-muted-foreground">
            <ServiceStatusDot />
            <span aria-hidden>·</span>
            Fontes oficiais indexadas ·{" "}
            <Link href={`/observability?game=${slug}`} className="text-primary hover:text-primary-light">
              Qualidade deste jogo
            </Link>
          </footer>
        </div>
      </GameLayout>
    </TcgThemeProvider>
  );
}
