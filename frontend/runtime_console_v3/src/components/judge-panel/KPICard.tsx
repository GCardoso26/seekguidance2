import { cn } from "@/lib/utils";

type Props = {
  title: string;
  value: number;
  color?: "red" | "yellow" | "green" | "purple";
};

const COLORS = {
  red: "border-red-500/40 bg-red-500/10 text-red-200",
  yellow: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  green: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  purple: "border-purple-500/40 bg-purple-500/10 text-purple-200",
};

export function KPICard({ title, value, color = "purple" }: Props) {
  return (
    <div className={cn("rounded-xl border p-4", COLORS[color])}>
      <p className="text-xs uppercase tracking-wider text-white/60">{title}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}
