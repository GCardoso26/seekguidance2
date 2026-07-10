type Props = {
  label: string;
  value: number | string;
  icon?: string;
};

export function StatsCard({ label, value, icon }: Props) {
  return (
    <div className="surface-card/60 p-4 text-center">
      {icon && <div className="text-2xl">{icon}</div>}
      <div className="mt-1 text-2xl font-bold text-primary">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
