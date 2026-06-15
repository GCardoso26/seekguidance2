import type { ReactNode } from "react";
import "@/styles/luxury-marketing.css";
import { LuxuryFooter } from "@/components/luxury/layout/LuxuryFooter";
import { LuxuryHeader } from "@/components/luxury/layout/LuxuryHeader";
import { NoiseOverlay } from "@/components/luxury/effects/NoiseOverlay";

type Props = {
  children: ReactNode;
};

export function LuxuryLayout({ children }: Props) {
  return (
    <div className="luxury-marketing relative min-h-screen bg-luxury-onyx text-luxury-frost">
      <NoiseOverlay />
      <LuxuryHeader />
      <main>{children}</main>
      <LuxuryFooter />
    </div>
  );
}
