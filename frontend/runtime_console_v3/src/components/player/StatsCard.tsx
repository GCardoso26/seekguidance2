type Props = {
  label: string;
  value: number | string;
  icon?: string;
};

export function StatsCard({ label, value, icon }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5/60 p-4 text-center">
      {icon && <div className="text-2xl">{icon}</div>}
      <div className="mt-1 text-2xl font-bold text-luxury-gold">{value}</div>
      <div className="text-xs text-luxury-mist">{label}</div>
    </div>
  );
}
