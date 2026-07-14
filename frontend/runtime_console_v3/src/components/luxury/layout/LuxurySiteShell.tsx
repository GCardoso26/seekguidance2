"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { getLuxuryShellVariant } from "@/lib/luxury-routes";

const LuxuryLayout = dynamic(
  () => import("@/components/luxury/layout/LuxuryLayout").then((m) => m.LuxuryLayout),
  { ssr: true },
);

export function LuxurySiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const variant = getLuxuryShellVariant(pathname);

  if (variant === "none") return children;

  return <LuxuryLayout variant={variant}>{children}</LuxuryLayout>;
}
