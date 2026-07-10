"use client";

import { Download } from "lucide-react";
import { useMemo, useState } from "react";

type Standing = {
  rank: number;
  displayName: string;
  matchPoints: number;
  matchWins?: number;
  matchLosses?: number;
  matchDraws?: number;
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

type SortKey = "rank" | "matchPoints" | "omwPercent" | "gwPercent";

export function StandingsTable({ standings }: { standings: Standing[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [asc, setAsc] = useState(true);

  const sorted = useMemo(() => {
    const copy = [...standings];
    copy.sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return asc ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return copy;
  }, [standings, sortKey, asc]);

  const exportCsv = () => {
    const header = ["Rank", "Jogador", "Pts", "Record", "OMW%", "GW%", "OGW%", "Status"];
    const rows = sorted.map((s) => {
      const w = s.matchWins ?? 0;
      const l = s.matchLosses ?? 0;
      const d = s.matchDraws ?? 0;
      return [
        s.rank,
        s.displayName,
        s.matchPoints,
        `${w}-${l}-${d}`,
        s.omwPercent.toFixed(1),
        s.gwPercent.toFixed(1),
        s.ogwPercent.toFixed(1),
        STATUS_LABEL[s.status] ?? s.status,
      ];
    });
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "standings.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(key === "rank");
    }
  };

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-3 text-sm focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Download className="h-4 w-4" strokeWidth={1.5} />
          Exportar CSV
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800/80 text-slate-400">
            <tr>
              {(
                [
                  ["rank", "#"],
                  ["matchPoints", "Pts"],
                  ["omwPercent", "OMW%"],
                  ["gwPercent", "GW%"],
                ] as const
              ).map(([key, label]) => (
                <th key={key} className="px-4 py-3">
                  <button type="button" onClick={() => toggleSort(key)} className="hover:text-foreground">
                    {label}
                  </button>
                </th>
              ))}
              <th className="px-4 py-3">Jogador</th>
              <th className="px-4 py-3">Record</th>
              <th className="px-4 py-3">OGW%</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => (
              <tr key={s.rank} className="border-t border-slate-800">
                <td className="px-4 py-2">{s.rank}</td>
                <td className="px-4 py-2">{s.matchPoints}</td>
                <td className="px-4 py-2">{s.omwPercent.toFixed(1)}</td>
                <td className="px-4 py-2">{s.gwPercent.toFixed(1)}</td>
                <td className="px-4 py-2 font-medium text-foreground">{s.displayName}</td>
                <td className="px-4 py-2">
                  {s.matchWins ?? 0}-{s.matchLosses ?? 0}-{s.matchDraws ?? 0}
                </td>
                <td className="px-4 py-2">{s.ogwPercent.toFixed(1)}</td>
                <td className="px-4 py-2 text-slate-400">{STATUS_LABEL[s.status] ?? s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
