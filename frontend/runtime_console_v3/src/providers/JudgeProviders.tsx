"use client";

import type { ReactNode } from "react";
import { UpgradeModalProvider } from "@/components/premium/UpgradeModalProvider";

/** Judge / regras / features premium — Upgrade modal sob demanda. */
export function JudgeProviders({ children }: { children: ReactNode }) {
  return <UpgradeModalProvider>{children}</UpgradeModalProvider>;
}
