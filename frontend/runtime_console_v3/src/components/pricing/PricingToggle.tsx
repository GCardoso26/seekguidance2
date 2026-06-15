"use client";

import { cn } from "@/lib/utils";

type Props = {
  isAnnual: boolean;
  onChange: (isAnnual: boolean) => void;
};

export function PricingToggle({ isAnnual, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-luxury-midnight/80 p-1.5">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "rounded-full px-5 py-2 text-sm font-semibold transition",
          !isAnnual ? "bg-white/10 text-luxury-frost shadow" : "text-luxury-mist hover:text-luxury-frost",
        )}
      >
        Mensal
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "rounded-full px-5 py-2 text-sm font-semibold transition",
          isAnnual ? "bg-luxury-gold text-luxury-onyx shadow" : "text-luxury-mist hover:text-luxury-frost",
        )}
      >
        Anual
        <span className="ml-1.5 text-xs font-bold text-luxury-gold-light">-20%</span>
      </button>
    </div>
  );
}
