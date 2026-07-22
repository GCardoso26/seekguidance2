"use client";

import { PortalLayout } from "@/components/experience/PortalLayout";
import { gameIdFromSlug } from "@/lib/tcg-tokens";
import type { ReactNode } from "react";

/** Client bridge for server `[gameSlug]/layout`. */
export function PortalLayoutBridge({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const gameId = gameIdFromSlug(slug);
  if (!gameId) return <>{children}</>;
  return (
    <PortalLayout gameId={gameId} slug={slug}>
      {children}
    </PortalLayout>
  );
}
