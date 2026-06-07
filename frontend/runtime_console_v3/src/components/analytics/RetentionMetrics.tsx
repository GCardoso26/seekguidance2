type Props = {
  returningRate: number;
  noShowRate: number;
  disputeRate?: number;
};

export function RetentionMetrics({ returningRate, noShowRate, disputeRate = 0 }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-slate-700 p-4">
        <div className="text-2xl font-bold text-emerald-400">{(returningRate * 100).toFixed(0)}%</div>
        <div className="text-xs text-slate-400">Jogadores recorrentes</div>
      </div>
      <div className="rounded-lg border border-slate-700 p-4">
        <div className="text-2xl font-bold text-amber-400">{(noShowRate * 100).toFixed(0)}%</div>
        <div className="text-xs text-slate-400">Taxa de no-show</div>
      </div>
      <div className="rounded-lg border border-slate-700 p-4">
        <div className="text-2xl font-bold text-slate-300">{(disputeRate * 100).toFixed(0)}%</div>
        <div className="text-xs text-slate-400">Disputas</div>
      </div>
    </div>
  );
}
