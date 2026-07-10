type Props = {
  label: string;
  value: string;
  hint?: string;
  alert?: boolean;
};

export function StatCard({ label, value, hint, alert }: Props) {
  return (
    <div
      className={`rounded-xl border bg-muted/50 p-4 ${alert ? "border-red-500/40" : "border-border"}`}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
