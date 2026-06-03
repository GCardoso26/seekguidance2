"use client";

import { cn } from "@/lib/utils";

type Props = {
  isAnnual: boolean;
  onChange: (isAnnual: boolean) => void;
};

export function PricingToggle({ isAnnual, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-[#2d2d44] bg-[#1a1a2e]/80 p-1.5">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "rounded-full px-5 py-2 text-sm font-semibold transition",
          !isAnnual ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-slate-200",
        )}
      >
        Mensal
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "rounded-full px-5 py-2 text-sm font-semibold transition",
          isAnnual ? "bg-amber-500 text-slate-900 shadow" : "text-slate-400 hover:text-slate-200",
        )}
      >
        Anual
        <span className="ml-1.5 text-xs font-bold text-emerald-300">-20%</span>
      </button>
    </div>
  );
}
