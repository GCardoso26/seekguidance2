"use client";

import type { ReactNode } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { GameProvider } from "@/components/experience/GameProvider";
import { PortalNav } from "@/components/experience/PortalNav";
import { gameThemeCssVars, getGameTheme } from "@/lib/experience/game-theme";
import type { GameId } from "@/types/card";

type Props = {
  gameId: GameId;
  slug: string;
  children: ReactNode;
  /** When false, skip MobileLayout (caller already wraps). Default true. */
  withMobileLayout?: boolean;
};

/**
 * Portal shell — Theme + GameProvider + nav.
 * Same layout for every TCG; only theme/config changes.
 */
export function PortalLayout({
  gameId,
  slug,
  children,
  withMobileLayout = true,
}: Props) {
  const theme = getGameTheme(gameId);
  const body = (
    <div
      className="game-portal min-h-[50vh]"
      data-game={slug}
      style={gameThemeCssVars(theme)}
    >
      <GameProvider gameId={gameId} slug={slug}>
        <PortalNav />
        {children}
      </GameProvider>
    </div>
  );

  if (!withMobileLayout) return body;
  return <MobileLayout>{body}</MobileLayout>;
}
