"use client";

type Standing = {
  rank: number;
  displayName: string;
  matchPoints: number;
  omwPercent: number;
  gwPercent: number;
  ogwPercent: number;
  status: string;
};

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  checked_in: "Ativo",
  dropped: "Drop",
  disqualified: "DQ",
  registered: "Inscrito",
};

export function StandingsTable({ standings }: { standings: Standing[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-800/80 text-slate-400">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Jogador</th>
            <th className="px-4 py-3">Pts</th>
            <th className="px-4 py-3">OMW%</th>
            <th className="px-4 py-3">GW%</th>
            <th className="px-4 py-3">OGW%</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s) => (
            <tr key={s.rank} className="border-t border-slate-800">
              <td className="px-4 py-2">{s.rank}</td>
              <td className="px-4 py-2 font-medium text-white">{s.displayName}</td>
              <td className="px-4 py-2">{s.matchPoints}</td>
              <td className="px-4 py-2">{s.omwPercent.toFixed(1)}</td>
              <td className="px-4 py-2">{s.gwPercent.toFixed(1)}</td>
              <td className="px-4 py-2">{s.ogwPercent.toFixed(1)}</td>
              <td className="px-4 py-2 text-slate-400">{STATUS_LABEL[s.status] ?? s.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
