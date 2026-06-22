"use client";

type Period = "7d" | "30d" | "90d" | "1y" | "all";

const OPTIONS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "1y", label: "Este ano" },
  { value: "all", label: "Todo período" },
];

type Props = {
  value: Period;
  onChange: (period: Period) => void;
};

export function PeriodSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-full px-3 py-1 text-xs ${
            value === opt.value ? "bg-luxury-gold text-luxury-onyx" : "bg-white/10"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
