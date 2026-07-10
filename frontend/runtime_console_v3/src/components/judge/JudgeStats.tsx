"use client";

import { Card, CardContent } from "@/components/ui/card";

interface JudgeStatsProps {
  callsToday: number;
  avgResolutionTime?: string;
  rating?: number;
}

export function JudgeStats({ callsToday, avgResolutionTime = "—", rating = 0 }: JudgeStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard label="Resolvidas hoje" value={String(callsToday)} />
      <StatCard label="Tempo médio" value={avgResolutionTime} />
      <StatCard label="Rating" value={rating > 0 ? rating.toFixed(1) : "—"} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border bg-muted/50">
      <CardContent className="px-4 py-3 text-center">
        <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
        <p className="text-xl font-semibold text-primary-light">{value}</p>
      </CardContent>
    </Card>
  );
}
