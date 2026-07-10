"use client";

import { cn } from "@/lib/utils";

type Props = {
  isAnnual: boolean;
  onChange: (isAnnual: boolean) => void;
};

export function PricingToggle({ isAnnual, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-border bg-muted/80 p-1.5">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "rounded-full px-5 py-2 text-sm font-semibold transition",
          !isAnnual ? "bg-muted text-foreground shadow" : "text-muted-foreground hover:text-foreground",
        )}
      >
        Mensal
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "rounded-full px-5 py-2 text-sm font-semibold transition",
          isAnnual ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground",
        )}
      >
        Anual
        <span className="ml-1.5 text-xs font-bold text-primary-light">-20%</span>
      </button>
    </div>
  );
}
