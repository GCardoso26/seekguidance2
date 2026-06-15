import type { ReactNode } from "react";
import "@/styles/luxury-marketing.css";
import { LuxuryFooter } from "@/components/luxury/layout/LuxuryFooter";
import { LuxuryHeader } from "@/components/luxury/layout/LuxuryHeader";
import { NoiseOverlay } from "@/components/luxury/effects/NoiseOverlay";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  /** full = header + footer; minimal = header only (app pages) */
  variant?: "full" | "minimal";
};

export function LuxuryLayout({ children, variant = "full" }: Props) {
  return (
    <div className="luxury-marketing relative min-h-screen bg-luxury-onyx text-luxury-frost">
      <NoiseOverlay />
      <LuxuryHeader />
      <main className={cn(variant === "minimal" && "pt-24")}>{children}</main>
      {variant === "full" && <LuxuryFooter />}
    </div>
  );
}
