"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LuxuryLayout } from "@/components/luxury/layout/LuxuryLayout";
import { getLuxuryShellVariant } from "@/lib/luxury-routes";

export function LuxurySiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const variant = getLuxuryShellVariant(pathname);

  if (variant === "none") return children;

  return <LuxuryLayout variant={variant}>{children}</LuxuryLayout>;
}
