"use client";

import type { ComponentProps } from "react";
import { GameMatSelector } from "@/components/judge/GameMatSelector";

type Props = Omit<ComponentProps<typeof GameMatSelector>, "variant"> & {
  showHeader?: boolean;
};

/** Grid compacto para landing — logos 64×64, sem scroll horizontal. */
export function GameMatSelectorCompact({ showHeader = false, ...props }: Props) {
  return <GameMatSelector {...props} variant="compact" showHeader={showHeader} />;
}
