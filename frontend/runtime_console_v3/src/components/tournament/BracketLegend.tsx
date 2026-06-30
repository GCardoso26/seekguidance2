import { MATCH_STATUS_STYLES } from "@/lib/tournament-bracket";

const ITEMS = [
  { key: "open", label: "Aberto", className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  { key: "active", label: "Em andamento", className: MATCH_STATUS_STYLES.active },
  { key: "completed", label: "Finalizado", className: "border-white/10 bg-white/5 text-luxury-mist" },
  { key: "bye", label: "BYE", className: MATCH_STATUS_STYLES.bye },
] as const;

export function BracketLegend() {
  return (
    <div
      className="flex flex-wrap gap-3 text-xs text-luxury-mist"
      data-testid="bracket-legend"
    >
      {ITEMS.map((item) => (
        <span
          key={item.key}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${item.className}`}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}
