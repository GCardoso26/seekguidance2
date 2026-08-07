"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PanelVariant = "seller" | "admin";

type PanelShellProps = {
  variant: PanelVariant;
  /** Tema do painel vendedor (`data-theme` em seller-panel.css) */
  theme?: "light" | "dark";
  sidebar: ReactNode;
  topBar?: ReactNode;
  children: ReactNode;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  /** Oculta sidebar (ex.: rota PDV) */
  hideSidebar?: boolean;
  mainClassName?: string;
};

const VARIANT_CLASS: Record<PanelVariant, string> = {
  seller: "seller-panel",
  admin: "admin-panel",
};

export function PanelShell({
  variant,
  theme,
  sidebar,
  topBar,
  children,
  mobileOpen,
  onCloseMobile,
  hideSidebar = false,
  mainClassName,
}: PanelShellProps) {
  const showSidebar = !hideSidebar;

  return (
    <div
      className={cn(VARIANT_CLASS[variant], "flex min-h-screen bg-background text-foreground")}
      data-theme={theme ?? "light"}
      data-shell="gallery"
    >
      {showSidebar && (
        <div className="hidden w-64 shrink-0 lg:block">
          <div className="fixed left-0 top-0 z-30 h-screen w-64">{sidebar}</div>
        </div>
      )}

      {showSidebar && mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative z-50 h-full w-64 shadow-xl">{sidebar}</div>
        </div>
      )}

      <div className={cn("flex min-h-screen flex-1 flex-col", showSidebar && "lg:ml-64")}>
        {topBar}
        <main className={cn("flex-1 overflow-y-auto", mainClassName)}>{children}</main>
      </div>
    </div>
  );
}
