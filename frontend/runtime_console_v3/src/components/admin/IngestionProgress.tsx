"use client";

import { useQuery } from "@tanstack/react-query";
import { getIngestionJobs } from "@/services/infrastructureApi";

type Props = {
  gameSlug?: string;
};

export function IngestionProgress({ gameSlug }: Props) {
  const jobs = useQuery({
    queryKey: ["ingestion-jobs", gameSlug],
    queryFn: getIngestionJobs,
    refetchInterval: 4000,
  });

  type JobRow = { id?: string; game_slug?: string; status?: string; stage?: string };
  const recent = ((jobs.data?.jobs ?? []) as JobRow[])
    .filter((j) => !gameSlug || j.game_slug === gameSlug)
    .slice(0, 5);

  if (jobs.isLoading) {
    return <p className="text-sm text-muted-foreground">A carregar estado…</p>;
  }

  if (!recent.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum job recente. Após o upload, execute reindex se necessário na página de ingestão.
      </p>
    );
  }

  return (
    <ul className="space-y-2 text-sm">
      {recent.map((j) => (
        <li key={j.id} className="rounded-lg border border-border/60 px-3 py-2">
          <div className="flex justify-between gap-2">
            <span className="font-medium">{j.game_slug}</span>
            <span className="text-muted-foreground">{j.status}</span>
          </div>
          {j.stage && <p className="text-xs text-muted-foreground">Etapa: {j.stage}</p>}
        </li>
      ))}
    </ul>
  );
}
