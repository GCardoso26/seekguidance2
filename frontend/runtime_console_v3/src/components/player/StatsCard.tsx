type Props = {
  label: string;
  value: number | string;
  icon?: string;
};

export function StatsCard({ label, value, icon }: Props) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 text-center">
      {icon && <div className="text-2xl">{icon}</div>}
      <div className="mt-1 text-2xl font-bold text-amber-400">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}
