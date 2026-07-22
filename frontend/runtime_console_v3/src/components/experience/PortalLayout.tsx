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
 * Portal shell — Theme Engine V2 + GameProvider + nav.
 * Same layout tree for every TCG; identity comes from theme tokens.
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
      data-mood={theme.surfaces.mood}
      data-texture={theme.surfaces.texture ?? "none"}
      data-marketplace-skin={theme.marketplace.skin}
      data-density={theme.marketplace.density}
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
