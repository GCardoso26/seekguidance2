"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PhaseLatency = {
  embedding_ms?: number;
  hyde_ms?: number;
  retrieval_ms?: number;
  reranking_ms?: number;
  generation_ms?: number;
};

type Props = {
  latencyByPhase?: PhaseLatency;
};

export function JudgeLatencyChart({ latencyByPhase }: Props) {
  const data = [
    { phase: "Embedding", ms: latencyByPhase?.embedding_ms ?? 0 },
    { phase: "HyDE", ms: latencyByPhase?.hyde_ms ?? 0 },
    { phase: "Retrieval", ms: latencyByPhase?.retrieval_ms ?? 0 },
    { phase: "Rerank", ms: latencyByPhase?.reranking_ms ?? 0 },
    { phase: "Geração", ms: latencyByPhase?.generation_ms ?? 0 },
  ].filter((d) => d.ms > 0);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem dados de latência por fase.</p>;
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="phase" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit=" ms" />
          <Tooltip formatter={(v: number) => [`${v} ms`, "P50"]} />
          <Bar dataKey="ms" fill="hsl(var(--tcg-accent, 220 70% 50%))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
